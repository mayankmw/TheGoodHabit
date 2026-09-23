-- Abandoned checkouts, and the order line snapshot they depend on.
--
-- 1. 'abandoned' separates a checkout the customer walked away from and an
--    order still waiting to be paid. Nine orders had been sitting in 'pending'
--    since December with no way to tell the two apart.
--
-- 2. itemsSnapshot records what was priced when the Razorpay order was created.
--    Until now verification built order_items from the LIVE cart, so a customer
--    could check out a small cart, add more in another tab while the payment
--    modal was open, pay the small amount and receive the larger order. It is
--    also what makes reserving stock possible later — you can only hold units
--    you have actually recorded.

ALTER TABLE orders
MODIFY COLUMN status ENUM(
  'pending','processing','shipped','delivered','cancelled','abandoned'
) DEFAULT 'pending';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS itemsSnapshot JSON NULL AFTER appliedCoupons,
ADD COLUMN IF NOT EXISTS abandonedAt DATETIME NULL AFTER cancelReason,
ADD COLUMN IF NOT EXISTS recoveryEmailSentAt DATETIME NULL AFTER abandonedAt;

-- the sweep looks for stale pending orders by age
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders (status, createdAt);
