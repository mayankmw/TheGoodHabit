-- Orders didn't reference a delivery address at all. Add a reference to the
-- address book plus a snapshot of it at order time (addresses are editable
-- later, and order_items.price already snapshots product price the same way).

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS addressId INT UNSIGNED NULL AFTER userId,
ADD COLUMN IF NOT EXISTS shippingAddressLine1 VARCHAR(255) NULL AFTER addressId,
ADD COLUMN IF NOT EXISTS shippingAddressLine2 VARCHAR(255) NULL AFTER shippingAddressLine1,
ADD COLUMN IF NOT EXISTS shippingCity VARCHAR(255) NULL AFTER shippingAddressLine2,
ADD COLUMN IF NOT EXISTS shippingState VARCHAR(255) NULL AFTER shippingCity,
ADD COLUMN IF NOT EXISTS shippingPostalCode VARCHAR(100) NULL AFTER shippingState,
ADD COLUMN IF NOT EXISTS shippingCountry VARCHAR(100) NULL AFTER shippingPostalCode;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_address
FOREIGN KEY (addressId) REFERENCES addresses(id)
ON DELETE SET NULL;
