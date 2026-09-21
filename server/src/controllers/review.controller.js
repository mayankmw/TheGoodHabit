import { db } from "../config/db.js";

const MAX_COMMENT_LENGTH = 1000;

// products.rating / products.reviews are denormalised for the storefront
// listings, so every write to product_reviews has to fold back into them.
// Hidden reviews are excluded, which is what makes admin moderation move the
// public star rating.
export const syncProductRatings = async (productIds) => {
  const ids = [...new Set(productIds.map(Number).filter(Boolean))];
  if (!ids.length) return;

  const placeholders = ids.map(() => "?").join(", ");

  await db.query(
    `UPDATE products p
     SET p.rating = COALESCE(
           (SELECT ROUND(AVG(r.rating), 1) FROM product_reviews r
            WHERE r.productId = p.id AND r.status = 'visible'),
           0
         ),
         p.reviews = (SELECT COUNT(*) FROM product_reviews r
                      WHERE r.productId = p.id AND r.status = 'visible')
     WHERE p.id IN (${placeholders})`,
    ids
  );
};

const fetchOrderReviews = async (orderId) => {
  const [rows] = await db.query(
    `SELECT productId, rating, comment, createdAt, updatedAt
     FROM product_reviews
     WHERE orderId = ?`,
    [orderId]
  );

  return rows.map((row) => ({
    ...row,
    productId: Number(row.productId),
    rating: Number(row.rating),
  }));
};

// Loads the order only if it belongs to the caller and is actually reviewable.
const loadReviewableOrder = async (orderId, userId) => {
  const id = Number(orderId);
  if (!id) return { error: { code: 400, message: "Order id is required" } };

  const [[order]] = await db.query(
    "SELECT id, status FROM orders WHERE id = ? AND userId = ? LIMIT 1",
    [id, userId]
  );

  if (!order) return { error: { code: 404, message: "Order not found" } };

  if (order.status !== "delivered")
    return {
      error: {
        code: 400,
        message: "You can review this order once it has been delivered",
      },
    };

  return { order };
};

export const submitOrderReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, reviews } = req.body;

    const { order, error } = await loadReviewableOrder(orderId, userId);
    if (error)
      return res.status(error.code).json({ success: false, message: error.message });

    const [items] = await db.query(
      "SELECT productId FROM order_items WHERE orderId = ?",
      [order.id]
    );
    const purchasedIds = new Set(items.map((item) => Number(item.productId)));

    const entries = Array.isArray(reviews) ? reviews : [];
    const normalized = [];
    const seen = new Set();

    for (const entry of entries) {
      const productId = Number(entry?.productId);
      const rating = Number(entry?.rating);

      if (!purchasedIds.has(productId))
        return res.status(400).json({
          success: false,
          message: "You can only review products from this order",
        });

      if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        return res.status(400).json({
          success: false,
          message: "Please pick a rating between 1 and 5 stars",
        });

      if (seen.has(productId)) continue;
      seen.add(productId);

      const comment =
        typeof entry?.comment === "string"
          ? entry.comment.trim().slice(0, MAX_COMMENT_LENGTH)
          : "";

      normalized.push({ productId, rating, comment: comment || null });
    }

    if (!normalized.length)
      return res.status(400).json({
        success: false,
        message: "Please rate at least one product before submitting",
      });

    for (const review of normalized) {
      await db.query(
        `INSERT INTO product_reviews (orderId, productId, userId, rating, comment)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
        [order.id, review.productId, userId, review.rating, review.comment]
      );
    }

    await syncProductRatings(normalized.map((review) => review.productId));

    return res.json({
      success: true,
      message: "Thanks for reviewing your purchase",
      reviews: await fetchOrderReviews(order.id),
    });
  } catch (err) {
    console.error("Submit Review Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const dismissOrderReviewPrompt = async (req, res) => {
  try {
    const userId = req.user.id;

    const { order, error } = await loadReviewableOrder(req.body.orderId, userId);
    if (error)
      return res.status(error.code).json({ success: false, message: error.message });

    await db.query(
      "UPDATE orders SET reviewPromptDismissedAt = NOW() WHERE id = ? AND userId = ?",
      [order.id, userId]
    );

    return res.json({ success: true, message: "Review prompt hidden" });
  } catch (err) {
    console.error("Dismiss Review Prompt Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Public reviewer identity: first name + last initial, never the email. Seeded
// emails are derived from names, so exposing them would publish full identities
// on a page that logged-out visitors (and crawlers) can read.
const toDisplayName = (name) => {
  const clean = typeof name === "string" ? name.trim() : "";
  if (!clean) return "Verified buyer";

  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

/**
 * Public — the product page is viewable logged out, so this route carries no
 * auth middleware and must never return userId or email.
 *
 * The summary is computed from product_reviews rather than read off
 * products.rating/products.reviews, because those columns still hold legacy
 * hand-entered marketing figures for older products and would disagree with
 * the list rendered underneath them.
 */
export const getProductReviews = async (req, res) => {
  try {
    const productId = Number(req.body.productId);

    if (!productId)
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });

    // clamped: this endpoint is public, so the caller doesn't get to ask for
    // a hundred thousand rows
    const limit = Math.min(Math.max(Number(req.body.limit) || 5, 1), 50);
    const page = Math.max(Number(req.body.page) || 1, 1);
    const offset = (page - 1) * limit;

    // one round trip for the count, average and per-star histogram. SUM/AVG
    // come back from mysql2 as strings, and as NULL when no rows match, so
    // every one of them is coerced below
    const [[totals]] = await db.query(
      `SELECT COUNT(*) AS total,
              AVG(rating) AS average,
              SUM(rating = 5) AS star5,
              SUM(rating = 4) AS star4,
              SUM(rating = 3) AS star3,
              SUM(rating = 2) AS star2,
              SUM(rating = 1) AS star1
       FROM product_reviews
       WHERE productId = ? AND status = 'visible'`,
      [productId]
    );

    const total = Number(totals.total) || 0;

    const summary = {
      total,
      average: total ? Number(Number(totals.average).toFixed(1)) : 0,
      breakdown: {
        5: Number(totals.star5) || 0,
        4: Number(totals.star4) || 0,
        3: Number(totals.star3) || 0,
        2: Number(totals.star2) || 0,
        1: Number(totals.star1) || 0,
      },
    };

    // LIMIT/OFFSET placeholders must receive real numbers — mysql2's text
    // protocol quotes strings and MariaDB rejects `LIMIT '5'`
    const [rows] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.createdAt, u.name AS reviewerName
       FROM product_reviews r
       JOIN users u ON u.id = r.userId
       WHERE r.productId = ? AND r.status = 'visible'
       ORDER BY r.createdAt DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );

    const reviews = rows.map((row) => ({
      id: Number(row.id),
      rating: Number(row.rating),
      comment: row.comment || null,
      createdAt: row.createdAt,
      reviewer: toDisplayName(row.reviewerName),
      // every row is tied to a delivered order by construction
      verified: true,
    }));

    return res.json({
      success: true,
      page,
      limit,
      total,
      hasMore: offset + reviews.length < total,
      summary,
      reviews,
    });
  } catch (err) {
    console.error("Fetch Product Reviews Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { fetchOrderReviews };
