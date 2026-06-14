ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS isPrimary TINYINT(1) NOT NULL DEFAULT 0;

UPDATE addresses a
JOIN (
  SELECT userId, MAX(id) AS addressId
  FROM addresses
  GROUP BY userId
) latest
  ON latest.userId = a.userId
 AND latest.addressId = a.id
LEFT JOIN (
  SELECT userId, SUM(CASE WHEN isPrimary = 1 THEN 1 ELSE 0 END) AS primaryCount
  FROM addresses
  GROUP BY userId
) stats
  ON stats.userId = a.userId
SET a.isPrimary = 1
WHERE COALESCE(stats.primaryCount, 0) = 0;

UPDATE addresses a
JOIN (
  SELECT userId, MAX(id) AS keepId
  FROM addresses
  WHERE isPrimary = 1
  GROUP BY userId
) keepers
  ON keepers.userId = a.userId
SET a.isPrimary = CASE WHEN a.id = keepers.keepId THEN 1 ELSE 0 END
WHERE a.userId IN (
  SELECT userId
  FROM (
    SELECT userId
    FROM addresses
    WHERE isPrimary = 1
    GROUP BY userId
    HAVING COUNT(*) > 1
  ) duplicated_users
);
