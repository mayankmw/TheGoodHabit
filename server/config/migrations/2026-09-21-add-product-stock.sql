-- Stock control.
--
-- NULL means "not tracked, sell without limit". Every product that exists
-- today stays NULL, so adding this column cannot silently take the shop
-- offline — which a NOT NULL DEFAULT 0 would have done the moment it ran,
-- by marking the entire catalogue out of stock.
--
-- A number means tracked: 0 is genuinely sold out. That distinction is why
-- the column is nullable rather than carrying a separate trackStock flag.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock INT NULL DEFAULT NULL AFTER discountedPrice;

-- supports the low-stock dashboard query — untracked rows sort away as NULL
CREATE INDEX IF NOT EXISTS idx_products_stock
ON products (stock);
