-- Readable product URLs: /products/nutty-peanut-medjool-dates-pack-of-4
-- instead of /products/18.
--
-- The numeric id stays the key everything joins on; the slug only names the
-- page. The column starts out empty on purpose: the server gives every product
-- without one a slug when it boots (utils/productSlugs.js), so the rules for
-- turning a name into a slug live in one place instead of being repeated here.
-- Old /products/18 links keep working and redirect to the slug.

ALTER TABLE products
  ADD COLUMN slug VARCHAR(191) NULL AFTER name,
  ADD UNIQUE KEY uq_products_slug (slug);


-- Every slug a product has had before its current one. A slug changed in the
-- admin panel lands here, so links shared before the change still resolve and
-- redirect to the new URL.
CREATE TABLE IF NOT EXISTS product_slug_redirects (

  slug VARCHAR(191) NOT NULL PRIMARY KEY,

  -- no FK, matching order_items — products.id has drifted
  productId BIGINT NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  KEY idx_slug_redirect_product (productId)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
