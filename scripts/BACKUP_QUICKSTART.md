# 🔐 Guía Rápida de Backups

## Primeros pasos

### 1. Hacer tu primer backup

**Windows:**
```powershell
.\scripts\backup-database.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/*.sh
./scripts/backup-database.sh
```

### 2. Verificar que funcionó

Deberías ver algo como:
```
🔄 Iniciando backup de base de datos...
📅 Fecha: 2026-01-06 15:30:00
📁 Directorio: .\backups
💾 Creando backup...
✅ Backup completado exitosamente
📦 Archivo: backups\local_backup_20260106_153000.sql.gz
📊 Tamaño: 2.5 MB
🎉 Proceso completado
```

### 3. Antes de trabajar

**Windows:**
```powershell
.\scripts\quick-backup.ps1
```

**Linux/Mac:**
```bash
./scripts/quick-backup.sh
```

## Restaurar un backup

### Ver backups disponibles

```powershell
# Windows
.\scripts\restore-database.ps1

# Linux/Mac
./scripts/restore-database.sh
```

### Restaurar el último backup

```powershell
# Windows
.\scripts\restore-database.ps1 -BackupFile latest

# Linux/Mac
./scripts/restore-database.sh latest
```

⚠️ **IMPORTANTE**: El script creará un backup de seguridad antes de restaurar.

## Backups automáticos

### Windows - Programador de tareas

1. Busca "Programador de tareas" en el menú de inicio
2. "Crear tarea básica"
3. Nombre: "FreeLiga DB Backup"
4. Desencadenador: Diariamente a las 3:00 AM
5. Acción: Iniciar programa
   - Programa: `powershell.exe`
   - Argumentos: `-File "C:\xampp\htdocs\personal\FreeLiga\scripts\backup-database.ps1"`
   - Directorio: `C:\xampp\htdocs\personal\FreeLiga`

### Linux/Mac - Crontab

```bash
crontab -e
```

Agregar:
```
0 3 * * * cd /ruta/a/FreeLiga && ./scripts/backup-database.sh
```

## GitHub Actions (Producción)

Ya está configurado en `.github/workflows/backup-database.yml`

### Configurar secrets:

1. Ve a GitHub → Settings → Secrets → Actions
2. Agrega:
   - `RAILWAY_DATABASE_URL`: Tu DATABASE_URL de Railway
   - `RAILWAY_TOKEN`: Token de Railway (opcional)

Los backups se guardarán automáticamente cada día a las 3:00 AM UTC.

## ¿Qué hacer si...?

### "Rompí la base de datos"

1. Para la aplicación:
   ```bash
   docker-compose down
   ```

2. Restaura el último backup:
   ```bash
   docker-compose up -d mysql
   ./scripts/restore-database.sh latest
   ```

3. Reinicia todo:
   ```bash
   docker-compose up -d
   ```

### "Necesito probar algo peligroso"

```bash
# 1. Hacer backup con nombre descriptivo
./scripts/backup-database.sh
mv backups/latest.sql.gz backups/pre_experimento.sql.gz

# 2. Haz tus cambios

# 3. Si algo sale mal:
./scripts/restore-database.sh backups/pre_experimento.sql.gz
```

### "Quiero ver cuánto espacio ocupan los backups"

```powershell
# Windows
Get-ChildItem backups -Filter "*.sql.gz" | Measure-Object -Property Length -Sum

# Linux/Mac
du -sh backups/
```

## Ver documentación completa

Para más detalles, ver [BACKUP_RECOVERY_SYSTEM.md](../docs/BACKUP_RECOVERY_SYSTEM.md)
