-- Idempotent migration for GDPR fields + annual fees backfill
-- Compatible with MySQL versions without ADD COLUMN IF NOT EXISTS

-- users.termsAcceptedAt
SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'termsAcceptedAt'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- users.privacyAcceptedAt
SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `privacyAcceptedAt` DATETIME(3) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'privacyAcceptedAt'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- users.termsAcceptanceMethod
SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `termsAcceptanceMethod` VARCHAR(191) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'termsAcceptanceMethod'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- players.annualFeesPaid
SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `players` ADD COLUMN `annualFeesPaid` LONGTEXT NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'players'
    AND COLUMN_NAME = 'annualFeesPaid'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill GDPR fields for existing users
UPDATE `users`
SET
  `termsAcceptedAt` = COALESCE(`termsAcceptedAt`, NOW(3)),
  `privacyAcceptedAt` = COALESCE(`privacyAcceptedAt`, NOW(3)),
  `termsAcceptanceMethod` = COALESCE(NULLIF(`termsAcceptanceMethod`, ''), 'system_backfill_2026')
WHERE
  `termsAcceptedAt` IS NULL
  OR `privacyAcceptedAt` IS NULL
  OR `termsAcceptanceMethod` IS NULL
  OR `termsAcceptanceMethod` = '';

-- Backfill annual fees with 2026 for all existing players
UPDATE `players`
SET `annualFeesPaid` = CASE
  WHEN `annualFeesPaid` IS NULL OR TRIM(`annualFeesPaid`) = '' OR `annualFeesPaid` = '[]' THEN '[2026]'
  WHEN JSON_VALID(`annualFeesPaid`) = 0 THEN '[2026]'
  WHEN JSON_CONTAINS(`annualFeesPaid`, '2026', '$') = 0 THEN JSON_ARRAY_APPEND(`annualFeesPaid`, '$', 2026)
  ELSE `annualFeesPaid`
END;

-- Ensure non-nullability after backfill (without default, for MySQL compatibility)
ALTER TABLE `players`
  MODIFY COLUMN `annualFeesPaid` LONGTEXT NOT NULL;
