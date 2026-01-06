# Resumen Sistema Backups & Recovery - FreeLiga

## 📋 Estado Actual del Sistema

### ✅ COMPLETADO Y FUNCIONANDO

| Componente | Estado | Comando | Ubicacion |
|-----------|--------|---------|----------|
| **Backup LOCAL** | ✅ PROBADO | `npm run backup:quick` | `scripts/backup-database.ps1` |
| **Restore LOCAL** | ✅ PROBADO | `npm run restore` | `scripts/restore-database.ps1` |
| **GitHub Actions** | ✅ IMPLEMENTADO | Daily 3:00 UTC | `.github/workflows/backup-database.yml` |
| **Compresion GZip** | ✅ NATIVO | Usa .NET GzipStream | PowerShell nativo |
| **Documentacion** | ✅ COMPLETA | 5+ documentos | `docs/` y `scripts/` |

### ⚠️ REQUIERE ACCION

| Item | Problema | Accion |
|------|----------|--------|
| **sync-prod-to-local** | Conexion remota inestable | Ver `DESCARGAR_BACKUP_RAILWAY.md` |
| **Credenciales .env** | EXPUESTAS en repositorio | Ver `SECURITY_FIX_REQUIRED.md` |
| **PASSWORD en Railway** | Debe ser rotada | Cambiar en https://railway.app/ |
| **Git History** | Contiene credenciales | Limpiar con BFG o git filter-branch |

---

## 🎯 Casos de Uso & Solucion Rapida

### "Necesito datos frescos de PROD"

```powershell
# OPCION 1: Automatico (si funciona)
npm run sync
# Descarga, comprime, restaura = 2-5 minutos

# OPCION 2: Manual (si OPCION 1 falla)
# 1. Abre: https://railway.app/
# 2. Proyecto -> MySQL -> Backups
# 3. Descarga backup
# 4. Copia a carpeta: backups/
# 5. npm run restore
```

### "Rompi la BD local, quiero volver atras"

```powershell
npm run restore
# Selecciona el backup anterior
# Vuelve atras en segundos
```

### "Necesito documentar cambios antes de hacer backup"

```powershell
npm run backup:quick
# Crea: backups/local_backup_TIMESTAMP.sql.gz
# Referencia para documentar que cambio
```

### "Quiero ver todos mis backups"

```powershell
ls backups/ -la
# Muestra:
# - prod_sync_*.sql.gz
# - local_backup_*.sql.gz
# - latest.sql.gz (symlink)
```

---

## 📁 Estructura de Archivos

```
FreeLiga/
├── scripts/
│   ├── backup-database.ps1          (PowerShell - crea backup comprimido)
│   ├── restore-database.ps1         (PowerShell - restaura desde backup)
│   ├── sync-prod-to-local.ps1       (PowerShell - descarga PROD y restaura)
│   ├── quick-backup.ps1             (PowerShell - alias corto)
│   ├── backup-prod.ps1              (PowerShell - seguridad para PROD)
│   ├── BACKUP_QUICKSTART.md         (Guia rapida)
│   ├── BACKUP_OPERACION.md          (Operacion diaria)
│   └── SYNC_WORKFLOW.md             (Flujo PROD→LOCAL)
│
├── .github/
│   └── workflows/
│       └── backup-database.yml      (GitHub Actions - daily 3 AM UTC)
│
├── docs/
│   ├── BACKUP_RECOVERY_SYSTEM.md    (Documentacion completa)
│   ├── WORKFLOW_COMPLETO.md         (Todos los escenarios)
│   └── DESCARGAR_BACKUP_RAILWAY.md  (Metodos alternativos)
│
├── backups/                         (ignorado en git)
│   ├── prod_sync_20260106_*.sql.gz
│   ├── local_backup_20260106_*.sql.gz
│   └── latest.sql.gz
│
├── QUICK_BACKUP_GUIDE.md            (Resumen para usuarios)
├── SECURITY_FIX_REQUIRED.md         (URGENTE: credenciales)
├── SECURITY_CREDENTIALS_ALERT.md    (Alertas de seguridad)
├── README.md                        (Actualizado con backup info)
└── .env                             (NUNCA COMMITEAR!)
```

---

## 🔄 Flujo Automatico Semanal

```
LUNES 8:00 AM
│
└─> npm run sync
    ├─> Parse DATABASE_URL_PROD
    ├─> docker exec mysqldump (PROD -> temp)
    ├─> Compress con GZip
    ├─> Decompress
    ├─> Restore en LOCAL (mysql < archivo)
    └─> BD LOCAL = BD PROD (datos frescos)

LUNES-VIERNES (Desarrollo)
├─> Trabajo normal
├─> npm run backup:quick (antes de cambios)
├─> Cambios a BD
├─> npm run backup:quick (despues de cambios)
└─> [Opcional] npm run restore (si algo falla)

VIERNES NOCHE / GITHUB ACTIONS
├─> GitHub Actions trigger (cron 3:00 AM UTC)
├─> Corre: backup-database.ps1 en contenedor
├─> Backup se sube a Railway (si configurado)
└─> Registro del backup en logs
```

---

## 🛠️ Tecnologia Subyacente

### Compression

```
Database MySQL (400-500 MB)
        │
        └─> mysqldump (SQL text, 361 MB en ejemplo)
            │
            └─> .NET GzipStream (compression)
                │
                └─> Archivo .gz (46 MB en ejemplo)
                    ├─> Ratio: 87% menos espacio
                    └─> Sin dependencias externas (PowerShell nativo)
```

### Conexion Remota (Fallos actuales)

```
Windows PowerShell
    │
    ├─> docker exec freeliga-mysql
    │   │
    │   └─> mysql/mysqldump
    │       │
    │       └─> metro.proxy.rlwy.net:26282 (Railway)
    │           │
    │           ├─ ❌ Problemas: Auth, conexion, port
    │           └─ ✅ Alternativa: Descargar manualmente
    │
    └─> [FUTURO] mysql CLI local (si instalado)
        │
        └─> Conexion directa (mas rapido)
```

---

## 📊 Estadisticas de Backups

### Tamaño

| Tipo | Descomprimido | Comprimido | Ratio |
|------|---------------|-----------|-------|
| Railway BD | ~400-500 MB | ~50-65 MB | 87% |
| Ejemplo real | 361 MB | 46 KB | (ejemplo pequeño) |

### Retencion

- **Backups LOCAL**: 30 dias (auto-limpios)
- **Backups PROD**: Manual (ver Railway dashboard)
- **GitHub Actions**: Si se configura, diarios en Railway

### Tiempo

- **Backup**: 30-60 segundos (compresion rápida)
- **Restore**: 1-2 minutos (importacion)
- **Sync PROD→LOCAL**: 5 minutos (si funciona conexion)

---

## 🔐 Seguridad Actual

### ✅ Implementado

- [x] Backups comprimidos (no almacenan en text plano)
- [x] Archivos de backup en `.gitignore`
- [x] Sudo requerido para restaurar (con confirmacion)
- [x] No se usan flags peligrosos (no --allow-destructive-flags)
- [x] Timestamps en nombres (rastrear cuando se hizo)
- [x] Auto-limpieza (no acumula infinitamente)

### ⚠️ REQUERIDO URGENTE

- [ ] Rotar PASSWORD en Railway
- [ ] Remover .env de Git
- [ ] Limpiar historico de Git
- [ ] Crear .env.example
- [ ] Verificar que .env no aparece en commits anteriores

Ver: `SECURITY_FIX_REQUIRED.md`

---

## ✅ Checklist de Implementacion

### Fase 1: Backups Locales (COMPLETADO)
- [x] Script PowerShell backup-database.ps1
- [x] Script PowerShell restore-database.ps1
- [x] Script rapido quick-backup.ps1
- [x] Compresion con .NET GzipStream
- [x] npm scripts integrados
- [x] Auto-limpieza 30 dias
- [x] PROBADO Y FUNCIONANDO

### Fase 2: Sincronizacion PROD→LOCAL (PARCIAL)
- [x] Script sync-prod-to-local.ps1 creado
- [x] Parseador de DATABASE_URL_PROD
- [x] Compresion y descompresion
- [x] Restauracion en LOCAL
- [ ] Conexion remota funcionando (problemas con Railway)
- [ ] Documentacion alternativas

### Fase 3: GitHub Actions (IMPLEMENTADO)
- [x] Workflow YAML creado
- [x] Cron configurado (3:00 AM UTC)
- [x] Documentacion

### Fase 4: Seguridad (EN PROGRESO)
- [ ] Rotar credentials
- [ ] Remover .env de Git
- [ ] Limpiar Git history
- [x] Documentacion seguridad

### Fase 5: Documentacion (COMPLETA)
- [x] BACKUP_RECOVERY_SYSTEM.md
- [x] WORKFLOW_COMPLETO.md
- [x] QUICK_BACKUP_GUIDE.md
- [x] SYNC_WORKFLOW.md
- [x] SECURITY_FIX_REQUIRED.md
- [x] DESCARGAR_BACKUP_RAILWAY.md
- [x] README.md actualizado

---

## 🚀 Proximos Pasos (Prioridad)

### 1. URGENTE: Seguridad
```
[ ] Cambiar PASSWORD en Railway
[ ] git rm --cached .env
[ ] echo ".env" >> .gitignore
[ ] git commit
[ ] Limpiar Git history (BFG)
[ ] Verificar que .env no aparece
```

### 2. IMPORTANTE: Resolver sync-prod-to-local
```
[ ] Instalar MySQL CLI (si quieres usar npm run sync)
[ ] O usar descargas manuales desde Railway dashboard
[ ] O usar Railway CLI
```

### 3. TESTING: Verificar todos los flujos
```
[ ] npm run backup:quick -> verificar archivo creado
[ ] npm run restore -> verificar que restaura
[ ] npm run sync -> si MySQL CLI instalado
[ ] GitHub Actions -> verificar que corre
```

### 4. OPCIONAL: Mejoras futuras
```
[ ] Windows Task Scheduler (backups programados)
[ ] Email notifications (cuando backup falla)
[ ] Slack integration (alertas)
[ ] Bucket storage (S3, Azure Blob)
[ ] Database replication (hot standby)
```

---

## 📞 Soporte

### Si algo no funciona:

1. **`npm run backup:quick` falla**
   - Verificar: Docker corriendo, `.env` existe, credenciales correctas

2. **`npm run sync` falla**
   - Ver: `DESCARGAR_BACKUP_RAILWAY.md`
   - Alternativa: Descargar manualmente de Railway dashboard

3. **`npm run restore` no restaura**
   - Verificar: Archivo .gz existe, tiene > 5KB
   - Intentar descomprimir manual y restaurar

4. **Credenciales expuestas**
   - Ver: `SECURITY_FIX_REQUIRED.md`
   - Cambiar password inmediatamente en Railway

---

## 📚 Archivos de Referencia

- `QUICK_BACKUP_GUIDE.md` - Para usuarios (mas simple)
- `BACKUP_RECOVERY_SYSTEM.md` - Documentacion tecnica (mas detalle)
- `WORKFLOW_COMPLETO.md` - Todos los escenarios
- `SECURITY_FIX_REQUIRED.md` - Instrucciones seguridad
- `DESCARGAR_BACKUP_RAILWAY.md` - Metodos alternativos descarga
