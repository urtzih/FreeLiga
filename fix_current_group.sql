-- Script para corregir currentGroupId en la tabla players
-- Actualiza el campo currentGroupId basándose en la tabla group_players

UPDATE players p
INNER JOIN group_players gp ON p.id = gp.playerId
SET p.currentGroupId = gp.groupId;

SELECT ROW_COUNT() as 'Jugadores Actualizados';
