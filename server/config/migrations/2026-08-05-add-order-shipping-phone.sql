-- Follow-up to 2026-07-30-add-order-address.sql: the address snapshot on
-- orders was taken before addresses had a phone column, so orders still had
-- no contact number for delivery.

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shippingPhone VARCHAR(20) NULL AFTER shippingAddressLine2;
