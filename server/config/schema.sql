SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',

  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,

  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products (

  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  images JSON DEFAULT (JSON_ARRAY()),

  category VARCHAR(100),

  originalPrice INT NOT NULL DEFAULT 0,
  discountedPrice INT NOT NULL DEFAULT 0,

  rating FLOAT DEFAULT 0,
  reviews INT DEFAULT 0,

  description TEXT,

  ingredients JSON DEFAULT (JSON_ARRAY()),

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ADDRESSES
-- =====================================================

CREATE TABLE addresses (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  addressLine1 VARCHAR(255) NOT NULL,
  addressLine2 VARCHAR(255),
  phone VARCHAR(20),

  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  postalCode VARCHAR(100) NOT NULL,

  country VARCHAR(100) DEFAULT 'India',
  isPrimary TINYINT(1) NOT NULL DEFAULT 0,

  userId INT UNSIGNED NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (userId)
  REFERENCES users(id)
  ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =====================================================
-- CART
-- =====================================================

CREATE TABLE cart (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  userId INT UNSIGNED NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (userId)
  REFERENCES users(id)
  ON DELETE CASCADE

);



-- =====================================================
-- CART ITEMS
-- =====================================================

CREATE TABLE cart_items (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  cartId INT UNSIGNED NOT NULL,
  productId BIGINT UNSIGNED NOT NULL,

  quantity INT DEFAULT 1,

  FOREIGN KEY (cartId)
  REFERENCES cart(id)
  ON DELETE CASCADE,

  FOREIGN KEY (productId)
  REFERENCES products(id)
  ON DELETE CASCADE

);



-- =====================================================
-- COUPONS
-- =====================================================

CREATE TABLE coupons (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  code VARCHAR(100) UNIQUE NOT NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,

  discount_type ENUM('flat','percent','free_gift') DEFAULT 'flat',

  gift_product_id BIGINT UNSIGNED,

  value DECIMAL(10,2),
  max_discount DECIMAL(10,2),

  min_order DECIMAL(10,2) DEFAULT 0,

  starts_at DATETIME,
  expires_at DATETIME,

  active TINYINT(1) DEFAULT 1,
  auto_award TINYINT(1) DEFAULT 0,
  single_use_per_user TINYINT(1) DEFAULT 0,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);



-- =====================================================
-- CART COUPONS
-- =====================================================

CREATE TABLE cart_coupons (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  cartId INT UNSIGNED NOT NULL,
  userId INT UNSIGNED,

  couponId INT UNSIGNED NOT NULL,

  code VARCHAR(100),

  appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  is_applied TINYINT(1) DEFAULT 1,

  extra JSON,

  UNIQUE(cartId, couponId),

  FOREIGN KEY (cartId)
  REFERENCES cart(id)
  ON DELETE CASCADE,

  FOREIGN KEY (couponId)
  REFERENCES coupons(id)
  ON DELETE CASCADE

);



-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  orderCode VARCHAR(20) UNIQUE,

  userId INT UNSIGNED NOT NULL,

  -- delivery address: FK for traceability + a snapshot, since the address
  -- book entry can be edited/deleted after the order is placed
  addressId INT UNSIGNED NULL,
  shippingAddressLine1 VARCHAR(255) NULL,
  shippingAddressLine2 VARCHAR(255) NULL,
  shippingPhone VARCHAR(20) NULL,
  shippingCity VARCHAR(255) NULL,
  shippingState VARCHAR(255) NULL,
  shippingPostalCode VARCHAR(100) NULL,
  shippingCountry VARCHAR(100) NULL,

  totalPrice FLOAT NOT NULL,
  discountedPrice FLOAT,

  appliedCoupons JSON,

  status ENUM(
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ) DEFAULT 'pending',

  shippingPartner VARCHAR(100),
  trackingNumber VARCHAR(191),
  trackingUrl VARCHAR(512),

  shippedAt DATETIME,
  deliveredAt DATETIME,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (userId)
  REFERENCES users(id)
  ON DELETE CASCADE,

  FOREIGN KEY (addressId)
  REFERENCES addresses(id)
  ON DELETE SET NULL

);



-- =====================================================
-- ORDER ITEMS
-- =====================================================

CREATE TABLE order_items (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  orderId INT UNSIGNED NOT NULL,
  productId BIGINT UNSIGNED NOT NULL,

  quantity INT DEFAULT 1,

  price INT NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (orderId)
  REFERENCES orders(id)
  ON DELETE CASCADE,

  FOREIGN KEY (productId)
  REFERENCES products(id)
  ON DELETE CASCADE

);



-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  orderId INT UNSIGNED NOT NULL,

  razorpayOrderId VARCHAR(255) NOT NULL,
  razorpayPaymentId VARCHAR(255),
  razorpaySignature VARCHAR(255),

  amount INT NOT NULL,

  currency VARCHAR(10) DEFAULT 'INR',

  status ENUM(
    'created',
    'attempted',
    'paid',
    'failed',
    'refunded'
  ) DEFAULT 'created',

  method VARCHAR(100),

  email VARCHAR(255),
  contact VARCHAR(20),

  -- method-specific info from Razorpay: card {network,last4,type,issuer},
  -- bank, wallet, vpa, fee, tax, international — whatever applies to `method`
  details JSON NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (orderId)
  REFERENCES orders(id)
  ON DELETE CASCADE

);



-- =====================================================
-- OTP
-- =====================================================

CREATE TABLE otps (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  email VARCHAR(255),

  code VARCHAR(100),

  expiresAt DATETIME,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



-- =====================================================
-- ASSETS
-- =====================================================

CREATE TABLE assets (

  id INT AUTO_INCREMENT PRIMARY KEY,

  type ENUM('logo','banner','hero','imagesCarousel'),

  image VARCHAR(255),

  position INT DEFAULT 0,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



-- =====================================================
-- SLIDERS
-- =====================================================

CREATE TABLE sliders (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  position ENUM('top','bottom'),

  text VARCHAR(255),

  sort_order INT DEFAULT 0,

  active TINYINT(1) DEFAULT 1,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);



-- =====================================================
-- STORY ASSETS
-- =====================================================

CREATE TABLE story_assets (

  id INT AUTO_INCREMENT PRIMARY KEY,

  image VARCHAR(255),

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);



-- =====================================================
-- SOCIAL LINKS
-- =====================================================

CREATE TABLE social_links (

  id INT AUTO_INCREMENT PRIMARY KEY,

  platform ENUM('instagram','linkedin','whatsapp') UNIQUE,

  url VARCHAR(255),

  active TINYINT(1) DEFAULT 1,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);



-- =====================================================
-- CONTACT
-- =====================================================

CREATE TABLE contact_messages (

  id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(150),
  email VARCHAR(150),

  message TEXT,

  status ENUM('new','read','replied') DEFAULT 'new',

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



-- =====================================================
-- BULK ORDERS
-- =====================================================

CREATE TABLE bulk_orders (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,

  status ENUM('new','contacted','closed') DEFAULT 'new',

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);



CREATE TABLE bulk_order_items (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  bulkOrderId INT UNSIGNED NOT NULL,
  productId BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- =====================================================
-- NEWSLETTER
-- =====================================================

CREATE TABLE newsletter_subscribers (

  id INT AUTO_INCREMENT PRIMARY KEY,

  email VARCHAR(255) UNIQUE,

  status ENUM('active','unsubscribed') DEFAULT 'active',

  unsubscribedAt DATETIME NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE newsletters (

  id INT AUTO_INCREMENT PRIMARY KEY,

  subject VARCHAR(255),
  content TEXT,

  sentCount INT DEFAULT 0,

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

);



-- =====================================================
-- REELS
-- =====================================================

CREATE TABLE reels (

  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  short_video VARCHAR(255),
  main_video VARCHAR(255),

  product_id BIGINT UNSIGNED,

  active TINYINT(1) DEFAULT 1,

  sort_order INT DEFAULT 0,

  views INT UNSIGNED DEFAULT 0,
  likes INT UNSIGNED DEFAULT 0,

  created_by BIGINT UNSIGNED,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id)
  REFERENCES products(id)
  ON DELETE CASCADE

);



CREATE INDEX idx_reels_active_order
ON reels(active, sort_order);


CREATE INDEX idx_reels_product
ON reels(product_id);



SET FOREIGN_KEY_CHECKS = 1;
