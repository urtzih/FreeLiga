-- Change pushNotificationsEnabled default from true to false
-- Existing users keep their current value; only affects new users
ALTER TABLE `users` MODIFY COLUMN `pushNotificationsEnabled` BOOLEAN NOT NULL DEFAULT false;
