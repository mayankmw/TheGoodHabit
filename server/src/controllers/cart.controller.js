import { db } from "../config/db.js";

const PRODUCT_IMAGE_URL = process.env.PRODUCT_IMAGE_URL || "";
const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";

/**
 * Helper: calculate cart total from items (discountedPrice * qty).
 * Accepts items array or computes from DB if not provided.
 */
const calcCartTotal = (items) => {
  return items.reduce((s, it) => s + (it.discountedPrice || 0) * (it.quantity || 0), 0);
};

/**
 * GET USER CART
 * Returns cartId, items[], cartTotal, cartCoupons[], availableCoupons[]
 */
// GET USER CART
export const getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    // ensure cart exists
    const [cartRows] = await db.query("SELECT * FROM cart WHERE userId = ?", [userId]);
    let cartId;
    if (cartRows.length === 0) {
      const [result] = await db.query("INSERT INTO cart (userId) VALUES (?)", [userId]);
      cartId = result.insertId;
    } else {
      cartId = cartRows[0].id;
    }

    // fetch cart items with product details
    const [items] = await db.query(
      `SELECT 
         ci.id AS cartItemId,
         ci.productId,
         ci.quantity,
         p.name,
         p.image,
         p.originalPrice,
         p.discountedPrice
       FROM cart_items ci
       JOIN products p ON p.id = ci.productId
       WHERE ci.cartId = ?`,
      [cartId]
    );

    const formattedItems = items.map((item) => ({
  ...item,
  image: item.image
    ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${item.image}`
    : null,
}));

    // base total (before coupons)
    const cartTotalBeforeDiscount = calcCartTotal(formattedItems);

    // fetch cart_coupons (user-applied coupons for this cart)
    // include max_discount for percent caps
    const [cartCoupons] = await db.query(
      `SELECT cc.id, cc.cartId, cc.couponId, cc.code, cc.appliedAt, cc.is_applied,
              c.title, c.discount_type, c.value, c.max_discount, c.min_order, c.auto_award
       FROM cart_coupons cc
       JOIN coupons c ON c.id = cc.couponId
       WHERE cc.cartId = ?`,
      [cartId]
    );

    // compute simple numeric discounts only for applied coupons
    let cartDiscountTotal = 0;
    const enrichedCartCoupons = (cartCoupons || []).map((cc) => {
      const obj = { ...cc, discountApplied: 0 };

      // only calculate for actively applied coupons
      if (!cc.is_applied) return obj;

      const type = cc.discount_type;
      if (type === "flat") {
        const flat = Number(cc.value || 0);
        obj.discountApplied = Math.min(flat, cartTotalBeforeDiscount); // can't exceed subtotal
      } else if (type === "percent") {
        const pct = Number(cc.value || 0) / 100;
        let discount = Math.round(cartTotalBeforeDiscount * pct * 100) / 100;
        if (cc.max_discount) {
          discount = Math.min(discount, Number(cc.max_discount));
        }
        obj.discountApplied = Math.min(discount, cartTotalBeforeDiscount);
      } else if (type === "free_gift") {
        // free gift doesn't change numeric total in this simple implementation
        obj.discountApplied = 0;
      }

      cartDiscountTotal += Number(obj.discountApplied || 0);
      return obj;
    });

    // final cart total after coupon discounts (never negative)
    const cartTotal = Math.max(0, Math.round((cartTotalBeforeDiscount - cartDiscountTotal) * 100) / 100);

    // fetch all active coupons and mark availability based on pre-discount subtotal
    const [allCoupons] = await db.query(
      `SELECT id, code, title, description, discount_type, value, max_discount, min_order, active, auto_award
       FROM coupons
       WHERE active = 1
       ORDER BY auto_award DESC, min_order ASC`
    );

    const appliedCodes = new Set((enrichedCartCoupons || []).map((c) => c.code));
    const availableCoupons = (allCoupons || []).map((c) => {
      const meetsMin = cartTotalBeforeDiscount >= Number(c.min_order || 0);
      const alreadyApplied = appliedCodes.has(c.code);
      return {
        ...c,
        available: meetsMin && !alreadyApplied,
        alreadyApplied,
        reason: alreadyApplied ? "already_applied" : meetsMin ? "eligible" : "min_order_not_met",
      };
    });

    return res.json({
      success: true,
      cartId,
      items: formattedItems,
      cartTotal,
      cartTotalBeforeDiscount,
      cartDiscountTotal,
      cartCoupons: enrichedCartCoupons,
      availableCoupons,
    });
  } catch (err) {
    console.error("GET CART ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



// ADD TO CART
export const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  try {
    // ensure cart exists
    const [cartRows] = await db.query("SELECT * FROM cart WHERE userId = ?", [userId]);
    let cartId = cartRows.length ? cartRows[0].id : null;

    if (!cartId) {
      const [create] = await db.query("INSERT INTO cart (userId) VALUES (?)", [userId]);
      cartId = create.insertId;
    }

    // check item exists
    const [itemRows] = await db.query(
      "SELECT * FROM cart_items WHERE cartId = ? AND productId = ?",
      [cartId, productId]
    );

    if (itemRows.length > 0) {
      // update quantity
      await db.query("UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?", [
        itemRows[0].id,
      ]);
    } else {
      // insert new item
      await db.query(
        "INSERT INTO cart_items (cartId, productId, quantity) VALUES (?, ?, 1)",
        [cartId, productId]
      );
    }

    // compute updated cart total to return (optional)
    const [items] = await db.query(
      `SELECT ci.quantity, p.discountedPrice
       FROM cart_items ci
       JOIN products p ON p.id = ci.productId
       WHERE ci.cartId = ?`,
      [cartId]
    );

    const cartTotal = items.reduce((s, it) => s + (it.discountedPrice || 0) * (it.quantity || 0), 0);

    return res.json({ success: true, message: "Added to cart", cartTotal });
  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



// UPDATE QUANTITY
export const updateCartItem = async (req, res) => {
  const { cartItemId, quantity } = req.body;

  if (quantity < 1) {
    return res.json({ success: false, message: "Quantity must be at least 1" });
  }

  try {
    await db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, cartItemId]);

    // get cartId for this cartItem
    const [rows] = await db.query("SELECT cartId FROM cart_items WHERE id = ?", [cartItemId]);
    const cartId = rows[0]?.cartId;

    // compute cart total
    let cartTotal = 0;
    if (cartId) {
      const [items] = await db.query(
        `SELECT ci.quantity, p.discountedPrice
         FROM cart_items ci
         JOIN products p ON p.id = ci.productId
         WHERE ci.cartId = ?`,
        [cartId]
      );
      cartTotal = items.reduce((s, it) => s + (it.discountedPrice || 0) * (it.quantity || 0), 0);
    }

    return res.json({ success: true, cartTotal });
  } catch (err) {
    console.error("UPDATE CART ITEM ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



// REMOVE ITEM
export const removeCartItem = async (req, res) => {
  const { cartItemId } = req.body;

  try {
    // find cartId before deleting
    const [rows] = await db.query("SELECT cartId FROM cart_items WHERE id = ?", [cartItemId]);
    const cartId = rows.length ? rows[0].cartId : null;

    await db.query("DELETE FROM cart_items WHERE id = ?", [cartItemId]);

    // recompute cart total (optional) and keep cartCoupons as-is (no auto-award)
    let cartTotal = 0;
    if (cartId) {
      const [items] = await db.query(
        `SELECT ci.quantity, p.discountedPrice
         FROM cart_items ci
         JOIN products p ON p.id = ci.productId
         WHERE ci.cartId = ?`,
        [cartId]
      );
      cartTotal = items.reduce((s, it) => s + (it.discountedPrice || 0) * (it.quantity || 0), 0);

      // If you want to revoke previously auto-awarded coupons (if any exist),
      // keep your existing revoke logic here. But since you requested "don't do auto award",
      // better to not touch cart_coupons here.
    }

    return res.json({ success: true, cartTotal });
  } catch (err) {
    console.error("REMOVE CART ITEM ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



// CLEAR CART
export const clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    // find cartId
    const [cartRows] = await db.query("SELECT id FROM cart WHERE userId = ?", [userId]);
    const cartId = cartRows.length ? cartRows[0].id : null;

    // delete items
    await db.query(
      "DELETE ci FROM cart_items ci JOIN cart c ON ci.cartId = c.id WHERE c.userId = ?",
      [userId]
    );

    // NOTE: do not auto-award/remove coupons here; preserve whatever user applied manually.
    // If you want to remove cart_coupons when clearing cart, you can uncomment below:
    // if (cartId) {
    //   await db.query("DELETE FROM cart_coupons WHERE cartId = ?", [cartId]);
    // }

    return res.json({ success: true });
  } catch (err) {
    console.error("CLEAR CART ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



export const applyCoupon = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: "Coupon code required" });
  }

  try {
    // 1) find coupon by code and active
    const [couponRows] = await db.query(
      "SELECT * FROM coupons WHERE code = ? AND active = 1 LIMIT 1",
      [code]
    );
    if (couponRows.length === 0) {
      return res.status(404).json({ success: false, message: "Coupon not found or inactive" });
    }
    const coupon = couponRows[0];

    // 2) ensure cart exists for user
    const [cartRows] = await db.query("SELECT * FROM cart WHERE userId = ?", [userId]);
    let cartId;
    if (cartRows.length === 0) {
      const [result] = await db.query("INSERT INTO cart (userId) VALUES (?)", [userId]);
      cartId = result.insertId;
    } else {
      cartId = cartRows[0].id;
    }

    // 3) calculate cart total
    const [items] = await db.query(
      `SELECT ci.quantity, p.discountedPrice
       FROM cart_items ci
       JOIN products p ON p.id = ci.productId
       WHERE ci.cartId = ?`,
      [cartId]
    );
    const cartTotal = items.reduce((s, it) => s + (it.discountedPrice || 0) * (it.quantity || 0), 0);

    // 4) check min_order requirement
    const minOrder = Number(coupon.min_order || 0);
    if (cartTotal < minOrder) {
      return res.status(400).json({
        success: false,
        message: `Cart total must be at least ₹${minOrder} to use this coupon`,
        cartTotal,
      });
    }

    // 5) ensure coupon not already applied to this cart
    const [exists] = await db.query(
      "SELECT id FROM cart_coupons WHERE cartId = ? AND couponId = ?",
      [cartId, coupon.id]
    );
    if (exists.length > 0) {
      return res.status(400).json({ success: false, message: "Coupon already applied to this cart" });
    }

    // 6) insert cart_coupons (mark applied)
    await db.query(
      `INSERT INTO cart_coupons (cartId, userId, couponId, code, is_applied, appliedAt)
       VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP())`,
      [cartId, userId, coupon.id, coupon.code]
    );

    // 7) return updated cartCoupons & cartTotal (and the applied coupon)
    const [cartCoupons] = await db.query(
      `SELECT cc.id, cc.cartId, cc.couponId, cc.code, cc.is_applied, cc.appliedAt,
              c.title, c.discount_type, c.value, c.min_order
       FROM cart_coupons cc
       JOIN coupons c ON c.id = cc.couponId
       WHERE cc.cartId = ?`,
      [cartId]
    );

    return res.json({
      success: true,
      message: "Coupon applied",
      applied: {
        code: coupon.code,
        title: coupon.title,
        discount_type: coupon.discount_type,
        value: coupon.value,
        min_order: coupon.min_order,
      },
      cartTotal,
      cartCoupons,
    });
  } catch (err) {
    console.error("APPLY COUPON ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/cart.controller.js (add near other exports)
export const removeCartCoupon = async (req, res) => {
  const userId = req.user.id;
  const { cartCouponId } = req.body;

  if (!cartCouponId) {
    return res.status(400).json({ success: false, message: "cartCouponId required" });
  }

  try {
    // 1) Ensure the cartCoupon belongs to a cart owned by this user
    const [rows] = await db.query(
      `SELECT cc.id AS cartCouponId, cc.cartId, cc.couponId
       FROM cart_coupons cc
       JOIN cart c ON c.id = cc.cartId
       WHERE cc.id = ? AND c.userId = ? LIMIT 1`,
      [cartCouponId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Coupon not found for this user's cart" });
    }

    const cartId = rows[0].cartId;

    // 2) Remove or soft-unapply:
    // Option A: fully delete
    await db.query("DELETE FROM cart_coupons WHERE id = ?", [cartCouponId]);

    // Option B (alternative): mark is_applied = 0 (soft revoke)
    // await db.query("UPDATE cart_coupons SET is_applied = 0 WHERE id = ?", [cartCouponId]);

    // 3) Recompute cart total (optional) and fetch updated cartCoupons & availableCoupons
    const [items] = await db.query(
      `SELECT ci.quantity, p.discountedPrice
       FROM cart_items ci
       JOIN products p ON p.id = ci.productId
       WHERE ci.cartId = ?`,
      [cartId]
    );

    const cartTotal = (items || []).reduce((s, it) => s + (it.discountedPrice || 0) * (it.quantity || 0), 0);

    const [cartCoupons] = await db.query(
      `SELECT cc.id, cc.cartId, cc.couponId, cc.code, cc.is_applied, cc.appliedAt,
              c.title, c.discount_type, c.value, c.min_order, c.auto_award
       FROM cart_coupons cc
       JOIN coupons c ON c.id = cc.couponId
       WHERE cc.cartId = ?`,
      [cartId]
    );

    // Recompute available coupons (same logic as getCart)
    const [allCoupons] = await db.query(
      `SELECT id, code, title, description, discount_type, value, min_order, active, auto_award
       FROM coupons
       WHERE active = 1
       ORDER BY auto_award DESC, min_order ASC`
    );

    const appliedCouponCodes = new Set(cartCoupons.map((c) => c.code));

    const availableCoupons = allCoupons.map((c) => {
      const meetsMin = cartTotal >= Number(c.min_order || 0);
      const alreadyApplied = appliedCouponCodes.has(c.code);
      return {
        ...c,
        available: meetsMin && !alreadyApplied,
        alreadyApplied,
        reason: alreadyApplied ? "already_applied" : meetsMin ? "eligible" : "min_order_not_met",
      };
    });

    return res.json({
      success: true,
      message: "Coupon removed from cart",
      cartId,
      cartTotal,
      cartCoupons,
      availableCoupons,
    });
  } catch (err) {
    console.error("REMOVE CART COUPON ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

