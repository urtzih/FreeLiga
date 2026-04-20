-- Ensure the column exists in environments where it was introduced outside migrations.
-- Compatible with MySQL versions that do not support `ADD COLUMN IF NOT EXISTS`.
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'pushNotificationsEnabled'
);
SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `pushNotificationsEnabled` BOOLEAN NOT NULL DEFAULT false',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Existing users keep their current value; only affects new users by default.
ALTER TABLE `users`
  MODIFY COLUMN `pushNotificationsEnabled` BOOLEAN NOT NULL DEFAULT false;
