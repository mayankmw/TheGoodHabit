-- --------------------------------------------------
-- USERS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------
-- PRODUCTS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(1024),
  type VARCHAR(100),

  originalPrice INT NOT NULL DEFAULT 0,
  discountedPrice INT NOT NULL DEFAULT 0,

  rating FLOAT DEFAULT 0,
  reviews INT DEFAULT 0,

  description TEXT,
  ingredients JSON DEFAULT JSON_ARRAY(),

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------
-- ORDERS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  totalPrice FLOAT NOT NULL,
  status ENUM('pending','confirmed','shipped','delivered') NOT NULL DEFAULT 'pending',
  userId INT UNSIGNED NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_user
    FOREIGN KEY (userId)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE orders
  ADD COLUMN addressId INT UNSIGNED NULL AFTER userId,
  ADD COLUMN paymentStatus ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
  ADD COLUMN paymentMethod VARCHAR(50) NULL,
  ADD COLUMN razorpayOrderId VARCHAR(255) NULL,
  ADD COLUMN razorpayPaymentId VARCHAR(255) NULL;



-- --------------------------------------------------
-- ORDERS ITEMS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  orderId INT UNSIGNED NOT NULL,
  productId VARCHAR(191) NOT NULL,

  quantity INT NOT NULL DEFAULT 1,
  price INT NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

ALTER TABLE order_items
  MODIFY productId VARCHAR(191)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;



-- --------------------------------------------------
-- ADDRESSES TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  street VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  postalCode VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',

  userId INT UNSIGNED NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_addresses_user
    FOREIGN KEY (userId)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE addresses
  CHANGE street addressLine1 VARCHAR(255) NOT NULL;

ALTER TABLE addresses
  ADD COLUMN addressLine2 VARCHAR(255) NULL AFTER addressLine1;


-- --------------------------------------------------
-- OTPS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS otps (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- --------------------------------------------------
-- CART TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS cart (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId INT UNSIGNED NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)



-- --------------------------------------------------
-- CART ITEMS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cartId INT UNSIGNED NOT NULL,
  productId VARCHAR(191) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
    
  CONSTRAINT fk_cart_items_cart 
    FOREIGN KEY (cartId) REFERENCES cart(id) ON DELETE CASCADE
);




-- --------------------------------------------------
-- COLLATION COMPARISION FIX
-- --------------------------------------------------
ALTER DATABASE thegoodhabit
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


SELECT CONCAT(
  'ALTER TABLE `', table_name, 
  '` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
)
FROM information_schema.tables
WHERE table_schema = 'thegoodhabit';


ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE order_items CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE addresses CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE otps CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE cart CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE cart_items CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;



-- --------------------------------------------------
-- COUPONS TABLE
-- --------------------------------------------------
-- Coupons master table (definitions)
CREATE TABLE IF NOT EXISTS coupons (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  discount_type ENUM('flat','percent','free_gift') NOT NULL DEFAULT 'flat',
  value DECIMAL(10,2) NULL,       -- for flat/percent (percent stored as e.g. 30.00)
  max_discount DECIMAL(10,2) NULL,-- cap for percent discounts (optional)
  min_order DECIMAL(10,2) DEFAULT 0, -- minimum cart value to be eligible
  starts_at DATETIME NULL,
  expires_at DATETIME NULL,
  active TINYINT(1) DEFAULT 1,    -- toggle coupon on/off
  auto_award TINYINT(1) DEFAULT 0,-- if 1, coupon can be auto-awarded (server-side)
  single_use_per_user TINYINT(1) DEFAULT 0, -- restrict one-time per user
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- --------------------------------------------------
-- CART COUPONS TABLE
-- --------------------------------------------------
-- (records coupons that have been applied/awarded to a cart or user)
CREATE TABLE IF NOT EXISTS cart_coupons (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cartId INT UNSIGNED NOT NULL,
  userId INT UNSIGNED NULL,        -- optional reference to user
  couponId INT UNSIGNED NOT NULL,
  code VARCHAR(100) NOT NULL,      -- denormalized copy for easier queries
  appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_applied TINYINT(1) DEFAULT 1, -- 1 = active/applied, 0 = revoked
  extra JSON NULL,                 -- store reason/metadata (free gift sku, etc.)
  UNIQUE KEY unique_cart_coupon (cartId, couponId),
  CONSTRAINT fk_cartcoupons_coupon FOREIGN KEY (couponId) REFERENCES coupons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- --------------------------------------------------
-- COUPONS
-- --------------------------------------------------
-- GET100: flat ₹100 off on orders >= 799
INSERT INTO coupons (code, title, description, discount_type, value, min_order, active)
VALUES
  ('GET100', 'Flat ₹100 off', 'Flat ₹100 off on eligible orders', 'flat', 100.00, 799.00, 1);

-- FREEGIFT: auto-awarded when cart total >= 999 (handled server-side)
INSERT INTO coupons (code, title, description, discount_type, min_order, active, auto_award)
VALUES
  ('FREEGIFT', 'Get 1 item for free', 'Auto-awarded free gift when cart value reaches ₹999', 'free_gift', 999.00, 1, 1);

-- SUMMER30: 30% off on orders >= 8999 (example with percent type)
INSERT INTO coupons (code, title, description, discount_type, value, max_discount, min_order, active)
VALUES
  ('SUMMER30', '30% off', '30% off on orders', 'percent', 30.00, 2000.00, 8999.00, 1);


ALTER TABLE orders
  ADD COLUMN razorpayOrderId VARCHAR(255) NULL AFTER paymentMethod,
  ADD COLUMN razorpayPaymentId VARCHAR(255) NULL AFTER razorpayOrderId,
  ADD COLUMN razorpaySignature VARCHAR(255) NULL AFTER razorpayPaymentId,
  MODIFY COLUMN paymentStatus ENUM('pending','paid','failed') 
      NOT NULL DEFAULT 'pending';


CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  orderId INT UNSIGNED NOT NULL,          -- our system order id
  razorpayOrderId VARCHAR(255) NOT NULL,  -- rp order id
  razorpayPaymentId VARCHAR(255) NULL,    -- rp payment id
  razorpaySignature VARCHAR(255) NULL,    -- for verification

  amount INT NOT NULL,                    -- amount in paise
  currency VARCHAR(10) DEFAULT 'INR',

  status ENUM('created','attempted','paid','failed') 
         NOT NULL DEFAULT 'created',

  method VARCHAR(100) NULL,               -- UPI/card/netbanking
  email VARCHAR(255) NULL,
  contact VARCHAR(20) NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_order
    FOREIGN KEY (orderId) REFERENCES orders(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE orders
DROP COLUMN paymentStatus,
DROP COLUMN paymentMethod,
DROP COLUMN razorpayOrderId,
DROP COLUMN razorpayPaymentId,
DROP COLUMN razorpaySignature;

ALTER TABLE orders
MODIFY status ENUM('pending','processing','shipped','delivered','cancelled')
DEFAULT 'pending';


ALTER TABLE payments 
MODIFY status ENUM('created','attempted','paid','failed','refunded')
NOT NULL DEFAULT 'created';

ALTER TABLE users
ADD COLUMN phone VARCHAR(20) NULL AFTER email,
ADD UNIQUE KEY unique_user_phone (phone);


ALTER TABLE orders
ADD COLUMN appliedCoupons JSON NULL AFTER totalPrice;

ALTER TABLE orders
ADD COLUMN discountedPrice FLOAT NULL AFTER totalPrice;

ALTER TABLE orders
ADD COLUMN shippingPartner VARCHAR(100) NULL AFTER status,
ADD COLUMN trackingNumber VARCHAR(191) NULL AFTER shippingPartner,
ADD COLUMN trackingUrl VARCHAR(512) NULL AFTER trackingNumber,
ADD COLUMN shippedAt DATETIME NULL AFTER trackingUrl,
ADD COLUMN deliveredAt DATETIME NULL AFTER shippedAt;

ALTER TABLE users
ADD COLUMN role ENUM('customer','admin') 
NOT NULL DEFAULT 'customer'
AFTER id;

ALTER TABLE products
CHANGE COLUMN type category VARCHAR(100)
CHARACTER SET utf8mb4
NULL DEFAULT NULL;

ALTER TABLE orders
ADD COLUMN orderCode VARCHAR(20) UNIQUE AFTER id;

CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('logo', 'banner', 'hero') NOT NULL,
  image VARCHAR(255) NOT NULL,
  position INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE coupons
ADD COLUMN gift_product_id INT UNSIGNED NULL AFTER discount_type;

ALTER TABLE coupons
MODIFY gift_product_id VARCHAR(36) NULL;

CREATE TABLE sliders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  position ENUM('top', 'bottom') NOT NULL,   -- where it appears
  text VARCHAR(255) NOT NULL,                -- what admin writes

  sort_order INT DEFAULT 0,                  -- display order
  active TINYINT(1) DEFAULT 1,                -- show / hide

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE story_assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image VARCHAR(255) DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE social_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  platform ENUM('instagram', 'linkedin', 'whatsapp') NOT NULL UNIQUE,
  url VARCHAR(255) NOT NULL,
  active TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO social_links (platform, url) VALUES
('instagram', 'https://www.instagram.com/instagram/?hl=en'),
('linkedin', 'https://www.linkedin.com/company/linkedin/'),
('whatsapp', '7827510913');

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied') DEFAULT 'new',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE newsletter_subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('active', 'unsubscribed') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE newsletters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sentCount INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  /* ================= MEDIA ================= */
  short_video VARCHAR(255) NOT NULL,
  main_video VARCHAR(255) NOT NULL,

  /* ================= PRODUCT ================= */
  product_id BIGINT UNSIGNED NOT NULL,

  /* ================= VISIBILITY ================= */
  active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,

  /* ================= ANALYTICS ================= */
  views INT UNSIGNED DEFAULT 0,
  likes INT UNSIGNED DEFAULT 0,

  /* ================= META ================= */
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- For homepage carousel
CREATE INDEX idx_reels_active_order
  ON reels (active, sort_order);

-- For product → reels lookup
CREATE INDEX idx_reels_product
  ON reels (product_id);

INSERT INTO reels (short_video, main_video, product_id, active, sort_order)
VALUES
(
  'reel-short-1.mp4',
  'reel-1.mp4',
  (SELECT id FROM products ORDER BY RAND() LIMIT 1),
  1,
  1
),
(
  'reel-short-2.mp4',
  'reel-2.mp4',
  (SELECT id FROM products ORDER BY RAND() LIMIT 1),
  1,
  2
),
(
  'reel-short-3.mp4',
  'reel-3.mp4',
  (SELECT id FROM products ORDER BY RAND() LIMIT 1),
  1,
  3
),
(
  'reel-short-4.mp4',
  'reel-4.mp4',
  (SELECT id FROM products ORDER BY RAND() LIMIT 1),
  1,
  4
),
(
  'reel-short-5.mp4',
  'reel-5.mp4',
  (SELECT id FROM products ORDER BY RAND() LIMIT 1),
  1,
  5
),
(
  'reel-short-6.mp4',
  'reel-6.mp4',
  (SELECT id FROM products ORDER BY RAND() LIMIT 1),
  1,
  6
),
(
  'reel-short-7.mp4',
  'reel-7.mp4',
  (SELECT id FROM products ORDER BY RAND() LIMIT 1),
  1,
  7
);

change id in products to bigint , turned on auto increment , also changed values to 1,2,3,4 so on