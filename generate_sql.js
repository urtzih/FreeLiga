const fs = require('fs');

const rawData = `
Grupo 1 Taldea
1	Oier Quesada
1	Santi Tobias
1	Jon Toña
1	Aitor García
1	David Gancedo
1	Bikendi Otálora
1	Itzel Reguero
1	Iñigo Alonso
Grupo 2 Taldea
2	Cesar Berganzo
2	Eneko Izquierdo
2	Javier Pacheco
2	Alexander Egido
2	Javier Guinea
2	Eneko Uriarte
2	Gari Suárez 
2	Pedro A. García
Grupo 3 Taldea
3	Javier Crespo
3	Ruben García
3	Enrique Oquiñena
3	Vicente Avila
3	Héctor Velasco
3	Jon Barrena
3	Sergio Barquín
3	Asier Renobales
Grupo 4 Taldea
4	Luis M. Rodríguez
4	Sergio Basconcillos
4	Iker Estibariz
4	Iñigo Ullibarri
4	Aritz Ruiz de Azua
4	Yeray Olgado
4	Alberto García S.m
4	Javier Uribe
4	Urtzi Diaz
Grupo 5 Taldea
5	Antonio Perez
5	Fernando Alonso
5	Miguel Ricarte
5	Javier Fuente
5	Víctor Cirre
5	Ander Leyún
5	Aratz Mugica
5	Patxi Minguez
5	Jon Ander Calleja
Grupo 6 Taldea
6	Alberto García  Alvaro
6	Mikel Fernandez
6	Gorka Ramirez
6	José Andrés Gil
6	Axier Plaza
6	Asier Etxenike
6	Enekoitz Arregi
6	Ricardo Alvarez
6	Jon Ander Errasti 
Grupo 7 Taldea
7	Felix Martín
7	Íñigo Hernández
7	Roberto Mediavilla
7	Aitor de la Fuente
7	Chesco Angulo
7	Ahmad F. Hamam
7	Josu Jauregui
7	Asier Usunaga
Grupo 8 Taldea
8	David Arias
8	Cristian Chaves
8	Aitor Alonso
8	Markel Santamaría
8	Damián Escobero
8	Julen Arejolaleiba
8	Jon Narváez
8	Iñigo Viana
8	Guillermo Fortan
8	Juan Lopez
8	Enrique Estibariz
8	Asier Barrieta
8	Simon García
8	Iñaki Hualde
8	Xabi Fndz. De Gaceo
`;

function normalizeEmail(name) {
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]/g, ".") // Caracteres raros a puntos
        .replace(/\.+/g, ".") // Puntos múltiples a uno
        .replace(/^\.|\.$/g, "") // Quitar puntos inicio/fin
        + "@freesquash.com";
}

function generateSQL() {
    let sql = `-- Script con Datos Reales y Codificación UTF-8
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE group_players;
TRUNCATE TABLE matches;
TRUNCATE TABLE promotion_records;
TRUNCATE TABLE \`groups\`;
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

`;

    const lines = rawData.split('\n').filter(l => l.trim());
    let currentGroup = null;
    let groupId = null;
    let ranking = 1;

    for (const line of lines) {
        if (line.includes('Taldea')) {
            const groupName = line.trim();
            const groupNum = groupName.match(/\d+/)[0];
            groupId = `group_${groupNum}`;
            ranking = 1;

            sql += `\n-- ${groupName}\n`;
            sql += `INSERT INTO \`groups\` (id, name, seasonId, createdAt, updatedAt) VALUES ('${groupId}', '${groupName}', 'season_2024_2025', NOW(), NOW());\n`;
        } else {
            // Es un jugador: "1	Oier Quesada"
            const parts = line.trim().split(/\t+/);
            if (parts.length < 2) continue; // Skip malformed lines

            const name = parts[1].trim();
            const email = normalizeEmail(name);
            const userId = `user_${email.split('@')[0].replace(/\./g, '_')}`;
            const playerId = `player_${email.split('@')[0].replace(/\./g, '_')}`;

            // User
            sql += `INSERT INTO users (id, email, password, role, createdAt, updatedAt) VALUES ('${userId}', '${email}', '$2b$10$YourHashedPasswordHere', 'PLAYER', NOW(), NOW());\n`;

            // Player
            sql += `INSERT INTO players (id, userId, name, email, createdAt, updatedAt) VALUES ('${playerId}', '${userId}', '${name}', '${email}', NOW(), NOW());\n`;

            // Group Player
            sql += `INSERT INTO group_players (id, groupId, playerId, rankingPosition, createdAt, updatedAt) VALUES (UUID(), '${groupId}', '${playerId}', ${ranking}, NOW(), NOW());\n`;

            ranking++;
        }
    }

    sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;
    sql += `SELECT 'Datos Reales Cargados Correctamente' as Status;`;

    return sql;
}

fs.writeFileSync('seed-real-data.sql', generateSQL(), 'utf8');
console.log('SQL generado en seed-real-data.sql');
