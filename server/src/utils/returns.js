import { db } from "../config/db.js";
import { refundPayment } from "./orderCancellation.js";
import { sendReturnDecisionEmail } from "./orderEmails.js";

// How long after delivery a customer may raise a problem. Food is perishable,
// so this is deliberately shorter than an apparel-style window.
const RETURN_WINDOW_DAYS = Number(process.env.RETURN_WINDOW_DAYS) || 7;

const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
// falls back to the folder the upload route writes to, so an environment
// without the variable still gets working photo links
const RETURN_IMAGE_URL = process.env.RETURN_IMAGE_URL || "uploads/returns/";

export const RETURN_REASONS = ["damaged", "wrong_item", "not_as_described", "other"];

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * What a customer may still claim on an order: each delivered line, minus
 * anything already claimed on an open or approved request. A rejected request
 * frees its lines again, so a better-evidenced second attempt is possible.
 */
export const claimableLines = async (orderId, connection = db) => {
  const [lines] = await connection.query(
    `SELECT oi.id AS orderItemId, oi.productId, oi.quantity, oi.price, p.name
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.productId
     WHERE oi.orderId = ?`,
    [orderId]
  );

  const [claimed] = await connection.query(
    `SELECT ri.orderItemId, SUM(ri.quantity) AS claimed
     FROM return_request_items ri
     JOIN return_requests r ON r.id = ri.returnRequestId
     WHERE r.orderId = ? AND r.status IN ('requested','approved')
     GROUP BY ri.orderItemId`,
    [orderId]
  );

  const taken = new Map(claimed.map((c) => [Number(c.orderItemId), Number(c.claimed)]));

  return lines.map((line) => {
    const already = taken.get(Number(line.orderItemId)) || 0;
    return {
      ...line,
      productId: Number(line.productId),
      quantity: Number(line.quantity),
      price: Number(line.price),
      alreadyClaimed: already,
      claimable: Math.max(0, Number(line.quantity) - already),
      name: line.name || "(product removed)",
    };
  });
};

/**
 * Raises a return. Returns { error } for anything the caller should relay, or
 * { request } on success. Nothing is refunded here — an admin decides first.
 */
export const createReturnRequest = async ({ orderId, userId, reason, comment, items, photos = [] }) => {
  if (!RETURN_REASONS.includes(reason))
    return { error: { code: 400, message: "Choose what went wrong with the order" } };

  const [[order]] = await db.query(
    "SELECT id, userId, status, deliveredAt FROM orders WHERE id = ? AND userId = ? LIMIT 1",
    [orderId, userId]
  );

  // a stranger's order and a missing one look the same from outside
  if (!order) return { error: { code: 404, message: "Order not found" } };

  if (order.status !== "delivered")
    return {
      error: {
        code: 409,
        message:
          order.status === "cancelled"
            ? "This order was cancelled"
            : "You can report a problem once the order has been delivered",
      },
    };

  // deliveredAt can be null on orders delivered before it was stamped; treat
  // those as still open rather than refusing a legitimate claim
  if (order.deliveredAt) {
    const days = (Date.now() - new Date(order.deliveredAt).getTime()) / 86_400_000;
    if (days > RETURN_WINDOW_DAYS)
      return {
        error: {
          code: 409,
          message: `Returns close ${RETURN_WINDOW_DAYS} days after delivery — please contact us directly`,
        },
      };
  }

  const available = await claimableLines(orderId);
  const byId = new Map(available.map((l) => [Number(l.orderItemId), l]));

  const requested = [];

  for (const item of items || []) {
    const line = byId.get(Number(item.orderItemId));
    const quantity = Number(item.quantity);

    if (!line) return { error: { code: 400, message: "That item isn't part of this order" } };

    if (!Number.isInteger(quantity) || quantity < 1)
      return { error: { code: 400, message: "Choose how many you're returning" } };

    if (quantity > line.claimable)
      return {
        error: {
          code: 409,
          message: line.claimable === 0
            ? `You've already raised a return for ${line.name}`
            : `You can return at most ${line.claimable} of ${line.name}`,
        },
      };

    requested.push({ ...line, quantity });
  }

  if (!requested.length)
    return { error: { code: 400, message: "Pick at least one item to return" } };

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO return_requests (orderId, userId, reason, comment, photos)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, userId, reason, comment ? String(comment).slice(0, 1000) : null, JSON.stringify(photos)]
    );

    for (const line of requested) {
      await connection.query(
        `INSERT INTO return_request_items (returnRequestId, orderItemId, productId, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, line.orderItemId, line.productId, line.quantity, line.price]
      );
    }

    await connection.commit();

    return {
      request: {
        id: result.insertId,
        refundable: requested.reduce((sum, l) => sum + l.price * l.quantity, 0),
      },
    };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Approve or reject. On approval the value of the claimed lines is refunded
 * through Razorpay BEFORE anything is written, for the same reason
 * cancellation does it: moving money is the step that cannot be undone, so a
 * failure must leave the request untouched and retryable.
 */
export const decideReturnRequest = async ({ requestId, decision, adminNote, restock = false, adminId }) => {
  if (!["approved", "rejected"].includes(decision))
    return { error: { code: 400, message: "Decision must be approved or rejected" } };

  const [[request]] = await db.query(
    `SELECT r.*, o.userId AS orderUserId,
            p.id AS paymentId, p.status AS paymentStatus, p.razorpayPaymentId,
            p.amount, p.orderId AS payOrderId, p.refundAmount AS alreadyRefunded
     FROM return_requests r
     JOIN orders o ON o.id = r.orderId
     LEFT JOIN payments p ON p.orderId = r.orderId
     WHERE r.id = ? LIMIT 1`,
    [requestId]
  );

  if (!request) return { error: { code: 404, message: "Return request not found" } };

  if (request.status !== "requested")
    return { error: { code: 409, message: `This request was already ${request.status}` } };

  const [lines] = await db.query(
    "SELECT productId, quantity, price FROM return_request_items WHERE returnRequestId = ?",
    [requestId]
  );

  const refundable = lines.reduce((sum, l) => sum + Number(l.price) * Number(l.quantity), 0);
  const refundPaise = refundable * 100;

  let refund = null;

  if (decision === "approved" && request.paymentStatus === "paid" && request.razorpayPaymentId) {
    const remaining = Number(request.amount) - Number(request.alreadyRefunded || 0);

    if (refundPaise > remaining)
      return {
        error: {
          code: 409,
          message: `Only ₹${remaining / 100} of this payment is left to refund`,
        },
      };

    refund = await refundPayment(
      { ...request, orderId: request.payOrderId },
      { amount: refundPaise, reason: "return_approved" }
    );
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query(
      `UPDATE return_requests
       SET status = ?, adminNote = ?, restock = ?, reviewedBy = ?, reviewedAt = NOW(),
           refundAmount = ?, razorpayRefundId = ?, refundedAt = ?
       WHERE id = ?`,
      [
        decision,
        adminNote ? String(adminNote).slice(0, 500) : null,
        restock ? 1 : 0,
        adminId || null,
        refund ? refund.amount : null,
        refund ? refund.id : null,
        refund ? new Date() : null,
        requestId,
      ]
    );

    if (refund) {
      // cumulative: several returns can whittle one payment down, so the
      // payment only reads 'refunded' once nothing is left
      const totalRefunded = Number(request.alreadyRefunded || 0) + refund.amount;

      await connection.query(
        `UPDATE payments
         SET refundAmount = ?, refundedAt = NOW(), status = ?
         WHERE id = ?`,
        [totalRefunded, totalRefunded >= Number(request.amount) ? "refunded" : "paid", request.paymentId]
      );
    }

    // only when the admin says the goods are sellable again
    if (decision === "approved" && restock) {
      for (const line of lines) {
        await connection.query(
          "UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL",
          [line.quantity, line.productId]
        );
      }
    }

    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }

  sendReturnDecisionEmail(requestId);

  return { decision, refund, refundable };
};

export const listReturnRequests = async ({ status, orderId, userId } = {}) => {
  let where = " WHERE 1=1";
  const params = [];

  if (status && status !== "all") { where += " AND r.status = ?"; params.push(status); }
  if (orderId) { where += " AND r.orderId = ?"; params.push(Number(orderId)); }
  if (userId) { where += " AND r.userId = ?"; params.push(Number(userId)); }

  const [rows] = await db.query(
    `SELECT r.*, o.orderCode, u.name AS customerName, u.email AS customerEmail
     FROM return_requests r
     JOIN orders o ON o.id = r.orderId
     JOIN users u ON u.id = r.userId
     ${where}
     ORDER BY r.createdAt DESC`,
    params
  );

  for (const row of rows) {
    // stored as bare file names, sent as full URLs like every other upload
    row.photos = asArray(row.photos).map((file) => `${UPLOADS_APP_URL}${RETURN_IMAGE_URL}${file}`);
    row.refundAmount = row.refundAmount === null ? null : Number(row.refundAmount);

    const [items] = await db.query(
      `SELECT ri.productId, ri.quantity, ri.price, p.name
       FROM return_request_items ri
       LEFT JOIN products p ON p.id = ri.productId
       WHERE ri.returnRequestId = ?`,
      [row.id]
    );

    row.items = items.map((i) => ({
      productId: Number(i.productId),
      name: i.name || "(product removed)",
      quantity: Number(i.quantity),
      price: Number(i.price),
    }));

    row.refundable = row.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  return rows;
};

export { RETURN_WINDOW_DAYS };
