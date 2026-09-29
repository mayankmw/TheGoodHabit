-- Home page reels come from the shop's Instagram account.
--
-- A reel used to be two uploaded videos (a short preview and a main cut) that
-- nobody was going to produce by hand, and the upload route only ever accepted
-- images, so no reel was ever added through the admin panel. A reel is now a
-- pointer to an Instagram post plus the product it sells: the video stays on
-- Instagram and is fetched through the Instagram API when the page asks.
--
-- The old rows point at uploaded files and cannot be converted, so the table
-- is replaced rather than altered.

DROP TABLE IF EXISTS reels;

CREATE TABLE reels (

  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Instagram's id for the post. Its video and cover links are signed and
  -- expire, so they are fetched fresh rather than stored.
  instagramMediaId VARCHAR(64) NOT NULL,
  permalink VARCHAR(255) NOT NULL,

  -- a snapshot, so the admin list can tell reels apart without a round trip
  caption TEXT NULL,

  -- no FK, matching order_items — products.id has drifted
  productId BIGINT NOT NULL,

  active TINYINT(1) NOT NULL DEFAULT 1,
  sortOrder INT NOT NULL DEFAULT 0,

  createdBy INT UNSIGNED NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_reels_media (instagramMediaId),
  KEY idx_reels_active_order (active, sortOrder),
  KEY idx_reels_product (productId)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- The one Instagram account reels are taken from. Its access token lasts 60
-- days and the server renews it, so the live token has to be stored here;
-- INSTAGRAM_ACCESS_TOKEN in .env only seeds this row.
CREATE TABLE IF NOT EXISTS instagram_connection (

  -- always 1: the shop connects a single account
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,

  accountId VARCHAR(64) NOT NULL,
  username VARCHAR(255) NOT NULL,

  accessToken TEXT NOT NULL,
  -- unknown until the first renewal, which is when Instagram reports it
  tokenExpiresAt DATETIME NULL,
  tokenRefreshedAt DATETIME NULL,

  -- sha256 of the .env token this row was seeded from. A different token in
  -- .env (the shop's own account replacing a test one) replaces the row.
  sourceTokenHash CHAR(64) NOT NULL,

  -- why Instagram last refused the token, shown in the admin panel
  lastError VARCHAR(500) NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
