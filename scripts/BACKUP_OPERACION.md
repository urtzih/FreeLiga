# OPERACION DE BACKUPS - GUIA RAPIDA

## Para LOCAL (Development):

### Antes de empezar a trabajar:
```powershell
npm run backup:quick
```

Esto:
1. Hace backup automatico sin preguntar
2. Lo guarda en backups/latest.sql.gz
3. Listo para trabajar tranquilo

### Ver tus backups:
```powershell
ls backups/*.sql.gz | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

### Restaurar si algo falla:
```powershell
.\scripts\restore-database.ps1
# Escoge el backup que necesitas
```

---

## Para PRODUCCION:

**⚠️ IMPORTANTE:** Los datos de produccion son criticos.

### Hacer backup de PROD:
```powershell
.\scripts\backup-prod.ps1
# Escribe: PROD-BACKUP
```

Esto:
1. Solo LEE datos de Railway
2. Crea archivo comprimido (backups/backup_prod_*.sql.gz)
3. NO modifica nada en PROD
4. Guarda en backups/latest_prod.sql.gz

### Archivos de backup:

```
backups/
├── local_backup_20260106_221413.sql.gz  (LOCAL dev)
├── backup_prod_20260106_*.sql.gz        (PRODUCCION)
├── latest.sql.gz                         (ultimo LOCAL)
└── latest_prod.sql.gz                    (ultimo PROD)
```

---

## FLUJO DIARIO RECOMENDADO:

```
1. Llego a trabajar
   npm run backup:quick

2. Trabajo en desarrollo (local)

3. Antes de algo importante
   npm run backup:quick

4. Si necesito verificar prod
   .\scripts\backup-prod.ps1
   # Escribe: PROD-BACKUP

5. Si algo sale mal en local
   .\scripts\restore-database.ps1
   # Elige el backup
```

---

## Que NUNCA hace:

- ❌ No restaura automaticamente
- ❌ No borra datos
- ❌ No modifica PROD sin permiso explícito
- ❌ No sube datos a internet (todo local)

---

## Credenciales:

DATABASE_URL (local):
  - Host: mysql (contenedor Docker)
  - User: freeliga
  - Pass: freeliga123
  - DB: railway

DATABASE_URL_PROD (Railway):
  - Host: metro.proxy.rlwy.net
  - Port: 26282
  - User: root
  - Pass: [guardada en .env]
  - DB: railway
