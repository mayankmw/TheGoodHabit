-- =====================================================
-- SOCIAL LINKS
-- =====================================================

INSERT INTO social_links (platform, url, active)
VALUES

('instagram', 'https://www.instagram.com/instagram/?hl=en', 1),

('linkedin', 'https://www.linkedin.com/company/linkedin/', 1),

('whatsapp', '7827510913', 1);



-- =====================================================
-- COUPONS
-- =====================================================

INSERT INTO coupons
(
code,
title,
description,
discount_type,
value,
min_order,
active
)
VALUES

(
'GET100',
'Flat ₹100 off',
'Flat ₹100 off on eligible orders',
'flat',
100.00,
799.00,
1
);




INSERT INTO coupons
(
code,
title,
description,
discount_type,
min_order,
active,
auto_award
)
VALUES

(
'FREEGIFT',
'Get 1 item for free',
'Auto-awarded free gift when cart value reaches ₹999',
'free_gift',
999.00,
1,
1
);




INSERT INTO coupons
(
code,
title,
description,
discount_type,
value,
max_discount,
min_order,
active
)
VALUES

(
'SUMMER30',
'30% off',
'30% off on orders',
'percent',
30.00,
2000.00,
8999.00,
1
);
