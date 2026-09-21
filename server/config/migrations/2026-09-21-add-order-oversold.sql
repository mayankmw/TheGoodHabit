-- Oversell visibility.
--
-- Stock is not reserved while a customer sits in the Razorpay modal, so the
-- units they are buying can be taken by someone else in that window. The
-- decrement at verification is therefore best-effort: the payment is already
-- captured, so a shortfall must not reject the order.
--
-- That makes the oversell log a compensating control, and a console.error is
-- not a control anyone can act on. Recording it on the order puts it in front
-- of an admin before the parcel is packed.
--
-- NULL is the normal case. A JSON array of { productId, wanted, available }
-- means at least one line could not be fully decremented.

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS oversoldItems JSON NULL AFTER reviewPromptDismissedAt;
