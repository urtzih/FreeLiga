# Importación de Datos a Producción

Guía paso a paso para importar el seed de producción en Railway u otro servidor.

## Opción 1: Con DBeaver (Recomendado para principiantes)

### 1. Conectar a Base de Datos de Producción

1. Abrir DBeaver
2. Nueva Conexión → MySQL
3. Completar datos de Railway:
   - **Host:** Obtener de Railway Dashboard
   - **Port:** 3306 (o el que te dé Railway)
   - **Database:** railway
   - **Usuario:** Obtener de Railway
   - **Password:** Obtener de Railway

4. Test Connection → OK → Finish

### 2. Importar SQL

1. Click derecho en la conexión → **SQL Editor** → **Open SQL Script**
2. Seleccionar: `docs/seed-production.sql`
3. Click en **Execute SQL Script** (▶️ con documento)
4. Esperar a que termine (verás mensajes de confirmación)

### 3. Verificar Importación

Ejecutar en SQL Editor:
```sql
SELECT COUNT(*) as total_usuarios FROM users;
SELECT COUNT(*) as total_jugadores FROM players;
SELECT COUNT(*) as total_partidos FROM matches;
SELECT name, isActive FROM seasons;
```

Deberías ver:
- 9 usuarios (1 admin + 8 jugadores)
- 9 jugadores
- 5 partidos
- 1 temporada activa

### 4. Regenerar Prisma y Reiniciar

```bash
# Local
cd packages/database
npx prisma generate

# Railway (si usas Railway CLI)
railway run npx prisma generate
railway restart
```

## Opción 2: Railway CLI (Más rápido)

```bash
# 1. Instalar Railway CLI si no lo tienes
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link al proyecto
railway link

# 4. Importar SQL
railway run mysql < docs/seed-production.sql

# 5. Verificar
railway run mysql -e "SELECT email FROM users;"

# 6. Regenerar Prisma
railway run npx prisma generate

# 7. Reiniciar
railway restart
```

## Opción 3: Línea de Comandos Directa

Si tienes acceso SSH o conoces la URL de conexión:

```bash
# Con MySQL client instalado
mysql -h tu-host.railway.app -u usuario -p railway < docs/seed-production.sql

# Verificar
mysql -h tu-host.railway.app -u usuario -p railway -e "SELECT COUNT(*) FROM users;"
```

## Credenciales Después de la Importación

### Administrador
- **Email:** admin@freesquash.com
- **Password:** 123456

### Jugadores de Ejemplo (todos con password: 123456)
1. juan.perez@freesquash.com
2. maria.garcia@freesquash.com
3. carlos.lopez@freesquash.com
4. ana.martinez@freesquash.com
5. david.sanchez@freesquash.com
6. laura.rodriguez@freesquash.com
7. pedro.gomez@freesquash.com
8. sofia.fernandez@freesquash.com

## Datos Incluidos

- ✅ 1 Temporada activa: "Temporada Enero-Febrero 2026"
- ✅ 2 Grupos (Grupo 1 y Grupo 2)
- ✅ 4 jugadores por grupo
- ✅ 5 partidos de ejemplo ya registrados
- ✅ Estructura optimizada con índices
- ✅ Tabla `player_season_stats` lista

## Después de Importar

### 1. Cambiar Contraseñas
Los usuarios deberían cambiar sus contraseñas desde "Perfil" al entrar por primera vez.

### 2. Actualizar Datos de Jugadores
Editar desde Admin → Usuarios:
- Teléfonos reales
- Emails reales
- Apodos

### 3. Ajustar Temporada
Desde Admin → Temporadas:
- Cambiar fechas si es necesario
- Añadir más grupos si hace falta

### 4. Registrar Partidos Reales
Los 5 partidos de ejemplo son ficticios. Puedes:
- Borrarlos desde "Ver todos los partidos"
- O dejarlos como historial de prueba

## Troubleshooting

### "Access denied for user"
Verifica que estás usando las credenciales correctas de Railway. Ve a tu proyecto en Railway → Database → Connect → Copy MySQL URL.

### "Table already exists"
La base de datos no está vacía. Opciones:
1. Borrar todas las tablas manualmente en DBeaver
2. O modificar el script comentando las líneas `DROP TABLE IF EXISTS`

### "Foreign key constraint fails"
Asegúrate de importar el archivo completo sin modificaciones. El orden de creación es importante.

### Después de importar no puedo entrar
1. Verifica que el servicio API se reinició
2. Verifica que Prisma se regeneró: `npx prisma generate`
3. Limpia caché del navegador (Ctrl+Shift+Delete)
4. Prueba en ventana de incógnito

## Backup Antes de Importar (Seguridad)

Si Railway ya tiene datos que quieres conservar:

```bash
# Backup con Railway CLI
railway run mysqldump railway > backup-antes-seed-$(date +%Y%m%d).sql

# O con DBeaver: Click derecho DB → Tools → Dump Database
```

Para restaurar si algo sale mal:
```bash
railway run mysql railway < backup-antes-seed-20251217.sql
```

---

**¿Necesitas ayuda?** Revisa los logs del servidor después de reiniciar para verificar que todo cargó correctamente.
