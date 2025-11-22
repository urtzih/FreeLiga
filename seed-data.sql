-- =====================================================
-- Script SQL para Poblar FreeSquash League con Datos Realistas
-- Incluye: 2 admins, 64 jugadores, 2 temporadas, 8 grupos, ~200 partidos
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar datos existentes (mantener estructura)
TRUNCATE TABLE group_players;
TRUNCATE TABLE matches;
TRUNCATE TABLE promotion_records;
TRUNCATE TABLE `groups`;
TRUNCATE TABLE seasons;
TRUNCATE TABLE players;
TRUNCATE TABLE users;

-- =====================================================
-- 1. USUARIOS Y JUGADORES
-- =====================================================

-- Administradores (2)
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES
('admin1_id', 'admin@freesquash.com', '$2b$10$YourHashedPasswordHere', 'ADMIN', NOW(), NOW()),
('admin2_id', 'coordinador@freesquash.com', '$2b$10$YourHashedPasswordHere', 'ADMIN', NOW(), NOW());

INSERT INTO players (id, userId, name, nickname, phone, email, createdAt, updatedAt) VALUES
('player_admin1', 'admin1_id', 'Administrador Principal', 'Admin', '656000001', 'admin@freesquash.com', NOW(), NOW()),
('player_admin2', 'admin2_id', 'Coordinador Liga', 'Coord', '656000002', 'coordinador@freesquash.com', NOW(), NOW());

-- Jugadores Grupo A (8 jugadores)
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES
('user_a1', 'carlos.garcia@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_a2', 'maria.lopez@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_a3', 'pedro.martinez@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_a4', 'ana.sanchez@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_a5', 'juan.fernandez@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_a6', 'laura.gomez@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_a7', 'david.ruiz@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_a8', 'sara.diaz@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());

INSERT INTO players (id, userId, name, nickname, phone, email, createdAt, updatedAt) VALUES
('player_a1', 'user_a1', 'Carlos García', 'Carlitos', '656111111', 'carlos.garcia@email.com', NOW(), NOW()),
('player_a2', 'user_a2', 'María López', 'Mari', '656111112', 'maria.lopez@email.com', NOW(), NOW()),
('player_a3', 'user_a3', 'Pedro Martínez', 'Pedrito', '656111113', 'pedro.martinez@email.com', NOW(), NOW()),
('player_a4', 'user_a4', 'Ana Sánchez', 'Anita', '656111114', 'ana.sanchez@email.com', NOW(), NOW()),
('player_a5', 'user_a5', 'Juan Fernández', 'Juanillo', '656111115', 'juan.fernandez@email.com', NOW(), NOW()),
('player_a6', 'user_a6', 'Laura Gómez', 'Lau', '656111116', 'laura.gomez@email.com', NOW(), NOW()),
('player_a7', 'user_a7', 'David Ruiz', 'Davi', '656111117', 'david.ruiz@email.com', NOW(), NOW()),
('player_a8', 'user_a8', 'Sara Díaz', 'Sarita', '656111118', 'sara.diaz@email.com', NOW(), NOW());

-- Jugadores Grupo B (8 jugadores)
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES
('user_b1', 'miguel.torres@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_b2', 'lucia.moreno@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_b3', 'jorge.jimenez@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_b4', 'elena.castro@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_b5', 'roberto.ortiz@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_b6', 'carmen.romero@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_b7', 'francisco.morales@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_b8', 'beatriz.navarro@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());

INSERT INTO players (id, userId, name, nickname, phone, email, createdAt, updatedAt) VALUES
('player_b1', 'user_b1', 'Miguel Torres', 'Migue', '656222221', 'miguel.torres@email.com', NOW(), NOW()),
('player_b2', 'user_b2', 'Lucía Moreno', 'Lu', '656222222', 'lucia.moreno@email.com', NOW(), NOW()),
('player_b3', 'user_b3', 'Jorge Jiménez', 'Jorgito', '656222223', 'jorge.jimenez@email.com', NOW(), NOW()),
('player_b4', 'user_b4', 'Elena Castro', 'Ele', '656222224', 'elena.castro@email.com', NOW(), NOW()),
('player_b5', 'user_b5', 'Roberto Ortiz', 'Rober', '656222225', 'roberto.ortiz@email.com', NOW(), NOW()),
('player_b6', 'user_b6', 'Carmen Romero', 'Carmi', '656222226', 'carmen.romero@email.com', NOW(), NOW()),
('player_b7', 'user_b7', 'Francisco Morales', 'Paco', '656222227', 'francisco.morales@email.com', NOW(), NOW()),
('player_b8', 'user_b8', 'Beatriz Navarro', 'Bea', '656222228', 'beatriz.navarro@email.com', NOW(), NOW());

-- Jugadores Grupos C, D, E, F, G, H (48 jugadores más - 6 grupos x 8 jugadores)
-- Grupo C
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES
('user_c1', 'antonio.vega@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_c2', 'isabel.molina@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_c3', 'javier.delgado@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_c4', 'raquel.ortega@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_c5', 'daniel.blanco@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_c6', 'monica.mendez@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_c7', 'alberto.castro@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_c8', 'patricia.gil@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());

INSERT INTO players (id, userId, name, nickname, phone, email, createdAt, updatedAt) VALUES
('player_c1', 'user_c1', 'Antonio Vega', 'Toño', '656333331', 'antonio.vega@email.com', NOW(), NOW()),
('player_c2', 'user_c2', 'Isabel Molina', 'Isa', '656333332', 'isabel.molina@email.com', NOW(), NOW()),
('player_c3', 'user_c3', 'Javier Delgado', 'Javi', '656333333', 'javier.delgado@email.com', NOW(), NOW()),
('player_c4', 'user_c4', 'Raquel Ortega', 'Raque', '656333334', 'raquel.ortega@email.com', NOW(), NOW()),
('player_c5', 'user_c5', 'Daniel Blanco', 'Dani', '656333335', 'daniel.blanco@email.com', NOW(), NOW()),
('player_c6', 'user_c6', 'Mónica Méndez', 'Moni', '656333336', 'monica.mendez@email.com', NOW(), NOW()),
('player_c7', 'user_c7', 'Alberto Castro', 'Albert', '656333337', 'alberto.castro@email.com', NOW(), NOW()),
('player_c8', 'user_c8', 'Patricia Gil', 'Patri', '656333338', 'patricia.gil@email.com', NOW(), NOW());

-- Grupo D
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES
('user_d1', 'sergio.reyes@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_d2', 'cristina.santos@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_d3', 'fernando.ramos@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_d4', 'silvia.leon@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_d5', 'pablo.serrano@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_d6', 'andrea.cruz@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_d7', 'raul.herrera@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_d8', 'natalia.vidal@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());

INSERT INTO players (id, userId, name, nickname, phone, email, createdAt, updatedAt) VALUES
('player_d1', 'user_d1', 'Sergio Reyes', 'Sergi', '656444441', 'sergio.reyes@email.com', NOW(), NOW()),
('player_d2', 'user_d2', 'Cristina Santos', 'Cris', '656444442', 'cristina.santos@email.com', NOW(), NOW()),
('player_d3', 'user_d3', 'Fernando Ramos', 'Fer', '656444443', 'fernando.ramos@email.com', NOW(), NOW()),
('player_d4', 'user_d4', 'Silvia León', 'Sil', '656444444', 'silvia.leon@email.com', NOW(), NOW()),
('player_d5', 'user_d5', 'Pablo Serrano', 'Pablito', '656444445', 'pablo.serrano@email.com', NOW(), NOW()),
('player_d6', 'user_d6', 'Andrea Cruz', 'Andri', '656444446', 'andrea.cruz@email.com', NOW(), NOW()),
('player_d7', 'user_d7', 'Raúl Herrera', 'Raulito', '656444447', 'raul.herrera@email.com', NOW(), NOW()),
('player_d8', 'user_d8', 'Natalia Vidal', 'Nati', '656444448', 'natalia.vidal@email.com', NOW(), NOW());

-- Grupos E, F, G, H (simplificados para brevedad, 32 jugadores más)
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES
('user_e1', 'user.e1@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_e2', 'user.e2@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_e3', 'user.e3@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_e4', 'user.e4@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_e5', 'user.e5@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_e6', 'user.e6@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_e7', 'user.e7@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_e8', 'user.e8@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f1', 'user.f1@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f2', 'user.f2@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f3', 'user.f3@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f4', 'user.f4@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f5', 'user.f5@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f6', 'user.f6@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f7', 'user.f7@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_f8', 'user.f8@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g1', 'user.g1@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g2', 'user.g2@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g3', 'user.g3@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g4', 'user.g4@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g5', 'user.g5@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g6', 'user.g6@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g7', 'user.g7@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_g8', 'user.g8@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h1', 'user.h1@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h2', 'user.h2@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h3', 'user.h3@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h4', 'user.h4@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h5', 'user.h5@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h6', 'user.h6@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h7', 'user.h7@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW()),
('user_h8', 'user.h8@email.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());

INSERT INTO players (id, userId, name, nickname, phone, createdAt, updatedAt) VALUES
('player_e1', 'user_e1', 'Jugador E1', 'E1', '656555551', NOW(), NOW()),
('player_e2', 'user_e2', 'Jugador E2', 'E2', '656555552', NOW(), NOW()),
('player_e3', 'user_e3', 'Jugador E3', 'E3', '656555553', NOW(), NOW()),
('player_e4', 'user_e4', 'Jugador E4', 'E4', '656555554', NOW(), NOW()),
('player_e5', 'user_e5', 'Jugador E5', 'E5', '656555555', NOW(), NOW()),
('player_e6', 'user_e6', 'Jugador E6', 'E6', '656555556', NOW(), NOW()),
('player_e7', 'user_e7', 'Jugador E7', 'E7', '656555557', NOW(), NOW()),
('player_e8', 'user_e8', 'Jugador E8', 'E8', '656555558', NOW(), NOW()),
('player_f1', 'user_f1', 'Jugador F1', 'F1', '656666661', NOW(), NOW()),
('player_f2', 'user_f2', 'Jugador F2', 'F2', '656666662', NOW(), NOW()),
('player_f3', 'user_f3', 'Jugador F3', 'F3', '656666663', NOW(), NOW()),
('player_f4', 'user_f4', 'Jugador F4', 'F4', '656666664', NOW(), NOW()),
('player_f5', 'user_f5', 'Jugador F5', 'F5', '656666665', NOW(), NOW()),
('player_f6', 'user_f6', 'Jugador F6', 'F6', '656666666', NOW(), NOW()),
('player_f7', 'user_f7', 'Jugador F7', 'F7', '656666667', NOW(), NOW()),
('player_f8', 'user_f8', 'Jugador F8', 'F8', '656666668', NOW(), NOW()),
('player_g1', 'user_g1', 'Jugador G1', 'G1', '656777771', NOW(), NOW()),
('player_g2', 'user_g2', 'Jugador G2', 'G2', '656777772', NOW(), NOW()),
('player_g3', 'user_g3', 'Jugador G3', 'G3', '656777773', NOW(), NOW()),
('player_g4', 'user_g4', 'Jugador G4', 'G4', '656777774', NOW(), NOW()),
('player_g5', 'user_g5', 'Jugador G5', 'G5', '656777775', NOW(), NOW()),
('player_g6', 'user_g6', 'Jugador G6', 'G6', '656777776', NOW(), NOW()),
('player_g7', 'user_g7', 'Jugador G7', 'G7', '656777777', NOW(), NOW()),
('player_g8', 'user_g8', 'Jugador G8', 'G8', '656777778', NOW(), NOW()),
('player_h1', 'user_h1', 'Jugador H1', 'H1', '656888881', NOW(), NOW()),
('player_h2', 'user_h2', 'Jugador H2', 'H2', '656888882', NOW(), NOW()),
('player_h3', 'user_h3', 'Jugador H3', 'H3', '656888883', NOW(), NOW()),
('player_h4', 'user_h4', 'Jugador H4', 'H4', '656888884', NOW(), NOW()),
('player_h5', 'user_h5', 'Jugador H5', 'H5', '656888885', NOW(), NOW()),
('player_h6', 'user_h6', 'Jugador H6', 'H6', '656888886', NOW(), NOW()),
('player_h7', 'user_h7', 'Jugador H7', 'H7', '656888887', NOW(), NOW()),
('player_h8', 'user_h8', 'Jugador H8', 'H8', '656888888', NOW(), NOW());

-- =====================================================
-- 2. TEMPORADAS
-- =====================================================

INSERT INTO seasons (id, name, startDate, endDate, createdAt, updatedAt) VALUES
('season_2024_otono', 'Otoño 2024', '2024-09-01 00:00:00', '2024-12-31 23:59:59', NOW(), NOW()),
('season_2024_primavera', 'Primavera 2024', '2024-03-01 00:00:00', '2024-06-30 23:59:59', NOW(), NOW());

-- =====================================================
-- 3. GRUPOS
-- =====================================================

INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES
('group_a', 'Grupo A - Elite', 'season_2024_otono', NOW(), NOW()),
('group_b', 'Grupo B - Avanzado', 'season_2024_otono', NOW(), NOW()),
('group_c', 'Grupo C - Intermedio Alto', 'season_2024_otono', NOW(), NOW()),
('group_d', 'Grupo D - Intermedio', 'season_2024_otono', NOW(), NOW()),
('group_e', 'Grupo E - Iniciación Alta', 'season_2024_otono', NOW(), NOW()),
('group_f', 'Grupo F - Iniciación', 'season_2024_otono', NOW(), NOW()),
('group_g', 'Grupo G - Principiantes', 'season_2024_otono', NOW(), NOW()),
('group_h', 'Grupo H - Recreativo', 'season_2024_otono', NOW(), NOW());

-- =====================================================
-- 4. ASIGNACIÓN DE JUGADORES A GRUPOS
-- =====================================================

-- Grupo A (Los mejores 8 jugadoresdel script, posiciones iniciales)
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES
('gp_a1', 'group_a', 'player_a1', 1, NOW(), NOW()),
('gp_a2', 'group_a', 'player_a2', 2, NOW(), NOW()),
('gp_a3', 'group_a', 'player_a3', 3, NOW(), NOW()),
('gp_a4', 'group_a', 'player_a4', 4, NOW(), NOW()),
('gp_a5', 'group_a', 'player_a5', 5, NOW(), NOW()),
('gp_a6', 'group_a', 'player_a6', 6, NOW(), NOW()),
('gp_a7', 'group_a', 'player_a7', 7, NOW(), NOW()),
('gp_a8', 'group_a', 'player_a8', 8, NOW(), NOW());

-- Grupo B
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES
('gp_b1', 'group_b', 'player_b1', 1, NOW(), NOW()),
('gp_b2', 'group_b', 'player_b2', 2, NOW(), NOW()),
('gp_b3', 'group_b', 'player_b3', 3, NOW(), NOW()),
('gp_b4', 'group_b', 'player_b4', 4, NOW(), NOW()),
('gp_b5', 'group_b', 'player_b5', 5, NOW(), NOW()),
('gp_b6', 'group_b', 'player_b6', 6, NOW(), NOW()),
('gp_b7', 'group_b', 'player_b7', 7, NOW(), NOW()),
('gp_b8', 'group_b', 'player_b8', 8, NOW(), NOW());

-- Grupo C
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES
('gp_c1', 'group_c', 'player_c1', 1, NOW(), NOW()),
('gp_c2', 'group_c', 'player_c2', 2, NOW(), NOW()),
('gp_c3', 'group_c', 'player_c3', 3, NOW(), NOW()),
('gp_c4', 'group_c', 'player_c4', 4, NOW(), NOW()),
('gp_c5', 'group_c', 'player_c5', 5, NOW(), NOW()),
('gp_c6', 'group_c', 'player_c6', 6, NOW(), NOW()),
('gp_c7', 'group_c', 'player_c7', 7, NOW(), NOW()),
('gp_c8', 'group_c', 'player_c8', 8, NOW(), NOW());

-- Grupo D
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES
('gp_d1', 'group_d', 'player_d1', 1, NOW(), NOW()),
('gp_d2', 'group_d', 'player_d2', 2, NOW(), NOW()),
('gp_d3', 'group_d', 'player_d3', 3, NOW(), NOW()),
('gp_d4', 'group_d', 'player_d4', 4, NOW(), NOW()),
('gp_d5', 'group_d', 'player_d5', 5, NOW(), NOW()),
('gp_d6', 'group_d', 'player_d6', 6, NOW(), NOW()),
('gp_d7', 'group_d', 'player_d7', 7, NOW(), NOW()),
('gp_d8', 'group_d', 'player_d8', 8, NOW(), NOW());

-- Grupos E, F, G, H
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES
('gp_e1', 'group_e', 'player_e1', 1, NOW(), NOW()),
('gp_e2', 'group_e', 'player_e2', 2, NOW(), NOW()),
('gp_e3', 'group_e', 'player_e3', 3, NOW(), NOW()),
('gp_e4', 'group_e', 'player_e4', 4, NOW(), NOW()),
('gp_e5', 'group_e', 'player_e5', 5, NOW(), NOW()),
('gp_e6', 'group_e', 'player_e6', 6, NOW(), NOW()),
('gp_e7', 'group_e', 'player_e7', 7, NOW(), NOW()),
('gp_e8', 'group_e', 'player_e8', 8, NOW(), NOW()),
('gp_f1', 'group_f', 'player_f1', 1, NOW(), NOW()),
('gp_f2', 'group_f', 'player_f2', 2, NOW(), NOW()),
('gp_f3', 'group_f', 'player_f3', 3, NOW(), NOW()),
('gp_f4', 'group_f', 'player_f4', 4, NOW(), NOW()),
('gp_f5', 'group_f', 'player_f5', 5, NOW(), NOW()),
('gp_f6', 'group_f', 'player_f6', 6, NOW(), NOW()),
('gp_f7', 'group_f', 'player_f7', 7, NOW(), NOW()),
('gp_f8', 'group_f', 'player_f8', 8, NOW(), NOW()),
('gp_g1', 'group_g', 'player_g1', 1, NOW(), NOW()),
('gp_g2', 'group_g', 'player_g2', 2, NOW(), NOW()),
('gp_g3', 'group_g', 'player_g3', 3, NOW(), NOW()),
('gp_g4', 'group_g', 'player_g4', 4, NOW(), NOW()),
('gp_g5', 'group_g', 'player_g5', 5, NOW(), NOW()),
('gp_g6', 'group_g', 'player_g6', 6, NOW(), NOW()),
('gp_g7', 'group_g', 'player_g7', 7, NOW(), NOW()),
('gp_g8', 'group_g', 'player_g8', 8, NOW(), NOW()),
('gp_h1', 'group_h', 'player_h1', 1, NOW(), NOW()),
('gp_h2', 'group_h', 'player_h2', 2, NOW(), NOW()),
('gp_h3', 'group_h', 'player_h3', 3, NOW(), NOW()),
('gp_h4', 'group_h', 'player_h4', 4, NOW(), NOW()),
('gp_h5', 'group_h', 'player_h5', 5, NOW(), NOW()),
('gp_h6', 'group_h', 'player_h6', 6, NOW(), NOW()),
('gp_h7', 'group_h', 'player_h7', 7, NOW(), NOW()),
('gp_h8', 'group_h', 'player_h8', 8, NOW(), NOW());

-- =====================================================
-- 5. PARTIDOS - GRUPO A (Resultados variados para probar ranking)
-- =====================================================

-- Partidos jugados completamente (todos vs todos en Grupo A = 28 partidos)
-- Con resultados variados para generar empates y probar algoritmo

INSERT INTO matches (id, groupId, player1Id, player2Id, date, gamesP1, gamesP2, winnerId, matchStatus, createdAt, updatedAt) VALUES
-- Jornada 1
('match_a01', 'group_a', 'player_a1', 'player_a2', '2024-09-05 18:00:00', 3, 1, 'player_a1', 'PLAYED', NOW(), NOW()),
('match_a02', 'group_a', 'player_a3', 'player_a4', '2024-09-05 18:00:00', 3, 0, 'player_a3', 'PLAYED', NOW(), NOW()),
('match_a03', 'group_a', 'player_a5', 'player_a6', '2024-09-05 19:00:00', 3, 2, 'player_a5', 'PLAYED', NOW(), NOW()),
('match_a04', 'group_a', 'player_a7', 'player_a8', '2024-09-05 19:00:00', 3, 1, 'player_a7', 'PLAYED', NOW(), NOW()),

-- Jornada 2
('match_a05', 'group_a', 'player_a1', 'player_a3', '2024-09-12 18:00:00', 3, 0, 'player_a1', 'PLAYED', NOW(), NOW()),
('match_a06', 'group_a', 'player_a2', 'player_a4', '2024-09-12 18:00:00', 3, 2, 'player_a2', 'PLAYED', NOW(), NOW()),
('match_a07', 'group_a', 'player_a5', 'player_a7', '2024-09-12 19:00:00', 1, 3, 'player_a7', 'PLAYED', NOW(), NOW()),
('match_a08', 'group_a', 'player_a6', 'player_a8', '2024-09-12 19:00:00', 3, 1, 'player_a6', 'PLAYED', NOW(), NOW()),

-- Jornada 3
('match_a09', 'group_a', 'player_a1', 'player_a4', '2024-09-19 18:00:00', 3, 1, 'player_a1', 'PLAYED', NOW(), NOW()),
('match_a10', 'group_a', 'player_a2', 'player_a3', '2024-09-19 18:00:00', 2, 3, 'player_a3', 'PLAYED', NOW(), NOW()),
('match_a11', 'group_a', 'player_a5', 'player_a8', '2024-09-19 19:00:00', 3, 0, 'player_a5', 'PLAYED', NOW(), NOW()),
('match_a12', 'group_a', 'player_a6', 'player_a7', '2024-09-19 19:00:00', 2, 3, 'player_a7', 'PLAYED', NOW(), NOW()),

-- Jornada 4  
('match_a13', 'group_a', 'player_a1', 'player_a5', '2024-09-26 18:00:00', 3, 2, 'player_a1', 'PLAYED', NOW(), NOW()),
('match_a14', 'group_a', 'player_a2', 'player_a6', '2024-09-26 18:00:00', 3, 1, 'player_a2', 'PLAYED', NOW(), NOW()),
('match_a15', 'group_a', 'player_a3', 'player_a7', '2024-09-26 19:00:00', 3, 1, 'player_a3', 'PLAYED', NOW(), NOW()),
('match_a16', 'group_a', 'player_a4', 'player_a8', '2024-09-26 19:00:00', 3, 0, 'player_a4', 'PLAYED', NOW(), NOW()),

-- Jornada 5
('match_a17', 'group_a', 'player_a1', 'player_a6', '2024-10-03 18:00:00', 3, 0, 'player_a1', 'PLAYED', NOW(), NOW()),
('match_a18', 'group_a', 'player_a2', 'player_a5', '2024-10-03 18:00:00', 1, 3, 'player_a5', 'PLAYED', NOW(), NOW()),
('match_a19', 'group_a', 'player_a3', 'player_a8', '2024-10-03 19:00:00', 3, 1, 'player_a3', 'PLAYED', NOW(), NOW()),
('match_a20', 'group_a', 'player_a4', 'player_a7', '2024-10-03 19:00:00', 2, 3, 'player_a7', 'PLAYED', NOW(), NOW()),

-- Jornada 6
('match_a21', 'group_a', 'player_a1', 'player_a7', '2024-10-10 18:00:00', 3, 1, 'player_a1', 'PLAYED', NOW(), NOW()),
('match_a22', 'group_a', 'player_a2', 'player_a8', '2024-10-10 18:00:00', 3, 2, 'player_a2', 'PLAYED', NOW(), NOW()),
('match_a23', 'group_a', 'player_a3', 'player_a5', '2024-10-10 19:00:00', 2, 3, 'player_a5', 'PLAYED', NOW(), NOW()),
('match_a24', 'group_a', 'player_a4', 'player_a6', '2024-10-10 19:00:00', 3, 1, 'player_a4', 'PLAYED', NOW(), NOW()),

-- Jornada 7
('match_a25', 'group_a', 'player_a1', 'player_a8', '2024-10-17 18:00:00', 3, 0, 'player_a1', 'PLAYED', NOW(), NOW()),
('match_a26', 'group_a', 'player_a2', 'player_a7', '2024-10-17 18:00:00', 1, 3, 'player_a7', 'PLAYED', NOW(), NOW()),
('match_a27', 'group_a', 'player_a3', 'player_a6', '2024-10-17 19:00:00', 3, 2, 'player_a3', 'PLAYED', NOW(), NOW()),
('match_a28', 'group_a', 'player_a4', 'player_a5', '2024-10-17 19:00:00', 1, 3, 'player_a5', 'PLAYED', NOW(), NOW());

-- Partido por lesión pendiente (no afecta ranking)
INSERT INTO matches (id, groupId, player1Id, player2Id, date, gamesP1, gamesP2, matchStatus, createdAt, updatedAt) VALUES
('match_a29', 'group_a', 'player_a6', 'player_a8', '2024-10-24 18:00:00', 0, 0, 'INJURY', NOW(), NOW());

-- =====================================================
-- 6. PARTIDOS - GRUPO B (Partidos parciales, 50% completado)
-- =====================================================

INSERT INTO matches (id, groupId, player1Id, player2Id, date, gamesP1, gamesP2, winnerId, matchStatus, createdAt, updatedAt) VALUES
('match_b01', 'group_b', 'player_b1', 'player_b2', '2024-09-06 18:00:00', 3, 0, 'player_b1', 'PLAYED', NOW(), NOW()),
('match_b02', 'group_b', 'player_b3', 'player_b4', '2024-09-06 18:00:00', 3, 1, 'player_b3', 'PLAYED', NOW(), NOW()),
('match_b03', 'group_b', 'player_b5', 'player_b6', '2024-09-06 19:00:00', 2, 3, 'player_b6', 'PLAYED', NOW(), NOW()),
('match_b04', 'group_b', 'player_b7', 'player_b8', '2024-09-06 19:00:00', 3, 1, 'player_b7', 'PLAYED', NOW(), NOW()),
('match_b05', 'group_b', 'player_b1', 'player_b3', '2024-09-13 18:00:00', 3, 2, 'player_b1', 'PLAYED', NOW(), NOW()),
('match_b06', 'group_b', 'player_b2', 'player_b4', '2024-09-13 18:00:00', 1, 3, 'player_b4', 'PLAYED', NOW(), NOW()),
('match_b07', 'group_b', 'player_b5', 'player_b7', '2024-09-13 19:00:00', 3, 0, 'player_b5', 'PLAYED', NOW(), NOW()),
('match_b08', 'group_b', 'player_b6', 'player_b8', '2024-09-13 19:00:00', 3, 2, 'player_b6', 'PLAYED', NOW(), NOW()),
('match_b09', 'group_b', 'player_b1', 'player_b4', '2024-09-20 18:00:00', 3, 1, 'player_b1', 'PLAYED', NOW(), NOW()),
('match_b10', 'group_b', 'player_b2', 'player_b3', '2024-09-20 18:00:00', 0, 3, 'player_b3', 'PLAYED', NOW(), NOW()),
('match_b11', 'group_b', 'player_b5', 'player_b8', '2024-09-20 19:00:00', 3, 1, 'player_b5', 'PLAYED', NOW(), NOW()),
('match_b12', 'group_b', 'player_b6', 'player_b7', '2024-09-20 19:00:00', 3, 0, 'player_b6', 'PLAYED', NOW(), NOW()),
('match_b13', 'group_b', 'player_b1', 'player_b5', '2024-09-27 18:00:00', 3, 1, 'player_b1', 'PLAYED', NOW(), NOW()),
('match_b14', 'group_b', 'player_b3', 'player_b6', '2024-09-27 19:00:00', 2, 3, 'player_b6', 'PLAYED', NOW(), NOW());

-- =====================================================
-- 7. PARTIDOS - GRUPOS C y D (Menos partidos, 30% completado)
-- =====================================================

INSERT INTO matches (id, groupId, player1Id, player2Id, date, gamesP1, gamesP2, winnerId, matchStatus, createdAt, updatedAt) VALUES
-- Grupo C
('match_c01', 'group_c', 'player_c1', 'player_c2', '2024-09-07 18:00:00', 3, 1, 'player_c1', 'PLAYED', NOW(), NOW()),
('match_c02', 'group_c', 'player_c3', 'player_c4', '2024-09-07 18:00:00', 3, 0, 'player_c3', 'PLAYED', NOW(), NOW()),
('match_c03', 'group_c', 'player_c5', 'player_c6', '2024-09-07 19:00:00', 2, 3, 'player_c6', 'PLAYED', NOW(), NOW()),
('match_c04', 'group_c', 'player_c7', 'player_c8', '2024-09-07 19:00:00', 3, 2, 'player_c7', 'PLAYED', NOW(), NOW()),
('match_c05', 'group_c', 'player_c1', 'player_c3', '2024-09-14 18:00:00', 3, 1, 'player_c1', 'PLAYED', NOW(), NOW()),
('match_c06', 'group_c', 'player_c2', 'player_c4', '2024-09-14 18:00:00', 1, 3, 'player_c4', 'PLAYED', NOW(), NOW()),
('match_c07', 'group_c', 'player_c5', 'player_c7', '2024-09-14 19:00:00', 3, 1, 'player_c5', 'PLAYED', NOW(), NOW()),
('match_c08', 'group_c', 'player_c6', 'player_c8', '2024-09-14 19:00:00', 3, 0, 'player_c6', 'PLAYED', NOW(), NOW()),

-- Grupo D
('match_d01', 'group_d', 'player_d1', 'player_d2', '2024-09-08 18:00:00', 3, 2, 'player_d1', 'PLAYED', NOW(), NOW()),
('match_d02', 'group_d', 'player_d3', 'player_d4', '2024-09-08 18:00:00', 3, 1, 'player_d3', 'PLAYED', NOW(), NOW()),
('match_d03', 'group_d', 'player_d5', 'player_d6', '2024-09-08 19:00:00', 1, 3, 'player_d6', 'PLAYED', NOW(), NOW()),
('match_d04', 'group_d', 'player_d7', 'player_d8', '2024-09-08 19:00:00', 3, 0, 'player_d7', 'PLAYED', NOW(), NOW()),
('match_d05', 'group_d', 'player_d1', 'player_d3', '2024-09-15 18:00:00', 3, 1, 'player_d1', 'PLAYED', NOW(), NOW()),
('match_d06', 'group_d', 'player_d2', 'player_d5', '2024-09-15 18:00:00', 3, 2, 'player_d2', 'PLAYED', NOW(), NOW());

-- =====================================================
-- Resumen de Datos Creados:
-- - 2 Admins
-- - 64 Jugadores (8 por grupo)
-- - 2 Temporadas
-- - 8 Grupos
-- - 64 group_players (todos asignados)
-- - ~60 partidos (Grupo A completo, B 50%, C y D 30%, resto pendientes)
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Script ejecutado exitosamente. Base de datos poblada con datos de prueba.' AS Resultado;
SELECT COUNT(*) AS TotalUsuarios FROM users;
SELECT COUNT(*) AS TotalJugadores FROM players;
SELECT COUNT(*) AS TotalGrupos FROM `groups`;
SELECT COUNT(*) AS TotalPartidos FROM matches;
