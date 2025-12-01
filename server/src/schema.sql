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
