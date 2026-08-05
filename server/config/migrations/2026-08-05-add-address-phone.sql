-- Addresses had no contact number at all, but delivery needs one. Nullable
-- at the DB level (existing rows have none) — "required" is enforced in the
-- app layer for new/edited addresses, same as the pincode format check.

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER addressLine2;
