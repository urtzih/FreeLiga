-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('PLAYER', 'ADMIN') NOT NULL DEFAULT 'PLAYER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastConnection` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `players` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `calendarEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `players_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seasons` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `previousSeasonId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `whatsappUrl` VARCHAR(191) NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `groups_seasonId_idx`(`seasonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_players` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `rankingPosition` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `group_players_groupId_idx`(`groupId`),
    INDEX `group_players_playerId_idx`(`playerId`),
    UNIQUE INDEX `group_players_groupId_playerId_key`(`groupId`, `playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `player1Id` VARCHAR(191) NOT NULL,
    `player2Id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `gamesP1` INTEGER NULL,
    `gamesP2` INTEGER NULL,
    `winnerId` VARCHAR(191) NULL,
    `matchStatus` ENUM('PLAYED', 'INJURY', 'CANCELLED') NOT NULL DEFAULT 'PLAYED',
    `scheduledDate` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `googleEventId` VARCHAR(191) NULL,
    `isScheduled` BOOLEAN NOT NULL DEFAULT false,
    `googleCalendarSyncStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `matches_googleEventId_key`(`googleEventId`),
    INDEX `matches_groupId_idx`(`groupId`),
    INDEX `matches_player1Id_idx`(`player1Id`),
    INDEX `matches_player2Id_idx`(`player2Id`),
    INDEX `matches_winnerId_idx`(`winnerId`),
    INDEX `matches_date_idx`(`date`),
    INDEX `matches_createdAt_idx`(`createdAt`),
    INDEX `matches_groupId_date_idx`(`groupId`, `date`),
    INDEX `matches_groupId_matchStatus_idx`(`groupId`, `matchStatus`),
    INDEX `matches_player1Id_date_idx`(`player1Id`, `date`),
    INDEX `matches_player2Id_date_idx`(`player2Id`, `date`),
    INDEX `matches_isScheduled_idx`(`isScheduled`),
    INDEX `matches_scheduledDate_idx`(`scheduledDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion_records` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `fromGroupId` VARCHAR(191) NULL,
    `toGroupId` VARCHAR(191) NULL,
    `movementType` ENUM('PROMOTION', 'RELEGATION', 'STAY') NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `promotion_records_playerId_idx`(`playerId`),
    INDEX `promotion_records_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `season_closures` (
    `id` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,

    UNIQUE INDEX `season_closures_seasonId_key`(`seasonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `season_closure_entries` (
    `id` VARCHAR(191) NOT NULL,
    `closureId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `fromGroupId` VARCHAR(191) NULL,
    `toGroupId` VARCHAR(191) NULL,
    `movementType` ENUM('PROMOTION', 'RELEGATION', 'STAY') NOT NULL,
    `finalRank` INTEGER NOT NULL,
    `matchesWon` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `season_closure_entries_closureId_idx`(`closureId`),
    INDEX `season_closure_entries_playerId_idx`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player_group_history` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NULL,
    `finalRank` INTEGER NULL,
    `movementType` ENUM('PROMOTION', 'RELEGATION', 'STAY') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `player_group_history_playerId_idx`(`playerId`),
    INDEX `player_group_history_seasonId_idx`(`seasonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player_season_stats` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NULL,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `setsWon` INTEGER NOT NULL DEFAULT 0,
    `setsLost` INTEGER NOT NULL DEFAULT 0,
    `injuries` INTEGER NOT NULL DEFAULT 0,
    `winRate` DOUBLE NOT NULL DEFAULT 0,
    `setDiff` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `player_season_stats_seasonId_idx`(`seasonId`),
    INDEX `player_season_stats_groupId_idx`(`groupId`),
    UNIQUE INDEX `player_season_stats_playerId_seasonId_key`(`playerId`, `seasonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bug_reports` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'ACK', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `userAgent` TEXT NULL,
    `appVersion` VARCHAR(191) NULL,
    `attachments` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bug_reports_status_idx`(`status`),
    INDEX `bug_reports_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bug_comments` (
    `id` VARCHAR(191) NOT NULL,
    `bugId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `comment` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bug_comments_bugId_idx`(`bugId`),
    INDEX `bug_comments_userId_idx`(`userId`),
    INDEX `bug_comments_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `google_calendar_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NULL,
    `calendarId` VARCHAR(191) NOT NULL DEFAULT 'primary',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `google_calendar_tokens_userId_key`(`userId`),
    INDEX `google_calendar_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `players` ADD CONSTRAINT `players_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seasons` ADD CONSTRAINT `seasons_previousSeasonId_fkey` FOREIGN KEY (`previousSeasonId`) REFERENCES `seasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_players` ADD CONSTRAINT `group_players_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_players` ADD CONSTRAINT `group_players_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_player1Id_fkey` FOREIGN KEY (`player1Id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_player2Id_fkey` FOREIGN KEY (`player2Id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_records` ADD CONSTRAINT `promotion_records_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_records` ADD CONSTRAINT `promotion_records_fromGroupId_fkey` FOREIGN KEY (`fromGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_records` ADD CONSTRAINT `promotion_records_toGroupId_fkey` FOREIGN KEY (`toGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_closures` ADD CONSTRAINT `season_closures_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_closureId_fkey` FOREIGN KEY (`closureId`) REFERENCES `season_closures`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_fromGroupId_fkey` FOREIGN KEY (`fromGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_toGroupId_fkey` FOREIGN KEY (`toGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_group_history` ADD CONSTRAINT `player_group_history_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_group_history` ADD CONSTRAINT `player_group_history_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_group_history` ADD CONSTRAINT `player_group_history_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_season_stats` ADD CONSTRAINT `player_season_stats_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_season_stats` ADD CONSTRAINT `player_season_stats_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_season_stats` ADD CONSTRAINT `player_season_stats_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bug_reports` ADD CONSTRAINT `bug_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bug_comments` ADD CONSTRAINT `bug_comments_bugId_fkey` FOREIGN KEY (`bugId`) REFERENCES `bug_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bug_comments` ADD CONSTRAINT `bug_comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `google_calendar_tokens` ADD CONSTRAINT `google_calendar_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
