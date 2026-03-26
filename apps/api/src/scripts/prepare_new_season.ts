/**
 * Script para preparar una nueva temporada
 * - Crea una nueva Season
 * - Limpia datos de temporadas anteriores (matches, promotions, closures)
 * - Importa jugadores desde CSV a nuevos grupos
 * 
 * Uso:
 * 1. Coloca dos archivos CSV en /temp:
 *    - users_active.csv (email, name, nickname, phone)
 *    - groups_assignment.csv (email, group_name)
 * 2. Ejecuta: npx ts-node src/scripts/prepare_new_season.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface UserInput {
  email: string;
  name: string;
  nickname?: string;
  phone?: string;
}

interface GroupAssignment {
  email: string;
  group_name: string;
}

// Función para leer CSV
function readCSV(filePath: string): string[][] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  return lines.map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^["']|["']$/g, ""))
  );
}

// Función para parsear usuarios desde CSV
function parseUsers(rows: string[][]): UserInput[] {
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const emailIdx = headers.indexOf("email");
  const nameIdx = headers.indexOf("name");
  const nicknameIdx = headers.indexOf("nickname");
  const phoneIdx = headers.indexOf("phone");

  if (emailIdx === -1) throw new Error("CSV debe contener columna 'email'");
  if (nameIdx === -1) throw new Error("CSV debe contener columna 'name'");

  return rows.slice(1).map((row) => ({
    email: row[emailIdx],
    name: row[nameIdx],
    nickname: nicknameIdx >= 0 ? row[nicknameIdx] : undefined,
    phone: phoneIdx >= 0 ? row[phoneIdx] : undefined,
  }));
}

// Función para parsear asignaciones a grupos
function parseGroupAssignments(rows: string[][]): GroupAssignment[] {
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const emailIdx = headers.indexOf("email");
  const groupIdx = headers.indexOf("group_name");

  if (emailIdx === -1) throw new Error("CSV debe contener columna 'email'");
  if (groupIdx === -1) throw new Error("CSV debe contener columna 'group_name'");

  return rows.slice(1).map((row) => ({
    email: row[emailIdx],
    group_name: row[groupIdx],
  }));
}

async function main() {
  try {
    console.log("🔄 Iniciando preparación de nueva temporada...\n");

    // Crear nueva Season
    const seasonName = "Enero-Febrero 2026";
    const season = await prisma.season.create({
      data: {
        name: seasonName,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-02-28"),
        isActive: true,
      },
    });
    console.log(`✅ Season creada: ${season.name} (${season.id})`);

    // Leer archivos CSV
    const usersPath = path.join(__dirname, "../../temp/users_active.csv");
    const groupsPath = path.join(__dirname, "../../temp/groups_assignment.csv");

    if (!fs.existsSync(usersPath)) {
      console.error(
        `❌ Archivo no encontrado: ${usersPath}\nCrea un archivo CSV con columnas: email, name, nickname, phone`
      );
      return;
    }

    if (!fs.existsSync(groupsPath)) {
      console.error(
        `❌ Archivo no encontrado: ${groupsPath}\nCrea un archivo CSV con columnas: email, group_name`
      );
      return;
    }

    // Parsear datos
    const usersData = parseUsers(readCSV(usersPath));
    const groupsData = parseGroupAssignments(readCSV(groupsPath));

    console.log(`\n📊 Datos leídos:`);
    console.log(`  - ${usersData.length} usuarios`);
    console.log(`  - ${groupsData.length} asignaciones a grupos`);

    // Agrupar asignaciones por nombre de grupo
    const groupsMap = new Map<string, string[]>();
    for (const assignment of groupsData) {
      if (!groupsMap.has(assignment.group_name)) {
        groupsMap.set(assignment.group_name, []);
      }
      groupsMap.get(assignment.group_name)!.push(assignment.email);
    }

    console.log(
      `\n🏢 Grupos a crear: ${Array.from(groupsMap.keys()).join(", ")}`
    );

    // Crear o actualizar usuarios
    console.log(`\n👥 Creando/actualizando usuarios...`);
    const userMap = new Map<string, string>(); // email -> userId

    // Hash la contraseña una sola vez
    const hashedPassword = await bcrypt.hash("123456", 10);

    for (const userData of usersData) {
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        // Crear usuario nuevo
        user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            role: "PLAYER",
            isActive: true,
          },
        });
        console.log(`  ✓ Usuario creado: ${userData.email}`);
      } else {
        // Actualizar usuario existente
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true, password: hashedPassword },
        });
        console.log(`  ✓ Usuario reactivado: ${userData.email}`);
      }

      // Crear o actualizar Player
      let player = await prisma.player.findUnique({
        where: { userId: user.id },
      });

      if (!player) {
        player = await prisma.player.create({
          data: {
            userId: user.id,
            name: userData.name,
            nickname: userData.nickname,
            phone: userData.phone,
          },
        });
      } else {
        player = await prisma.player.update({
          where: { id: player.id },
          data: {
            name: userData.name,
            nickname: userData.nickname || player.nickname,
            phone: userData.phone || player.phone,
          },
        });
      }

      userMap.set(userData.email, player.id);
    }

    // Crear grupos y asignar jugadores
    console.log(`\n🏆 Creando grupos y asignando jugadores...`);

    for (const [groupName, emails] of groupsMap.entries()) {
      const group = await prisma.group.create({
        data: {
          name: groupName,
          seasonId: season.id,
        },
      });

      console.log(`\n  📌 Grupo: ${groupName}`);

      for (const email of emails) {
        const playerId = userMap.get(email);
        if (!playerId) {
          console.log(`    ⚠ Usuario no encontrado: ${email}`);
          continue;
        }

        // Remover de otros grupos en esta temporada
        await prisma.groupPlayer.deleteMany({
          where: {
            playerId,
            group: { seasonId: season.id },
          },
        });

        // Agregar al nuevo grupo
        await prisma.groupPlayer.create({
          data: {
            groupId: group.id,
            playerId,
            rankingPosition: 0,
          },
        });

        console.log(`    ✓ ${email}`);
      }
    }

    console.log(`\n📝 Limpiando datos de temporadas anteriores...`);

    // Obtener todas las temporadas excepto la nueva
    const oldSeasons = await prisma.season.findMany({
      where: { id: { not: season.id } },
      select: { id: true },
    });

    // Eliminar matches de temporadas anteriores
    const matchesDeleted = await prisma.match.deleteMany({
      where: {
        group: {
          seasonId: {
            in: oldSeasons.map((s) => s.id),
          },
        },
      },
    });

    // Eliminar promotion records
    const promotionsDeleted = await prisma.promotionRecord.deleteMany({
      where: {
        fromGroup: {
          seasonId: {
            in: oldSeasons.map((s) => s.id),
          },
        },
      },
    });

    // Eliminar season closures
    const closuresDeleted = await prisma.seasonClosure.deleteMany({
      where: {
        seasonId: {
          in: oldSeasons.map((s) => s.id),
        },
      },
    });

    console.log(`  ✓ ${matchesDeleted.count} matches eliminados`);
    console.log(`  ✓ ${promotionsDeleted.count} promotion records eliminados`);
    console.log(`  ✓ ${closuresDeleted.count} season closures eliminados`);

    console.log(`\n✨ ¡Preparación completada exitosamente!`);
    console.log(`\n📋 Resumen:`);
    console.log(`  - Nueva Season: ${seasonName}`);
    console.log(`  - Grupos creados: ${groupsMap.size}`);
    console.log(`  - Jugadores asignados: ${usersData.length}`);
    console.log(`  - Datos limpiados de ${oldSeasons.length} temporadas anteriores`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
