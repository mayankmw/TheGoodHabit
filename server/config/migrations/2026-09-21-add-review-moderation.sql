-- Admin moderation for reviews.
--
-- Hiding is a soft flag, never a DELETE: the row survives for audit, the
-- customer's own order card keeps showing what they wrote, and the public
-- product endpoint plus the denormalised products.rating/products.reviews
-- aggregates both filter on status.
--
-- moderatedBy carries no FK on purpose — it is an audit breadcrumb, and a
-- constraint here would make this migration non-idempotent (MariaDB has no
-- reliable ADD CONSTRAINT IF NOT EXISTS).

ALTER TABLE product_reviews
ADD COLUMN IF NOT EXISTS status ENUM('visible','hidden') NOT NULL DEFAULT 'visible' AFTER comment,
ADD COLUMN IF NOT EXISTS moderatedAt DATETIME NULL AFTER status,
ADD COLUMN IF NOT EXISTS moderatedBy INT UNSIGNED NULL AFTER moderatedAt;

-- the public list and aggregate both filter productId + status
CREATE INDEX IF NOT EXISTS idx_review_product_status
ON product_reviews (productId, status);


-- Backfill: products.rating/products.reviews were hand-entered marketing
-- figures for older products (one claimed 212 reviews against 0 real rows),
-- which contradicted the reviews section rendered directly beneath them.
-- product_reviews is the source of truth from here on.
UPDATE products p
SET p.rating = COALESCE(
      (SELECT ROUND(AVG(r.rating), 1)
       FROM product_reviews r
       WHERE r.productId = p.id AND r.status = 'visible'),
      0
    ),
    p.reviews = (
      SELECT COUNT(*)
      FROM product_reviews r
      WHERE r.productId = p.id AND r.status = 'visible'
    );
