import { db } from "../config/db.js";

/**
 * One place that decides whether a coupon may be used, and what it is worth.
 *
 * These rules previously lived in three places that disagreed: applyCoupon
 * checked active + min_order, getCart re-computed discounts with no validity
 * check at all, and getCartTotalsWithCoupons checked nothing — so a coupon
 * stayed applied after it expired, after it was deactivated, and after the
 * cart fell below its minimum.
 */

const asNumber = (value) => Number(value || 0);

/**
 * How much this coupon takes off a given subtotal.
 * free_gift is worth nothing numerically — the gift is handled separately.
 */
export const couponDiscountFor = (coupon, subtotal) => {
  const total = asNumber(subtotal);

  if (coupon.discount_type === "flat")
    return Math.min(asNumber(coupon.value), total);

  if (coupon.discount_type === "percent") {
    let discount = (total * asNumber(coupon.value)) / 100;
    // max_discount was enforced when browsing the cart but NOT at checkout,
    // so a percent coupon could exceed its own cap on the order that mattered
    if (coupon.max_discount) discount = Math.min(discount, asNumber(coupon.max_discount));
    return Math.min(Math.round(discount * 100) / 100, total);
  }

  return 0;
};

/**
 * Returns null when the coupon is usable, or { reason, message } explaining
 * why it is not. `redeemedByUser` is how many times this user has already
 * redeemed it on a completed order.
 */
export const couponRejection = (coupon, { subtotal, redeemedByUser = 0 } = {}) => {
  if (!coupon) return { reason: "not_found", message: "Coupon not found" };

  if (!coupon.active)
    return { reason: "inactive", message: `${coupon.code} is no longer available` };

  const now = new Date();

  if (coupon.starts_at && new Date(coupon.starts_at) > now)
    return { reason: "not_started", message: `${coupon.code} isn't active yet` };

  if (coupon.expires_at && new Date(coupon.expires_at) <= now)
    return { reason: "expired", message: `${coupon.code} has expired` };

  if (coupon.single_use_per_user && redeemedByUser > 0)
    return { reason: "already_used", message: `You've already used ${coupon.code}` };

  const minOrder = asNumber(coupon.min_order);
  if (asNumber(subtotal) < minOrder)
    return {
      reason: "min_order_not_met",
      message: `${coupon.code} needs a cart of at least ₹${minOrder}`,
    };

  return null;
};

/** How many times each of these coupons has been redeemed by one user. */
export const redemptionCountsForUser = async (couponIds, userId, connection = db) => {
  const ids = [...new Set((couponIds || []).map(Number).filter(Boolean))];
  if (!ids.length || !userId) return new Map();

  const [rows] = await connection.query(
    `SELECT couponId, COUNT(*) AS used
     FROM coupon_redemptions
     WHERE userId = ? AND couponId IN (${ids.map(() => "?").join(",")})
     GROUP BY couponId`,
    [userId, ...ids]
  );

  return new Map(rows.map((r) => [Number(r.couponId), Number(r.used)]));
};

/**
 * Re-checks every coupon applied to a cart and splits them into those still
 * valid and those that have to go. Nothing is written — callers decide whether
 * to drop them, because a browsing view and a checkout want different things.
 */
export const validateCartCoupons = async ({ cartId, userId, subtotal, connection = db }) => {
  const [applied] = await connection.query(
    `SELECT cc.id AS cartCouponId, cc.couponId, cc.code AS appliedCode,
            c.id, c.code, c.title, c.discount_type, c.value, c.max_discount,
            c.min_order, c.starts_at, c.expires_at, c.active,
            c.single_use_per_user, c.auto_award, c.gift_product_id
     FROM cart_coupons cc
     JOIN coupons c ON c.id = cc.couponId
     WHERE cc.cartId = ? AND cc.is_applied = 1`,
    [cartId]
  );

  const counts = await redemptionCountsForUser(
    applied.map((a) => a.couponId),
    userId,
    connection
  );

  const valid = [];
  const dropped = [];

  for (const coupon of applied) {
    const rejection = couponRejection(coupon, {
      subtotal,
      redeemedByUser: counts.get(Number(coupon.couponId)) || 0,
    });

    if (rejection) dropped.push({ ...coupon, ...rejection });
    else valid.push({ ...coupon, discountApplied: couponDiscountFor(coupon, subtotal) });
  }

  const discount = Math.min(
    valid.reduce((sum, c) => sum + asNumber(c.discountApplied), 0),
    asNumber(subtotal)
  );

  return { valid, dropped, discount: Math.round(discount * 100) / 100 };
};

/** Detaches coupons from a cart — used when they stop qualifying. */
export const dropCartCoupons = async (cartCouponIds, connection = db) => {
  const ids = [...new Set((cartCouponIds || []).map(Number).filter(Boolean))];
  if (!ids.length) return;

  await connection.query(
    `DELETE FROM cart_coupons WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids
  );
};

/**
 * Consumes the coupons an order was priced with. Called inside the payment
 * transaction, so a coupon is only ever spent against money that arrived.
 * The unique key on (couponId, orderId) makes a replayed verification a no-op.
 */
export const redeemOrderCoupons = async ({ orderId, userId, coupons, connection = db }) => {
  for (const coupon of coupons || []) {
    const couponId = Number(coupon.couponId ?? coupon.id);
    if (!couponId) continue;

    await connection.query(
      `INSERT INTO coupon_redemptions (couponId, userId, orderId, code, discountValue)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE discountValue = VALUES(discountValue)`,
      [couponId, userId, orderId, coupon.code || null, asNumber(coupon.discountApplied)]
    );
  }
};

/**
 * Gives a coupon back when an order is cancelled. Without this a single-use
 * coupon would be burnt by an order the customer never received.
 */
export const releaseOrderCoupons = async (orderId, connection = db) => {
  await connection.query("DELETE FROM coupon_redemptions WHERE orderId = ?", [orderId]);
};
