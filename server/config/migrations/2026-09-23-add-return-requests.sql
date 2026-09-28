-- Returns for delivered orders.
--
-- Cancellation stops at 'shipped', so once a parcel arrived there was no path
-- at all: a customer with a damaged or wrong item had to email, and the money
-- had to be moved by hand in the Razorpay dashboard.
--
-- Refunds here are partial by nature — usually one line of a larger order — so
-- the amount lives on the request rather than flipping the whole payment.

CREATE TABLE IF NOT EXISTS return_requests (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  orderId INT UNSIGNED NOT NULL,
  userId INT UNSIGNED NOT NULL,

  status ENUM('requested','approved','rejected') NOT NULL DEFAULT 'requested',
  reason ENUM('damaged','wrong_item','not_as_described','other') NOT NULL,
  comment TEXT,

  -- photographic evidence, the same upload path product images use
  photos JSON,

  -- paise, mirroring payments.amount
  refundAmount INT NULL,
  razorpayRefundId VARCHAR(255) NULL,
  refundedAt DATETIME NULL,

  -- damaged goods should not go back on sale, so restocking is a decision
  restock TINYINT(1) NOT NULL DEFAULT 0,

  adminNote VARCHAR(500) NULL,
  reviewedBy INT UNSIGNED NULL,
  reviewedAt DATETIME NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_return_order (orderId),
  KEY idx_return_status (status, createdAt),

  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS return_request_items (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  returnRequestId INT UNSIGNED NOT NULL,
  orderItemId INT UNSIGNED NOT NULL,

  -- no FK on productId, matching order_items — products.id has drifted
  productId BIGINT NOT NULL,
  quantity INT NOT NULL,

  -- the unit price as charged, so a later price change cannot alter a refund
  price INT NOT NULL,

  -- one line of an order can only be claimed once per request
  UNIQUE KEY uniq_return_item (returnRequestId, orderItemId),

  FOREIGN KEY (returnRequestId) REFERENCES return_requests(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
