-- AddColumn to matches table
ALTER TABLE `matches` ADD COLUMN `scheduledDate` DATETIME(3);
ALTER TABLE `matches` ADD COLUMN `location` VARCHAR(191);
ALTER TABLE `matches` ADD COLUMN `googleEventId` VARCHAR(191);
ALTER TABLE `matches` ADD COLUMN `isScheduled` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `matches` ADD COLUMN `googleCalendarSyncStatus` VARCHAR(191);

-- Create indices
CREATE INDEX `matches_scheduledDate_idx` ON `matches`(`scheduledDate`);
CREATE INDEX `matches_isScheduled_idx` ON `matches`(`isScheduled`);
CREATE UNIQUE INDEX `matches_googleEventId_key` ON `matches`(`googleEventId`);
