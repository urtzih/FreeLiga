-- Ensure the column exists in environments where it was introduced outside migrations.
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `pushNotificationsEnabled` BOOLEAN NOT NULL DEFAULT false;

-- Existing users keep their current value; only affects new users by default.
ALTER TABLE `users`
  MODIFY COLUMN `pushNotificationsEnabled` BOOLEAN NOT NULL DEFAULT false;
