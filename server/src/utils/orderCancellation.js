import Razorpay from "razorpay";
import { db } from "../config/db.js";
import { sendOrderCancelledEmail } from "./orderEmails.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// A customer may back out until the parcel leaves; an admin can also pull a
// shipped order (a return). Delivered orders are never cancelled — that is a
// return/refund conversation, not a cancellation.
export const CUSTOMER_CANCELLABLE = ["pending", "processing"];
export const ADMIN_CANCELLABLE = ["pending", "processing", "shipped"];

const parseJsonArray = (value) => {
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
 * Puts an order's units back. Lines recorded in orders.oversoldItems were
 * never decremented — the conditional UPDATE at payment time matched nothing —
 * so crediting them would invent inventory. Untracked products are skipped.
 */
export const restoreOrderStock = async (orderId, connection = db) => {
  const [[order]] = await connection.query(
    "SELECT oversoldItems FROM orders WHERE id = ? LIMIT 1",
    [orderId]
  );
  const neverTaken = new Set(
    parseJsonArray(order?.oversoldItems).map((line) => Number(line.productId))
  );

  const [items] = await connection.query(
    `SELECT oi.quantity, p.id AS productId
     FROM order_items oi
     JOIN products p ON p.id = oi.productId
     WHERE oi.orderId = ?`,
    [orderId]
  );

  for (const item of items) {
    if (neverTaken.has(Number(item.productId))) continue;

    await connection.query(
      "UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL",
      [item.quantity, item.productId]
    );
  }
};

/**
 * Issues a full refund, or recovers one that already went through. Razorpay
 * refuses a second full refund on the same payment, so "already refunded" is
 * treated as success and the existing refund is looked up — that is what
 * makes a retried cancellation safe after a partial failure.
 */
const refundPayment = async (payment) => {
  try {
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount,
      notes: { orderId: String(payment.orderId), reason: "order_cancelled" },
    });
    return { id: refund.id, amount: Number(refund.amount ?? payment.amount) };
  } catch (err) {
    const description = err?.error?.description || err?.message || "";

    if (/fully refunded|already.*refund/i.test(description)) {
      const existing = await razorpay.payments.fetchMultipleRefund(payment.razorpayPaymentId);
      const first = existing?.items?.[0];
      if (first) return { id: first.id, amount: Number(first.amount ?? payment.amount) };
    }

    throw err;
  }
};

/**
 * Cancels an order and refunds it if it was paid.
 *
 * Refund BEFORE the database write, on purpose: moving money is the step that
 * cannot be undone. If the refund call fails nothing has changed and the
 * caller can simply retry. If the refund succeeds and the write then fails,
 * the retry hits Razorpay's own "already refunded" guard, recovers the refund
 * id, and completes the record — so no path leaves a customer both cancelled
 * and unrefunded.
 *
 * Resolves to { error } for a rejection the caller should relay, or
 * { refund, alreadyCancelled } on success. Throws on a Razorpay failure.
 */
export const cancelOrder = async ({ orderId, userId = null, by, reason = null }) => {
  const [[order]] = await db.query(
    `SELECT o.id, o.userId, o.status,
            p.id AS paymentId, p.status AS paymentStatus,
            p.razorpayPaymentId, p.amount, p.orderId
     FROM orders o
     LEFT JOIN payments p ON p.orderId = o.id
     WHERE o.id = ?
     LIMIT 1`,
    [orderId]
  );

  // a stranger's order and a missing order look identical from outside
  if (!order || (userId !== null && Number(order.userId) !== Number(userId)))
    return { error: { code: 404, message: "Order not found" } };

  const allowed = by === "admin" ? ADMIN_CANCELLABLE : CUSTOMER_CANCELLABLE;
  const alreadyCancelled = order.status === "cancelled";
  const needsRefund = order.paymentStatus === "paid" && Boolean(order.razorpayPaymentId);

  // an order that was cancelled but whose refund never completed (a Razorpay
  // outage mid-way) is the one case where re-running this is the fix
  if (alreadyCancelled && !needsRefund)
    return { error: { code: 409, message: "This order is already cancelled" } };

  if (!alreadyCancelled && !allowed.includes(order.status))
    return {
      error: {
        code: 409,
        message:
          order.status === "shipped"
            ? "This order has already shipped — please contact us to arrange a return"
            : `This order can no longer be cancelled (${order.status})`,
      },
    };

  const refund = needsRefund ? await refundPayment(order) : null;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[locked]] = await connection.query(
      "SELECT status FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );

    // first writer wins; a second click in flight, or a refund retry, finds
    // the order already cancelled and only records the payment side
    const firstCancellation = locked.status !== "cancelled";

    if (firstCancellation) {
      await connection.query(
        `UPDATE orders
         SET status = 'cancelled', cancelledAt = NOW(), cancelledBy = ?, cancelReason = ?
         WHERE id = ?`,
        [by, reason ? String(reason).slice(0, 255) : null, orderId]
      );

      // stock is only ever decremented at payment verification, so a pending
      // order has nothing to give back
      if (order.status !== "pending") await restoreOrderStock(orderId, connection);
    }

    if (refund) {
      await connection.query(
        `UPDATE payments
         SET status = 'refunded', razorpayRefundId = ?, refundAmount = ?, refundedAt = NOW()
         WHERE id = ?`,
        [refund.id, refund.amount, order.paymentId]
      );
    }

    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }

  // fire and forget — the cancellation is recorded regardless of mail. A
  // refund-only retry sends nothing; the customer was told the first time.
  if (!alreadyCancelled) sendOrderCancelledEmail(orderId);

  return { refund, alreadyCancelled };
};
