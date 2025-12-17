-- ============================================================================
-- FreeSquash League - Seed de Producción con Datos Reales
-- ============================================================================
-- Fecha: 17 Diciembre 2025
-- Propósito: Importar estructura optimizada + datos iniciales limpios
-- Uso: Importar en DBeaver o ejecutar con mysql < seed-production.sql
-- ============================================================================

-- Limpiar base de datos (¡CUIDADO! Esto borra TODO)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `_prisma_migrations`;
DROP TABLE IF EXISTS `bug_reports`;
DROP TABLE IF EXISTS `player_season_stats`;
DROP TABLE IF EXISTS `player_group_history`;
DROP TABLE IF EXISTS `season_closure_entries`;
DROP TABLE IF EXISTS `season_closures`;
DROP TABLE IF EXISTS `promotion_records`;
DROP TABLE IF EXISTS `matches`;
DROP TABLE IF EXISTS `group_players`;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS `seasons`;
DROP TABLE IF EXISTS `players`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- ESTRUCTURA DE TABLAS (con optimizaciones incluidas)
-- ============================================================================

CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('PLAYER', 'ADMIN') NOT NULL DEFAULT 'PLAYER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `players` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `players_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `player1Id` VARCHAR(191) NOT NULL,
    `player2Id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `gamesP1` INTEGER NOT NULL,
    `gamesP2` INTEGER NOT NULL,
    `winnerId` VARCHAR(191) NULL,
    `matchStatus` ENUM('PLAYED', 'INJURY', 'CANCELLED') NOT NULL DEFAULT 'PLAYED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `matches_groupId_idx`(`groupId`),
    INDEX `matches_player1Id_idx`(`player1Id`),
    INDEX `matches_player2Id_idx`(`player2Id`),
    INDEX `matches_winnerId_fkey`(`winnerId`),
    INDEX `matches_date_idx`(`date`),
    INDEX `matches_createdAt_idx`(`createdAt`),
    INDEX `matches_groupId_date_idx`(`groupId`, `date`),
    INDEX `matches_player1Id_date_idx`(`player1Id`, `date`),
    INDEX `matches_player2Id_date_idx`(`player2Id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `season_closures` (
    `id` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    UNIQUE INDEX `season_closures_seasonId_key`(`seasonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `bug_reports` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'ACK', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `userAgent` TEXT NULL,
    `appVersion` VARCHAR(191) NULL,
    `attachments` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `bug_reports_status_idx`(`status`),
    INDEX `bug_reports_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE `players` ADD CONSTRAINT `players_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `seasons` ADD CONSTRAINT `seasons_previousSeasonId_fkey` 
    FOREIGN KEY (`previousSeasonId`) REFERENCES `seasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `groups` ADD CONSTRAINT `groups_seasonId_fkey` 
    FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `group_players` ADD CONSTRAINT `group_players_groupId_fkey` 
    FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `group_players` ADD CONSTRAINT `group_players_playerId_fkey` 
    FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `matches` ADD CONSTRAINT `matches_groupId_fkey` 
    FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `matches` ADD CONSTRAINT `matches_player1Id_fkey` 
    FOREIGN KEY (`player1Id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `matches` ADD CONSTRAINT `matches_player2Id_fkey` 
    FOREIGN KEY (`player2Id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `matches` ADD CONSTRAINT `matches_winnerId_fkey` 
    FOREIGN KEY (`winnerId`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `promotion_records` ADD CONSTRAINT `promotion_records_playerId_fkey` 
    FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `promotion_records` ADD CONSTRAINT `promotion_records_fromGroupId_fkey` 
    FOREIGN KEY (`fromGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `promotion_records` ADD CONSTRAINT `promotion_records_toGroupId_fkey` 
    FOREIGN KEY (`toGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `season_closures` ADD CONSTRAINT `season_closures_seasonId_fkey` 
    FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_closureId_fkey` 
    FOREIGN KEY (`closureId`) REFERENCES `season_closures`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_playerId_fkey` 
    FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_fromGroupId_fkey` 
    FOREIGN KEY (`fromGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `season_closure_entries` ADD CONSTRAINT `season_closure_entries_toGroupId_fkey` 
    FOREIGN KEY (`toGroupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `player_group_history` ADD CONSTRAINT `player_group_history_playerId_fkey` 
    FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `player_group_history` ADD CONSTRAINT `player_group_history_seasonId_fkey` 
    FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `player_group_history` ADD CONSTRAINT `player_group_history_groupId_fkey` 
    FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `player_season_stats` ADD CONSTRAINT `player_season_stats_playerId_fkey` 
    FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `player_season_stats` ADD CONSTRAINT `player_season_stats_seasonId_fkey` 
    FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `player_season_stats` ADD CONSTRAINT `player_season_stats_groupId_fkey` 
    FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bug_reports` ADD CONSTRAINT `bug_reports_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Administrador (contraseña: 123456)
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES
('admin-001', 'admin@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'ADMIN', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00');

INSERT INTO `players` (`id`, `userId`, `name`, `nickname`, `phone`, `email`, `createdAt`, `updatedAt`) VALUES
('player-admin', 'admin-001', 'Administrador FreeSquash', 'Admin', '600000000', 'admin@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00');

-- Jugadores de ejemplo (contraseña para todos: 123456)
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES
('user-001', 'juan.perez@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('user-002', 'maria.garcia@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('user-003', 'carlos.lopez@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('user-004', 'ana.martinez@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('user-005', 'david.sanchez@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('user-006', 'laura.rodriguez@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('user-007', 'pedro.gomez@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('user-008', 'sofia.fernandez@freesquash.com', '$2b$10$K7RqvPZGHvNJ5WvH.xJ3E.pXvOQNqP8zT2.LXxK0xQkYW5F5jQy9W', 'PLAYER', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00');

INSERT INTO `players` (`id`, `userId`, `name`, `nickname`, `phone`, `email`, `createdAt`, `updatedAt`) VALUES
('player-001', 'user-001', 'Juan Pérez Etxebarria', 'Juanpe', '612345678', 'juan.perez@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('player-002', 'user-002', 'María García Irigoyen', 'Mari', '623456789', 'maria.garcia@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('player-003', 'user-003', 'Carlos López Aranburu', 'Carlitos', '634567890', 'carlos.lopez@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('player-004', 'user-004', 'Ana Martínez Zubieta', 'Anita', '645678901', 'ana.martinez@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('player-005', 'user-005', 'David Sánchez Garitano', 'Davi', '656789012', 'david.sanchez@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('player-006', 'user-006', 'Laura Rodríguez Ugarte', 'Lau', '667890123', 'laura.rodriguez@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('player-007', 'user-007', 'Pedro Gómez Otxoa', 'Pedri', '678901234', 'pedro.gomez@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('player-008', 'user-008', 'Sofía Fernández Basabe', 'Sofi', '689012345', 'sofia.fernandez@freesquash.com', '2025-12-17 08:00:00', '2025-12-17 08:00:00');

-- Temporada Activa
INSERT INTO `seasons` (`id`, `name`, `startDate`, `endDate`, `isActive`, `createdAt`, `updatedAt`, `previousSeasonId`) VALUES
('season-001', 'Temporada Enero-Febrero 2026', '2026-01-06 00:00:00', '2026-02-28 23:59:59', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00', NULL);

-- Grupos
INSERT INTO `groups` (`id`, `name`, `whatsappUrl`, `seasonId`, `createdAt`, `updatedAt`) VALUES
('group-001', 'Grupo 1', NULL, 'season-001', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('group-002', 'Grupo 2', NULL, 'season-001', '2025-12-17 08:00:00', '2025-12-17 08:00:00');

-- Asignación de jugadores a grupos
INSERT INTO `group_players` (`id`, `groupId`, `playerId`, `rankingPosition`, `createdAt`, `updatedAt`) VALUES
-- Grupo 1 (mejores jugadores)
('gp-001', 'group-001', 'player-001', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('gp-002', 'group-001', 'player-002', 2, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('gp-003', 'group-001', 'player-003', 3, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('gp-004', 'group-001', 'player-004', 4, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
-- Grupo 2
('gp-005', 'group-002', 'player-005', 1, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('gp-006', 'group-002', 'player-006', 2, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('gp-007', 'group-002', 'player-007', 3, '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('gp-008', 'group-002', 'player-008', 4, '2025-12-17 08:00:00', '2025-12-17 08:00:00');

-- Partidos de ejemplo (Grupo 1)
INSERT INTO `matches` (`id`, `groupId`, `player1Id`, `player2Id`, `date`, `gamesP1`, `gamesP2`, `winnerId`, `matchStatus`, `createdAt`, `updatedAt`) VALUES
('match-001', 'group-001', 'player-001', 'player-002', '2025-12-18 18:00:00', 3, 1, 'player-001', 'PLAYED', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('match-002', 'group-001', 'player-003', 'player-004', '2025-12-19 19:00:00', 3, 0, 'player-003', 'PLAYED', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('match-003', 'group-001', 'player-001', 'player-003', '2025-12-20 18:30:00', 3, 2, 'player-001', 'PLAYED', '2025-12-17 08:00:00', '2025-12-17 08:00:00');

-- Partidos de ejemplo (Grupo 2)
INSERT INTO `matches` (`id`, `groupId`, `player1Id`, `player2Id`, `date`, `gamesP1`, `gamesP2`, `winnerId`, `matchStatus`, `createdAt`, `updatedAt`) VALUES
('match-004', 'group-002', 'player-005', 'player-006', '2025-12-18 17:00:00', 3, 1, 'player-005', 'PLAYED', '2025-12-17 08:00:00', '2025-12-17 08:00:00'),
('match-005', 'group-002', 'player-007', 'player-008', '2025-12-19 18:00:00', 2, 3, 'player-008', 'PLAYED', '2025-12-17 08:00:00', '2025-12-17 08:00:00');

-- Registro de migraciones Prisma
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
(UUID(), 'migration1', NOW(), '20251123144945_add_user_isactive', NULL, NULL, NOW(), 1),
(UUID(), 'migration2', NOW(), '20251204112925_add_matches_won_to_closure_entry', NULL, NULL, NOW(), 1),
(UUID(), 'migration3', NOW(), '20251204114247_add_is_active_to_season', NULL, NULL, NOW(), 1),
(UUID(), 'migration4', NOW(), '20251204115936_remove_current_group_id', NULL, NULL, NOW(), 1),
(UUID(), 'migration5', NOW(), '20251217_add_performance_indexes_and_stats', NULL, NULL, NOW(), 1);

-- ============================================================================
-- FIN DEL SEED
-- ============================================================================
-- 
-- RESUMEN:
-- - 1 Administrador: admin@freesquash.com (contraseña: 123456)
-- - 8 Jugadores con contraseña: 123456
-- - 1 Temporada activa (Enero-Febrero 2026)
-- - 2 Grupos (4 jugadores cada uno)
-- - 5 Partidos de ejemplo
-- - Estructura optimizada con índices compuestos
-- - Tabla player_season_stats lista para usar
--
-- PRÓXIMOS PASOS:
-- 1. Importar este archivo en DBeaver o Railway
-- 2. Regenerar cliente Prisma: npx prisma generate
-- 3. Reiniciar API: docker-compose restart api
-- 4. Acceder con: admin@freesquash.com / 123456
--
-- ============================================================================
