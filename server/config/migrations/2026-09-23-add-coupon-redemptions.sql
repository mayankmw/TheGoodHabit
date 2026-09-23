-- Coupon redemptions.
--
-- coupons.single_use_per_user has existed since the schema was written and is
-- set by the admin form, but no query has ever read it: there was nowhere to
-- record that a coupon had been used. Coupon 567HH is marked single-use and
-- gives 63% off above a INR 4 minimum, so one customer could reuse it forever.
--
-- This is also what lets the admin see how often a coupon has actually been
-- redeemed, which was previously unknowable.

CREATE TABLE IF NOT EXISTS coupon_redemptions (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  couponId INT UNSIGNED NOT NULL,
  userId INT UNSIGNED NOT NULL,
  orderId INT UNSIGNED NOT NULL,

  -- the code as it stood when redeemed — a coupon can be renamed later
  code VARCHAR(100),
  discountValue DECIMAL(10,2) NOT NULL DEFAULT 0,

  redeemedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- makes recording idempotent: a replayed payment verification cannot
  -- double-count a redemption
  UNIQUE KEY uniq_redemption_coupon_order (couponId, orderId),
  KEY idx_redemption_coupon_user (couponId, userId),

  FOREIGN KEY (couponId) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
