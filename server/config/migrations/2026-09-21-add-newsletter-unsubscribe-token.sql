-- One-click unsubscribe.
--
-- newsletter_subscribers had no safe way to identify a subscriber in a URL:
-- putting the email address in the link would let anyone unsubscribe anyone,
-- and would leak addresses into referrer headers and server logs. A random
-- per-subscriber token solves both.
--
-- MD5(UUID() + RAND() + id) rather than RANDOM_BYTES(), which MariaDB only
-- gained in 10.10 — this server is 10.4.

ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS unsubscribeToken CHAR(32) NULL AFTER status;

UPDATE newsletter_subscribers
SET unsubscribeToken = MD5(CONCAT(UUID(), RAND(), id))
WHERE unsubscribeToken IS NULL OR unsubscribeToken = '';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_newsletter_unsub_token
ON newsletter_subscribers (unsubscribeToken);
