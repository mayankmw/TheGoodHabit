-- Order cancellation with refunds.
--
-- orders.status already had 'cancelled' and payments.status already had
-- 'refunded', but nothing could reach either: no customer endpoint existed and
-- an admin flipping the status moved no money. These columns record who
-- cancelled, why, and the Razorpay refund that went back.

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cancelledAt DATETIME NULL AFTER deliveredAt,
ADD COLUMN IF NOT EXISTS cancelledBy ENUM('customer','admin') NULL AFTER cancelledAt,
ADD COLUMN IF NOT EXISTS cancelReason VARCHAR(255) NULL AFTER cancelledBy;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS razorpayRefundId VARCHAR(255) NULL AFTER razorpaySignature,
ADD COLUMN IF NOT EXISTS refundAmount INT NULL AFTER amount,
ADD COLUMN IF NOT EXISTS refundedAt DATETIME NULL AFTER refundAmount;

-- verifyRazorpayPayment locks the payment row by this key with FOR UPDATE.
-- Without an index that lock covers the whole table and every concurrent
-- checkout queues behind it. Unique, because one Razorpay order is one row.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_payments_razorpay_order
ON payments (razorpayOrderId);
