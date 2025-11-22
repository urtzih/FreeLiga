-- Script con Datos Reales y Codificación UTF-8
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE group_players;
TRUNCATE TABLE matches;
TRUNCATE TABLE promotion_records;
TRUNCATE TABLE `groups`;
TRUNCATE TABLE seasons;
TRUNCATE TABLE players;
TRUNCATE TABLE users;

-- Admin
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES
('admin_main', 'admin@freesquash.com', '$2b$10$YourHashedPasswordHere', 'ADMIN', NOW(), NOW());

INSERT INTO players (id, userId, name, nickname, phone, email, createdAt, updatedAt) VALUES
('player_admin', 'admin_main', 'Administrador Principal', 'Admin', '600000000', 'admin@freesquash.com', NOW(), NOW());

-- Temporada
INSERT INTO seasons (id, name, startDate, endDate, createdAt, updatedAt) VALUES
('season_2024_2025', 'Temporada 2024-2025', '2024-09-01 00:00:00', '2025-06-30 23:59:59', NOW(), NOW());


-- Grupo 1 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_1', 'Grupo 1 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_oier_quesada', 'oier.quesada@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_oier_quesada', 'user_oier_quesada', 'Oier Quesada', 'oier.quesada@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_oier_quesada', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_santi_tobias', 'santi.tobias@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_santi_tobias', 'user_santi_tobias', 'Santi Tobias', 'santi.tobias@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_santi_tobias', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_jon_tona', 'jon.tona@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_jon_tona', 'user_jon_tona', 'Jon Toña', 'jon.tona@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_jon_tona', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_aitor_garcia', 'aitor.garcia@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_aitor_garcia', 'user_aitor_garcia', 'Aitor García', 'aitor.garcia@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_aitor_garcia', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_david_gancedo', 'david.gancedo@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_david_gancedo', 'user_david_gancedo', 'David Gancedo', 'david.gancedo@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_david_gancedo', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_bikendi_otalora', 'bikendi.otalora@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_bikendi_otalora', 'user_bikendi_otalora', 'Bikendi Otálora', 'bikendi.otalora@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_bikendi_otalora', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_itzel_reguero', 'itzel.reguero@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_itzel_reguero', 'user_itzel_reguero', 'Itzel Reguero', 'itzel.reguero@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_itzel_reguero', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_inigo_alonso', 'inigo.alonso@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_inigo_alonso', 'user_inigo_alonso', 'Iñigo Alonso', 'inigo.alonso@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_1', 'player_inigo_alonso', 8, NOW(), NOW());

-- Grupo 2 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_2', 'Grupo 2 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_cesar_berganzo', 'cesar.berganzo@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_cesar_berganzo', 'user_cesar_berganzo', 'Cesar Berganzo', 'cesar.berganzo@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_cesar_berganzo', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_eneko_izquierdo', 'eneko.izquierdo@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_eneko_izquierdo', 'user_eneko_izquierdo', 'Eneko Izquierdo', 'eneko.izquierdo@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_eneko_izquierdo', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_javier_pacheco', 'javier.pacheco@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_javier_pacheco', 'user_javier_pacheco', 'Javier Pacheco', 'javier.pacheco@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_javier_pacheco', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_alexander_egido', 'alexander.egido@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_alexander_egido', 'user_alexander_egido', 'Alexander Egido', 'alexander.egido@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_alexander_egido', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_javier_guinea', 'javier.guinea@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_javier_guinea', 'user_javier_guinea', 'Javier Guinea', 'javier.guinea@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_javier_guinea', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_eneko_uriarte', 'eneko.uriarte@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_eneko_uriarte', 'user_eneko_uriarte', 'Eneko Uriarte', 'eneko.uriarte@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_eneko_uriarte', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_gari_suarez', 'gari.suarez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_gari_suarez', 'user_gari_suarez', 'Gari Suárez', 'gari.suarez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_gari_suarez', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_pedro_a_garcia', 'pedro.a.garcia@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_pedro_a_garcia', 'user_pedro_a_garcia', 'Pedro A. García', 'pedro.a.garcia@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_2', 'player_pedro_a_garcia', 8, NOW(), NOW());

-- Grupo 3 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_3', 'Grupo 3 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_javier_crespo', 'javier.crespo@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_javier_crespo', 'user_javier_crespo', 'Javier Crespo', 'javier.crespo@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_javier_crespo', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_ruben_garcia', 'ruben.garcia@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_ruben_garcia', 'user_ruben_garcia', 'Ruben García', 'ruben.garcia@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_ruben_garcia', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_enrique_oquinena', 'enrique.oquinena@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_enrique_oquinena', 'user_enrique_oquinena', 'Enrique Oquiñena', 'enrique.oquinena@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_enrique_oquinena', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_vicente_avila', 'vicente.avila@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_vicente_avila', 'user_vicente_avila', 'Vicente Avila', 'vicente.avila@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_vicente_avila', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_hector_velasco', 'hector.velasco@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_hector_velasco', 'user_hector_velasco', 'Héctor Velasco', 'hector.velasco@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_hector_velasco', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_jon_barrena', 'jon.barrena@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_jon_barrena', 'user_jon_barrena', 'Jon Barrena', 'jon.barrena@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_jon_barrena', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_sergio_barquin', 'sergio.barquin@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_sergio_barquin', 'user_sergio_barquin', 'Sergio Barquín', 'sergio.barquin@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_sergio_barquin', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_asier_renobales', 'asier.renobales@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_asier_renobales', 'user_asier_renobales', 'Asier Renobales', 'asier.renobales@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_3', 'player_asier_renobales', 8, NOW(), NOW());

-- Grupo 4 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_4', 'Grupo 4 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_luis_m_rodriguez', 'luis.m.rodriguez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_luis_m_rodriguez', 'user_luis_m_rodriguez', 'Luis M. Rodríguez', 'luis.m.rodriguez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_luis_m_rodriguez', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_sergio_basconcillos', 'sergio.basconcillos@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_sergio_basconcillos', 'user_sergio_basconcillos', 'Sergio Basconcillos', 'sergio.basconcillos@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_sergio_basconcillos', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_iker_estibariz', 'iker.estibariz@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_iker_estibariz', 'user_iker_estibariz', 'Iker Estibariz', 'iker.estibariz@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_iker_estibariz', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_inigo_ullibarri', 'inigo.ullibarri@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_inigo_ullibarri', 'user_inigo_ullibarri', 'Iñigo Ullibarri', 'inigo.ullibarri@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_inigo_ullibarri', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_aritz_ruiz_de_azua', 'aritz.ruiz.de.azua@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_aritz_ruiz_de_azua', 'user_aritz_ruiz_de_azua', 'Aritz Ruiz de Azua', 'aritz.ruiz.de.azua@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_aritz_ruiz_de_azua', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_yeray_olgado', 'yeray.olgado@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_yeray_olgado', 'user_yeray_olgado', 'Yeray Olgado', 'yeray.olgado@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_yeray_olgado', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_alberto_garcia_s_m', 'alberto.garcia.s.m@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_alberto_garcia_s_m', 'user_alberto_garcia_s_m', 'Alberto García S.m', 'alberto.garcia.s.m@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_alberto_garcia_s_m', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_javier_uribe', 'javier.uribe@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_javier_uribe', 'user_javier_uribe', 'Javier Uribe', 'javier.uribe@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_javier_uribe', 8, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_urtzi_diaz', 'urtzi.diaz@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_urtzi_diaz', 'user_urtzi_diaz', 'Urtzi Diaz', 'urtzi.diaz@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_4', 'player_urtzi_diaz', 9, NOW(), NOW());

-- Grupo 5 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_5', 'Grupo 5 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_antonio_perez', 'antonio.perez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_antonio_perez', 'user_antonio_perez', 'Antonio Perez', 'antonio.perez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_antonio_perez', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_fernando_alonso', 'fernando.alonso@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_fernando_alonso', 'user_fernando_alonso', 'Fernando Alonso', 'fernando.alonso@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_fernando_alonso', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_miguel_ricarte', 'miguel.ricarte@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_miguel_ricarte', 'user_miguel_ricarte', 'Miguel Ricarte', 'miguel.ricarte@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_miguel_ricarte', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_javier_fuente', 'javier.fuente@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_javier_fuente', 'user_javier_fuente', 'Javier Fuente', 'javier.fuente@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_javier_fuente', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_victor_cirre', 'victor.cirre@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_victor_cirre', 'user_victor_cirre', 'Víctor Cirre', 'victor.cirre@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_victor_cirre', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_ander_leyun', 'ander.leyun@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_ander_leyun', 'user_ander_leyun', 'Ander Leyún', 'ander.leyun@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_ander_leyun', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_aratz_mugica', 'aratz.mugica@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_aratz_mugica', 'user_aratz_mugica', 'Aratz Mugica', 'aratz.mugica@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_aratz_mugica', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_patxi_minguez', 'patxi.minguez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_patxi_minguez', 'user_patxi_minguez', 'Patxi Minguez', 'patxi.minguez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_patxi_minguez', 8, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_jon_ander_calleja', 'jon.ander.calleja@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_jon_ander_calleja', 'user_jon_ander_calleja', 'Jon Ander Calleja', 'jon.ander.calleja@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_5', 'player_jon_ander_calleja', 9, NOW(), NOW());

-- Grupo 6 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_6', 'Grupo 6 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_alberto_garcia_alvaro', 'alberto.garcia.alvaro@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_alberto_garcia_alvaro', 'user_alberto_garcia_alvaro', 'Alberto García  Alvaro', 'alberto.garcia.alvaro@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_alberto_garcia_alvaro', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_mikel_fernandez', 'mikel.fernandez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_mikel_fernandez', 'user_mikel_fernandez', 'Mikel Fernandez', 'mikel.fernandez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_mikel_fernandez', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_gorka_ramirez', 'gorka.ramirez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_gorka_ramirez', 'user_gorka_ramirez', 'Gorka Ramirez', 'gorka.ramirez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_gorka_ramirez', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_jose_andres_gil', 'jose.andres.gil@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_jose_andres_gil', 'user_jose_andres_gil', 'José Andrés Gil', 'jose.andres.gil@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_jose_andres_gil', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_axier_plaza', 'axier.plaza@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_axier_plaza', 'user_axier_plaza', 'Axier Plaza', 'axier.plaza@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_axier_plaza', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_asier_etxenike', 'asier.etxenike@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_asier_etxenike', 'user_asier_etxenike', 'Asier Etxenike', 'asier.etxenike@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_asier_etxenike', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_enekoitz_arregi', 'enekoitz.arregi@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_enekoitz_arregi', 'user_enekoitz_arregi', 'Enekoitz Arregi', 'enekoitz.arregi@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_enekoitz_arregi', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_ricardo_alvarez', 'ricardo.alvarez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_ricardo_alvarez', 'user_ricardo_alvarez', 'Ricardo Alvarez', 'ricardo.alvarez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_ricardo_alvarez', 8, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_jon_ander_errasti', 'jon.ander.errasti@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_jon_ander_errasti', 'user_jon_ander_errasti', 'Jon Ander Errasti', 'jon.ander.errasti@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_6', 'player_jon_ander_errasti', 9, NOW(), NOW());

-- Grupo 7 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_7', 'Grupo 7 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_felix_martin', 'felix.martin@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_felix_martin', 'user_felix_martin', 'Felix Martín', 'felix.martin@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_felix_martin', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_inigo_hernandez', 'inigo.hernandez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_inigo_hernandez', 'user_inigo_hernandez', 'Íñigo Hernández', 'inigo.hernandez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_inigo_hernandez', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_roberto_mediavilla', 'roberto.mediavilla@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_roberto_mediavilla', 'user_roberto_mediavilla', 'Roberto Mediavilla', 'roberto.mediavilla@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_roberto_mediavilla', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_aitor_de_la_fuente', 'aitor.de.la.fuente@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_aitor_de_la_fuente', 'user_aitor_de_la_fuente', 'Aitor de la Fuente', 'aitor.de.la.fuente@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_aitor_de_la_fuente', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_chesco_angulo', 'chesco.angulo@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_chesco_angulo', 'user_chesco_angulo', 'Chesco Angulo', 'chesco.angulo@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_chesco_angulo', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_ahmad_f_hamam', 'ahmad.f.hamam@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_ahmad_f_hamam', 'user_ahmad_f_hamam', 'Ahmad F. Hamam', 'ahmad.f.hamam@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_ahmad_f_hamam', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_josu_jauregui', 'josu.jauregui@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_josu_jauregui', 'user_josu_jauregui', 'Josu Jauregui', 'josu.jauregui@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_josu_jauregui', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_asier_usunaga', 'asier.usunaga@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_asier_usunaga', 'user_asier_usunaga', 'Asier Usunaga', 'asier.usunaga@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_7', 'player_asier_usunaga', 8, NOW(), NOW());

-- Grupo 8 Taldea
INSERT INTO `groups` (id, name, seasonId, createdAt, updatedAt) VALUES ('group_8', 'Grupo 8 Taldea', 'season_2024_2025', NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_david_arias', 'david.arias@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_david_arias', 'user_david_arias', 'David Arias', 'david.arias@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_david_arias', 1, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_cristian_chaves', 'cristian.chaves@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_cristian_chaves', 'user_cristian_chaves', 'Cristian Chaves', 'cristian.chaves@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_cristian_chaves', 2, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_aitor_alonso', 'aitor.alonso@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_aitor_alonso', 'user_aitor_alonso', 'Aitor Alonso', 'aitor.alonso@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_aitor_alonso', 3, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_markel_santamaria', 'markel.santamaria@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_markel_santamaria', 'user_markel_santamaria', 'Markel Santamaría', 'markel.santamaria@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_markel_santamaria', 4, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_damian_escobero', 'damian.escobero@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_damian_escobero', 'user_damian_escobero', 'Damián Escobero', 'damian.escobero@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_damian_escobero', 5, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_julen_arejolaleiba', 'julen.arejolaleiba@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_julen_arejolaleiba', 'user_julen_arejolaleiba', 'Julen Arejolaleiba', 'julen.arejolaleiba@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_julen_arejolaleiba', 6, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_jon_narvaez', 'jon.narvaez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_jon_narvaez', 'user_jon_narvaez', 'Jon Narváez', 'jon.narvaez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_jon_narvaez', 7, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_inigo_viana', 'inigo.viana@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_inigo_viana', 'user_inigo_viana', 'Iñigo Viana', 'inigo.viana@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_inigo_viana', 8, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_guillermo_fortan', 'guillermo.fortan@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_guillermo_fortan', 'user_guillermo_fortan', 'Guillermo Fortan', 'guillermo.fortan@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_guillermo_fortan', 9, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_juan_lopez', 'juan.lopez@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_juan_lopez', 'user_juan_lopez', 'Juan Lopez', 'juan.lopez@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_juan_lopez', 10, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_enrique_estibariz', 'enrique.estibariz@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_enrique_estibariz', 'user_enrique_estibariz', 'Enrique Estibariz', 'enrique.estibariz@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_enrique_estibariz', 11, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_asier_barrieta', 'asier.barrieta@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_asier_barrieta', 'user_asier_barrieta', 'Asier Barrieta', 'asier.barrieta@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_asier_barrieta', 12, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_simon_garcia', 'simon.garcia@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_simon_garcia', 'user_simon_garcia', 'Simon García', 'simon.garcia@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_simon_garcia', 13, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_inaki_hualde', 'inaki.hualde@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_inaki_hualde', 'user_inaki_hualde', 'Iñaki Hualde', 'inaki.hualde@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_inaki_hualde', 14, NOW(), NOW());
INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('user_xabi_fndz_de_gaceo', 'xabi.fndz.de.gaceo@freesquash.com', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());
INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('player_xabi_fndz_de_gaceo', 'user_xabi_fndz_de_gaceo', 'Xabi Fndz. De Gaceo', 'xabi.fndz.de.gaceo@freesquash.com', NOW(), NOW());
INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), 'group_8', 'player_xabi_fndz_de_gaceo', 15, NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Datos Reales Cargados Correctamente' as Status;