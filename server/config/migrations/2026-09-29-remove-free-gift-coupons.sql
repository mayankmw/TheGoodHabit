-- Coupons are flat or percent only: the free-gift type is removed.
--
-- A free-gift coupon could be applied and showed as "Applied", but nothing
-- ever put the gift on the order, took it out of stock, or showed it to the
-- admin, so the customer was promised an item nobody knew to pack.
--
-- Existing free-gift coupons: one never redeemed is deleted, along with any
-- cart it sits on. One that was redeemed keeps its row for the order history,
-- switched off and turned into a ₹0 flat coupon so the type can go.

DELETE cc FROM cart_coupons cc
JOIN coupons c ON c.id = cc.couponId
WHERE c.discount_type = 'free_gift';

DELETE FROM coupons
WHERE discount_type = 'free_gift'
  AND id NOT IN (SELECT couponId FROM coupon_redemptions);

UPDATE coupons
SET discount_type = 'flat', value = 0, max_discount = NULL, active = 0
WHERE discount_type = 'free_gift';

ALTER TABLE coupons
  MODIFY discount_type ENUM('flat','percent') DEFAULT 'flat',
  DROP COLUMN gift_product_id;
