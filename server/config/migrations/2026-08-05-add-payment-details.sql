-- We were only ever writing razorpayPaymentId/razorpaySignature/status onto
-- payments — method, email, contact (columns that already existed) and
-- method-specific info (card/upi/netbanking/wallet, Razorpay's fee/tax) were
-- never captured, even though the Razorpay API returns all of it on verify.

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS details JSON NULL AFTER contact;
