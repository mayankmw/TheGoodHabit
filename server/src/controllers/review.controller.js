import { db } from "../config/db.js";

const MAX_COMMENT_LENGTH = 1000;

// products.rating / products.reviews are denormalised for the storefront
// listings, so every write to product_reviews has to fold back into them.
const syncProductRatings = async (productIds) => {
  const ids = [...new Set(productIds.map(Number).filter(Boolean))];
  if (!ids.length) return;

  const placeholders = ids.map(() => "?").join(", ");

  await db.query(
    `UPDATE products p
     SET p.rating = COALESCE(
           (SELECT ROUND(AVG(r.rating), 1) FROM product_reviews r WHERE r.productId = p.id),
           0
         ),
         p.reviews = (SELECT COUNT(*) FROM product_reviews r WHERE r.productId = p.id)
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

export { fetchOrderReviews };
