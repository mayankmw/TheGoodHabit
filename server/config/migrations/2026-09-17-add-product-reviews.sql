-- Reviews are keyed to (order, product) rather than (user, product): a rating
-- only exists because that order was delivered, and products.rating /
-- products.reviews — which the storefront already renders — are recomputed
-- from these rows instead of being hand-maintained.
--
-- No FK on productId: products.id has drifted between environments (signed vs
-- unsigned BIGINT), so the constraint can't be formed portably. order_items
-- stores productId without a FK for the same reason, and the review endpoint
-- only accepts product ids that are already on the order.

CREATE TABLE IF NOT EXISTS product_reviews (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  orderId INT UNSIGNED NOT NULL,
  productId BIGINT NOT NULL,
  userId INT UNSIGNED NOT NULL,

  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_review_order_product (orderId, productId),
  KEY idx_review_product (productId),
  KEY idx_review_user (userId),

  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),

  FOREIGN KEY (orderId)
  REFERENCES orders(id)
  ON DELETE CASCADE,

  FOREIGN KEY (userId)
  REFERENCES users(id)
  ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- "Not now" on the review prompt. Once stamped, the order card stops opening
-- the form by itself and only offers a button the customer can come back to.
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS reviewPromptDismissedAt DATETIME NULL AFTER deliveredAt;
