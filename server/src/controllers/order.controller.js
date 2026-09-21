import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../config/db.js";
import { fetchOrderReviews } from "./review.controller.js";
import { sendOrderConfirmedEmail } from "../utils/orderEmails.js";

const PRODUCT_IMAGE_URL = process.env.PRODUCT_IMAGE_URL || "";
const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseJsonObject = (value) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const resolvePrimaryImage = (value) => {
  const asArray = parseJsonArray(value)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  if (asArray.length) return asArray[0];

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return null;
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function getCartTotalsWithCoupons(cartId) {
  const [items] = await db.query(
    `SELECT ci.quantity, p.id AS productId, p.name, p.stock, p.discountedPrice
     FROM cart_items ci
     JOIN products p ON p.id = ci.productId
     WHERE ci.cartId = ?`,
    [cartId]
  );

  const subtotal = items.reduce(
    (sum, it) => sum + (it.discountedPrice || 0) * it.quantity,
    0
  );

  // coupons applied to this cart
  const [coupons] = await db.query(
    `SELECT cc.*, c.discount_type, c.value, c.max_discount
     FROM cart_coupons cc
     JOIN coupons c ON c.id = cc.couponId
     WHERE cc.cartId = ? AND cc.is_applied = 1`,
    [cartId]
  );

  let discount = 0;

  for (const c of coupons) {
    if (c.discount_type === "flat") {
      discount += Number(c.value || 0);
    } 
    
    else if (c.discount_type === "percent") {
      let d = (subtotal * Number(c.value || 0)) / 100;
      if (c.max_discount) d = Math.min(d, Number(c.max_discount));
      discount += d;
    }
    
    else if (c.discount_type === "free_gift") {
      // no numeric deduction, handled via gift logic
    }
  }

  discount = Math.min(discount, subtotal);

  return {
    items,
    subtotal,
    discount,
    payable: Math.max(0, subtotal - discount),
    appliedCoupons: coupons
  };
}

// Resolves which address an order should ship to: the one the client asked
// for (validated as belonging to this user), falling back to their primary
// address, falling back to their most recent one.
const resolveOrderAddress = async (userId, requestedAddressId) => {
  if (requestedAddressId) {
    const [rows] = await db.query(
      "SELECT * FROM addresses WHERE id = ? AND userId = ? LIMIT 1",
      [requestedAddressId, userId]
    );
    if (rows.length) return rows[0];
  }

  const [primaryRows] = await db.query(
    "SELECT * FROM addresses WHERE userId = ? AND isPrimary = 1 LIMIT 1",
    [userId]
  );
  if (primaryRows.length) return primaryRows[0];

  const [recentRows] = await db.query(
    "SELECT * FROM addresses WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1",
    [userId]
  );
  return recentRows[0] || null;
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.body;

    // Get user's cart
    const [cartRows] = await db.query(
      "SELECT id FROM cart WHERE userId = ?",
      [userId]
    );

    if (!cartRows.length)
      return res.status(400).json({
        success: false,
        message: "Cart empty"
      });

    const cartId = cartRows[0].id;

    const address = await resolveOrderAddress(userId, addressId);
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Please add a delivery address before checkout",
      });
    }

    // Compute total
    const { items, subtotal, discount, payable, appliedCoupons } =
      await getCartTotalsWithCoupons(cartId);

    if (payable <= 0)
      return res.status(400).json({ success:false, message:"Cart total invalid" });

    // Availability is checked at this exact point on purpose: everything above
    // is a pure read, so rejecting leaves no Razorpay order, no orders row, no
    // payments row and no burnt orderCode. stock IS NULL means untracked.
    const shortItems = items.filter(
      (it) => it.stock !== null && Number(it.stock) < Number(it.quantity)
    );

    if (shortItems.length) {
      const first = shortItems[0];
      return res.status(409).json({
        success: false,
        message:
          shortItems.length === 1
            ? Number(first.stock) === 0
              ? `${first.name} just sold out`
              : `Only ${Number(first.stock)} left of ${first.name}`
            : "Some items in your cart are no longer available in that quantity",
        unavailable: shortItems.map((it) => ({
          productId: Number(it.productId),
          name: it.name,
          requested: Number(it.quantity),
          available: Number(it.stock),
        })),
      });
    }

    const amountPaise = Math.round(payable * 100);

    // Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `order_${Date.now()}`
    });

    // 1️⃣ Create ORDER (address is snapshotted — the address book entry can
    // change or be deleted after this order is placed)
    const [orderResult] = await db.query(
      `INSERT INTO orders (
         userId, addressId,
         shippingAddressLine1, shippingAddressLine2, shippingPhone, shippingCity,
         shippingState, shippingPostalCode, shippingCountry,
         totalPrice, discountedPrice, status, appliedCoupons
       )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        userId,
        address.id,
        address.addressLine1,
        address.addressLine2,
        address.phone,
        address.city,
        address.state,
        address.postalCode,
        address.country,
        subtotal,
        payable,
        JSON.stringify(appliedCoupons),
      ]
    );

    const appOrderId = orderResult.insertId;
    const orderCode = `NB${String(appOrderId).padStart(6, "0")}`;

    await db.query(
      `UPDATE orders SET orderCode = ? WHERE id = ?`,
      [orderCode, appOrderId]
    );

    // 2️⃣ Create PAYMENT Record
    await db.query(
      `INSERT INTO payments
        (orderId, razorpayOrderId, amount, status, currency)
       VALUES (?, ?, ?, 'created', 'INR')`,
      [appOrderId, razorpayOrder.id, amountPaise]
    );

    return res.json({
      success: true,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      appOrderId,
      orderCode,
      amount: amountPaise,
      currency: "INR"
    });

  } catch (err) {
    console.error("Create Razorpay Order Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appOrderId
    } = req.body;

    // appOrderId arrives from the client and was never checked against the
    // caller. Without this, a signed-in customer could pass someone else's
    // order id and drive the status change, the order_items insert and the
    // confirmation email against that stranger's order.
    const [[ownedOrder]] = await db.query(
      "SELECT id, status FROM orders WHERE id = ? AND userId = ? LIMIT 1",
      [appOrderId, req.user.id]
    );

    if (!ownedOrder) {
      return res.status(403).json({
        success: false,
        message: "Order not found",
      });
    }

    // 'processing' is allowed so a client retry still reaches the replay guard
    // below and gets an idempotent answer. Anything further along means a fresh
    // payment would re-run the item insert and decrement stock a second time.
    if (!["pending", "processing"].includes(ownedOrder.status)) {
      return res.status(409).json({
        success: false,
        message: "This order has already been processed",
      });
    }

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await db.query(
        `UPDATE payments
         SET status = 'failed'
         WHERE razorpayOrderId = ?`,
        [razorpay_order_id]
      );

      return res.status(400).json({
        success: false,
        message: "Invalid Signature"
      });
    }

    // A replayed verify would duplicate order_items and re-send the
    // confirmation email, so a payment already marked paid short-circuits.
    const [[alreadyPaid]] = await db.query(
      "SELECT status FROM payments WHERE razorpayOrderId = ? LIMIT 1",
      [razorpay_order_id]
    );

    if (alreadyPaid?.status === "paid") {
      return res.json({ success: true, message: "Payment already verified" });
    }

    // 1️⃣ Update Payments — pull the full payment object from Razorpay so we
    // capture how it was actually paid (method + card/upi/bank/wallet info,
    // Razorpay's fee/tax), not just the id/signature the checkout handler
    // hands back. A hiccup fetching this shouldn't block the order itself,
    // since the signature above is what actually proves the payment is real.
    let method = null;
    let payerEmail = null;
    let payerContact = null;
    let details = null;

    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      method = payment.method || null;
      payerEmail = payment.email || null;
      payerContact = payment.contact || null;
      details = JSON.stringify({
        card: payment.card
          ? {
              network: payment.card.network,
              last4: payment.card.last4,
              type: payment.card.type,
              issuer: payment.card.issuer,
            }
          : null,
        bank: payment.bank || null,
        wallet: payment.wallet || null,
        vpa: payment.vpa || null,
        international: Boolean(payment.international),
        fee: payment.fee != null ? payment.fee / 100 : null,
        tax: payment.tax != null ? payment.tax / 100 : null,
      });
    } catch (fetchErr) {
      console.error("Fetch Razorpay payment details error:", fetchErr);
    }

    // Everything that records the purchase now runs as one unit on a pinned
    // connection. Before this it ran on the autocommit pool, so a failure
    // partway through the item loop left the payment marked paid, the order
    // marked processing, a half-written order_items list, stock decremented
    // for only some lines, and the customer's cart never cleared.
    let connection;

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // FOR UPDATE makes the replay guard atomic. The earlier check-then-act
      // had a window where two concurrent verifies of the same Razorpay order
      // both saw "not paid", and with stock in play that quietly double-
      // decremented inventory.
      const [[lockedPayment]] = await connection.query(
        "SELECT id, status, orderId FROM payments WHERE razorpayOrderId = ? FOR UPDATE",
        [razorpay_order_id]
      );

      // Both razorpay_order_id and appOrderId arrive from the request body, and
      // until this check nothing tied them together: the signature only proves
      // "some Razorpay order of mine was paid", not "THIS order was paid". A
      // customer could pay for a ₹99 order and pass the id of a ₹20,000 one.
      // payments.orderId records the true pairing at creation time.
      if (!lockedPayment || Number(lockedPayment.orderId) !== Number(appOrderId)) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: "This payment does not belong to that order",
        });
      }

      if (lockedPayment.status === "paid") {
        await connection.commit();
        return res.json({ success: true, message: "Payment already verified" });
      }

      await connection.query(
        `UPDATE payments
         SET razorpayPaymentId = ?,
             razorpaySignature = ?,
             status = 'paid',
             method = ?,
             email = ?,
             contact = ?,
             details = ?
         WHERE razorpayOrderId = ?`,
        [
          razorpay_payment_id,
          razorpay_signature,
          method,
          payerEmail,
          payerContact,
          details,
          razorpay_order_id,
        ]
      );

      await connection.query(
        `UPDATE orders SET status = 'processing' WHERE id = ?`,
        [appOrderId]
      );

      const [cartItems] = await connection.query(
        `SELECT ci.quantity, p.id AS productId, p.discountedPrice AS price
         FROM cart_items ci
         JOIN products p ON p.id = ci.productId
         JOIN cart c ON c.id = ci.cartId
         WHERE c.userId = ?`,
        [req.user.id]
      );

      const oversold = [];

      for (const item of cartItems) {
        await connection.query(
          `INSERT INTO order_items (orderId, productId, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [appOrderId, item.productId, item.quantity, item.price]
        );

        // Best-effort by design: the payment is already captured, so a
        // shortfall must not roll the order back — that would refuse to
        // record something the customer has been charged for. The conditional
        // UPDATE keeps stock off negative; untracked products are skipped.
        const [decremented] = await connection.query(
          `UPDATE products
           SET stock = stock - ?
           WHERE id = ? AND stock IS NOT NULL AND stock >= ?`,
          [item.quantity, item.productId, item.quantity]
        );

        if (decremented.affectedRows === 0) {
          const [[current]] = await connection.query(
            "SELECT stock FROM products WHERE id = ? LIMIT 1",
            [item.productId]
          );

          if (current && current.stock !== null) {
            oversold.push({
              productId: Number(item.productId),
              wanted: Number(item.quantity),
              available: Number(current.stock),
            });
          }
        }
      }

      // stored on the order so an admin sees it before packing; a console
      // line is not a control anyone can act on
      if (oversold.length) {
        await connection.query(
          "UPDATE orders SET oversoldItems = ? WHERE id = ?",
          [JSON.stringify(oversold), appOrderId]
        );
      }

      const [[cartRow]] = await connection.query(
        "SELECT id FROM cart WHERE userId = ? LIMIT 1",
        [req.user.id]
      );

      if (cartRow) {
        await connection.query("DELETE FROM cart_items WHERE cartId = ?", [
          cartRow.id,
        ]);
      }

      await connection.commit();

      // logged after the commit as well, for anyone watching the process
      for (const line of oversold) {
        console.error(
          `OVERSOLD — order ${appOrderId}: product ${line.productId} wanted ${line.wanted}, stock ${line.available}`
        );
      }
    } catch (txErr) {
      if (connection) await connection.rollback();
      // Rolling back leaves the payment row un-paid, so the client can safely
      // retry /orders/verify and the whole block replays cleanly.
      console.error("Verify payment transaction failed:", txErr);
      return res.status(500).json({
        success: false,
        message: "Could not finalise your order — please retry",
      });
    } finally {
      if (connection) connection.release();
    }

    // fire and forget, and only after the commit — a mail fault must not turn
    // a completed purchase into a 500
    sendOrderConfirmedEmail(appOrderId);

    return res.json({
      success: true,
      message: "Payment Verified"
    });

  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const { page = 1, limit = 10, status } = req.body; // since you use POST
    const offset = (page - 1) * limit;

    // ---------- COUNT QUERY ----------
    let countQuery = `SELECT COUNT(*) AS total FROM orders WHERE userId = ?`;
    let params = [userId];

    if (status && status !== "all") {
      countQuery += ` AND status = ?`;
      params.push(status);
    }

    const [[countResult]] = await db.query(countQuery, params);
    const total = countResult.total;

    // ---------- ORDERS QUERY ----------
    let ordersQuery = `
      SELECT o.id, o.orderCode, o.totalPrice, o.discountedPrice, o.status, o.createdAt,
             o.shippingAddressLine1, o.shippingAddressLine2, o.shippingPhone,
             o.shippingCity, o.shippingState, o.shippingPostalCode, o.shippingCountry,
             o.shippingPartner, o.trackingNumber, o.trackingUrl,
             o.deliveredAt, o.reviewPromptDismissedAt,
             p.method AS paymentMethod, p.status AS paymentStatus,
             p.details AS paymentDetails, p.razorpayPaymentId
      FROM orders o
      LEFT JOIN payments p ON p.orderId = o.id
      WHERE o.userId = ?
    `;

    let orderParams = [userId];

    if (status && status !== "all") {
      ordersQuery += ` AND o.status = ?`;
      orderParams.push(status);
    }

    ordersQuery += `
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    orderParams.push(Number(limit), Number(offset));

    const [orders] = await db.query(ordersQuery, orderParams);

    for (const order of orders) {
      order.paymentDetails = parseJsonObject(order.paymentDetails);

      // review state travels with the order so the card can decide between
      // showing the form, the "Review the purchase" button, or the review
      order.reviews = await fetchOrderReviews(order.id);
      order.reviewPromptDismissed = Boolean(order.reviewPromptDismissedAt);
      delete order.reviewPromptDismissedAt;
    }

    // ---------- FETCH ITEMS ----------
    for (let order of orders) {
      const [items] = await db.query(
        `SELECT 
           oi.quantity,
           oi.price,
           p.id AS productId,
           p.name,
           p.images
         FROM order_items oi
         JOIN products p ON oi.productId = p.id
         WHERE oi.orderId = ?`,
        [order.id]
      );

      order.items = items.map((item) => {
        const primaryImage = resolvePrimaryImage(item.images);
        const { images: _images, ...rest } = item;
        return {
          ...rest,
          image: primaryImage
            ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${primaryImage}`
            : null,
        };
      });
    }

    return res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      hasMore: offset + orders.length < total,
      orders,
    });

  } catch (err) {
    console.error("Fetch Orders Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const buildTrackingSteps = (order) => {
  if (order.status === "cancelled") {
    return [
      {
        key: "placed",
        label: "Order Placed",
        state: "completed",
        date: order.createdAt,
      },
      {
        key: "processing",
        label: "Processing",
        state: "pending",
        date: null,
      },
      {
        key: "shipped",
        label: "Shipped",
        state: "pending",
        date: order.shippedAt,
      },
      {
        key: "delivered",
        label: "Delivered",
        state: "pending",
        date: order.deliveredAt,
      },
    ];
  }

  const statusOrder = ["pending", "processing", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(order.status);

  return [
    {
      key: "placed",
      label: "Order Placed",
      state: currentIndex >= 0 ? "completed" : "active",
      date: order.createdAt,
    },
    {
      key: "processing",
      label: "Processing",
      state:
        currentIndex > 1
          ? "completed"
          : currentIndex === 1
          ? "active"
          : "pending",
      date: currentIndex >= 1 ? order.updatedAt : null,
    },
    {
      key: "shipped",
      label: "Shipped",
      state:
        currentIndex > 2
          ? "completed"
          : currentIndex === 2
          ? "active"
          : "pending",
      date: order.shippedAt,
    },
    {
      key: "delivered",
      label: "Delivered",
      state: currentIndex === 3 ? "active" : currentIndex > 3 ? "completed" : "pending",
      date: order.deliveredAt,
    },
  ];
};

export const trackOrderByCode = async (req, res) => {
  const { orderCode } = req.body;

  try {
    const userId = req.user.id;
    const normalizedCode = String(orderCode || "").trim().toUpperCase();

    if (!normalizedCode) {
      return res.status(400).json({
        success: false,
        message: "Order code is required",
      });
    }

    const [[order]] = await db.query(
      `
      SELECT
        id,
        orderCode,
        totalPrice,
        discountedPrice,
        status,
        shippingPartner,
        trackingNumber,
        trackingUrl,
        shippedAt,
        deliveredAt,
        createdAt,
        updatedAt
      FROM orders
      WHERE orderCode = ? AND userId = ?
      LIMIT 1
      `,
      [normalizedCode, userId]
    );

    if (!order) {
      return res.status(200).json({
        success: false,
        message: "Order not found",
      });
    }

    const [items] = await db.query(
      `SELECT
         oi.quantity,
         oi.price,
         p.id AS productId,
         p.name,
         p.images
       FROM order_items oi
       JOIN products p ON oi.productId = p.id
       WHERE oi.orderId = ?`,
      [order.id]
    );

    const formattedItems = items.map((item) => {
      const primaryImage = resolvePrimaryImage(item.images);
      const { images: _images, ...rest } = item;
      return {
        ...rest,
        image: primaryImage
          ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${primaryImage}`
          : null,
      };
    });

    return res.json({
      success: true,
      tracking: {
        orderCode: order.orderCode,
        orderId: order.id,
        status: order.status,
        statusLabel:
          order.status.charAt(0).toUpperCase() + order.status.slice(1),
        placedAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        shippingPartner: order.shippingPartner,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        summary: {
          subtotal: Number(order.totalPrice || 0),
          paid: Number(order.discountedPrice ?? order.totalPrice ?? 0),
          discount: Math.max(
            0,
            Number(order.totalPrice || 0) -
              Number(order.discountedPrice ?? order.totalPrice ?? 0)
          ),
        },
        steps: buildTrackingSteps(order),
        items: formattedItems,
      },
    });
  } catch (err) {
    console.error("Track Order Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
