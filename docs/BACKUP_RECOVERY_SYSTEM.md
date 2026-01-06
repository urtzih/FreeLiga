# 🔐 Sistema de Backup y Recuperación

## 📋 Índice
- [Resumen](#resumen)
- [Configuración Inicial](#configuración-inicial)
- [Uso Local (Docker)](#uso-local-docker)
- [Uso en Producción (Railway)](#uso-en-producción-railway)
- [Backups Automáticos](#backups-automáticos)
- [Restauración](#restauración)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen

Sistema completo de backup y recuperación para proteger tu base de datos MySQL:

- ✅ **Backups automáticos diarios**
- ✅ **Retención de 30 días**
- ✅ **Compresión automática** (ahorra espacio)
- ✅ **Restauración segura** (con backup previo)
- ✅ **Compatible con Windows y Linux**
- ✅ **Funciona en local y producción**

---

## ⚙️ Configuración Inicial

### 1. Crear directorio de backups

```bash
mkdir backups
```

### 2. Agregar al .gitignore

```bash
echo "backups/" >> .gitignore
```

### 3. Dar permisos de ejecución (Linux/Mac)

```bash
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
```

---

## 💻 Uso Local (Docker)

### Backup Manual

**Windows (PowerShell):**
```powershell
.\scripts\backup-database.ps1
```

**Linux/Mac:**
```bash
./scripts/backup-database.sh
```

### Backup Programado (Windows)

Crea una tarea programada en Windows:

1. Abre **Programador de tareas**
2. Crear tarea básica
3. Nombre: "FreeLiga DB Backup"
4. Desencadenador: Diariamente a las 3:00 AM
5. Acción: Iniciar un programa
   - Programa: `powershell.exe`
   - Argumentos: `-File "C:\xampp\htdocs\personal\FreeLiga\scripts\backup-database.ps1"`
   - Directorio: `C:\xampp\htdocs\personal\FreeLiga`

### Backup Programado (Linux/Mac)

Agregar a crontab:

```bash
crontab -e
```

Agregar esta línea:
```bash
0 3 * * * cd /ruta/a/FreeLiga && ./scripts/backup-database.sh
```

---

## ☁️ Uso en Producción (Railway)

### Opción 1: GitHub Actions (Recomendado)

Ya está configurado en `.github/workflows/backup-database.yml`

**Configurar secrets en GitHub:**

1. Ve a tu repositorio → Settings → Secrets and variables → Actions
2. Agregar estos secrets:
   - `RAILWAY_DATABASE_URL`: Tu DATABASE_URL de Railway
   - `RAILWAY_TOKEN`: Token de Railway API (opcional)

**El backup se ejecutará:**
- ✅ Automáticamente todos los días a las 3:00 AM UTC
- ✅ Manualmente desde GitHub Actions tab
- ✅ Los backups se guardan en GitHub Artifacts por 30 días

### Opción 2: Railway Cron Job

Crear un servicio en Railway:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "./Dockerfile.backup"
  },
  "deploy": {
    "cronSchedule": "0 3 * * *",
    "startCommand": "/app/scripts/backup-database.sh"
  }
}
```

### Opción 3: Backup Manual desde Local

```bash
# Configurar Railway CLI
npm install -g @railway/cli
railway login

# Ejecutar backup
RAILWAY_ENVIRONMENT=production ./scripts/backup-database.sh
```

---

## 🔄 Restauración

### ⚠️ ADVERTENCIA
La restauración **sobrescribirá** tu base de datos actual. El script crea un backup de seguridad antes, pero ten cuidado.

### Ver backups disponibles

**Windows:**
```powershell
.\scripts\restore-database.ps1
```

**Linux/Mac:**
```bash
./scripts/restore-database.sh
```

### Restaurar un backup específico

**Windows:**
```powershell
.\scripts\restore-database.ps1 -BackupFile "backups\local_backup_20260106_150000.sql.gz"
```

**Linux/Mac:**
```bash
./scripts/restore-database.sh backups/local_backup_20260106_150000.sql.gz
```

### Restaurar el último backup

**Windows:**
```powershell
.\scripts\restore-database.ps1 -BackupFile latest
```

**Linux/Mac:**
```bash
./scripts/restore-database.sh latest
```

### Proceso de restauración

1. ✅ Muestra el archivo a restaurar
2. ✅ Pide confirmación (debes escribir "si")
3. ✅ Crea un backup de seguridad automático
4. ✅ Restaura el backup seleccionado
5. ✅ Si algo falla, restaura el backup de seguridad

---

## 🏆 Mejores Prácticas

### 1. Backups Regulares

- **Local:** Backup diario antes de trabajar
- **Producción:** Backup automático cada día

### 2. Verificar Backups

```bash
# Ver tamaño y fecha del último backup
ls -lh backups/latest.sql.gz

# Ver todos los backups
ls -lh backups/
```

### 3. Antes de Migraciones o Cambios Importantes

```bash
# Crear backup manual con nombre descriptivo
./scripts/backup-database.sh
mv backups/latest.sql.gz backups/pre_migration_$(date +%Y%m%d).sql.gz
```

### 4. Probar Restauración

De vez en cuando, prueba restaurar un backup en un entorno de desarrollo para asegurarte de que funciona.

### 5. Almacenamiento Externo

Para producción, considera almacenar backups en:
- AWS S3
- Azure Blob Storage
- Google Cloud Storage
- Dropbox / Google Drive

---

## 📊 Estructura de Archivos

```
FreeLiga/
├── scripts/
│   ├── backup-database.sh      # Backup (Linux/Mac)
│   ├── backup-database.ps1     # Backup (Windows)
│   ├── restore-database.sh     # Restaurar (Linux/Mac)
│   └── restore-database.ps1    # Restaurar (Windows)
├── backups/
│   ├── local_backup_20260106_120000.sql.gz
│   ├── local_backup_20260105_120000.sql.gz
│   └── latest.sql.gz           # Link al último backup
└── .github/
    └── workflows/
        └── backup-database.yml  # Backup automático en GitHub
```

---

## 🔧 Configuración Avanzada

### Cambiar retención de backups

**Linux/Mac:**
```bash
RETENTION_DAYS=60 ./scripts/backup-database.sh
```

**Windows:**
```powershell
.\scripts\backup-database.ps1 -RetentionDays 60
```

### Cambiar directorio de backups

**Linux/Mac:**
```bash
BACKUP_DIR=/ruta/externa/backups ./scripts/backup-database.sh
```

**Windows:**
```powershell
.\scripts\backup-database.ps1 -BackupDir "D:\Backups"
```

---

## 🆘 Troubleshooting

### Error: "Container no encontrado"

Verifica que el contenedor esté corriendo:
```bash
docker ps
```

Si no está corriendo:
```bash
docker-compose up -d mysql
```

### Error: "gzip no encontrado" (Windows)

Opción 1: Instalar gzip
```powershell
choco install gzip
```

Opción 2: El script de PowerShell usa .NET como alternativa automáticamente

### Error: "Permission denied"

**Linux/Mac:**
```bash
chmod +x scripts/*.sh
```

### Backup muy grande

Los backups están comprimidos con gzip. Si aún son muy grandes:

1. Limpia datos antiguos de la BD
2. Usa compresión adicional
3. Almacena en cloud storage

### No hay espacio en disco

```bash
# Limpiar backups más antiguos
find backups/ -name "*.sql.gz" -mtime +7 -delete
```

---

## 📈 Monitoreo

### Ver estadísticas de backups

**Linux/Mac:**
```bash
# Tamaño total de backups
du -sh backups/

# Número de backups
ls backups/*.sql.gz | wc -l

# Último backup
ls -lt backups/ | head -2
```

**Windows:**
```powershell
# Tamaño total
Get-ChildItem backups -Filter "*.sql.gz" | Measure-Object -Property Length -Sum

# Número de backups
(Get-ChildItem backups -Filter "*.sql.gz").Count

# Último backup
Get-ChildItem backups -Filter "*.sql.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

---

## 🚨 Plan de Recuperación de Desastres

### Si pierdes la base de datos completamente:

1. **Parar la aplicación**
   ```bash
   docker-compose down
   ```

2. **Restaurar el último backup**
   ```bash
   docker-compose up -d mysql
   ./scripts/restore-database.sh latest
   ```

3. **Verificar integridad**
   ```bash
   docker exec freeliga-mysql mysql -u root -p -e "SELECT COUNT(*) FROM users;"
   ```

4. **Reiniciar aplicación**
   ```bash
   docker-compose up -d
   ```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del script
2. Verifica que Docker esté corriendo
3. Comprueba las variables de entorno en `.env`
4. Verifica permisos de archivos

---

## ✅ Checklist de Seguridad

- [ ] Backups automáticos configurados
- [ ] Probé una restauración en desarrollo
- [ ] Los backups se almacenan fuera del servidor de producción
- [ ] Tengo backups de al menos 30 días
- [ ] Reviso los backups semanalmente
- [ ] Documenté el proceso para mi equipo

---

**Fecha de creación:** 6 de enero de 2026
**Última actualización:** 6 de enero de 2026
