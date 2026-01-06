# 🎯 FLUJO COMPLETO DE TRABAJO - FreeLiga

**Objetivo:** Trabajar con datos reales de PROD en LOCAL, con backups automáticos y recuperación segura.

---

## 📋 FLUJO DIARIO RECOMENDADO

### ⏰ LUNES (Sincronización inicial):

```powershell
# 1. Descargar BD de PROD e importar en LOCAL
npm run sync

# Que hace:
# ✓ Descarga BD completa de PROD (metro.proxy.rlwy.net)
# ✓ Restaura en tu contenedor LOCAL
# ✓ Guarda copia comprimida en backups/prod_to_local_*.sql.gz
# ✓ Ahora tu BD LOCAL = BD PROD

# Resultado: Puedes desarrollar con DATOS REALES
```

### 📅 MARTES - VIERNES (Trabajo normal):

```powershell
# Antes de empezar
npm run backup:quick
# ✓ Copia de seguridad de tu BD LOCAL actual

# Trabajas, desarrollas, testas
# - npm run dev
# - Cambios en BD
# - Tests locales

# Antes de algo importante
npm run backup:quick
# ✓ Nueva copia de seguridad

# Si algo falla
npm run restore
# ✓ Recupera a estado anterior
```

### ⚠️ SI ALGO EXPLOTA EN PRODUCCION:

```powershell
# PASO 1: Hacer backup de PROD (por si acaso)
.\scripts\backup-prod.ps1
# Escribe: PROD-BACKUP

# PASO 2: Evaluar situacion
# - ¿Que data se perdio?
# - ¿Necesitas recuperar?

# PASO 3: SOLO en casos extremos
# Contactar administrador para restaurar en PROD
# NO hagas restore en PROD tu mismo
```

---

## 🔄 ARCHIVOS DE BACKUP GENERADOS

```
backups/
│
├── prod_to_local_20260106_150000.sql.gz  ← Ultima PROD descargada
│                                           (datos para trabajar)
│
├── local_backup_20260106_150100.sql.gz   ← Cambios que hiciste
├── local_backup_20260106_160000.sql.gz   ← Cambios posteriores
├── local_backup_20260106_170000.sql.gz   ← Mas cambios
│
├── latest.sql.gz                          ← Ultima copia LOCAL (siempre actualizado)
│                                           (restaura aqui cuando algo falla)
│
└── latest_prod.sql.gz                     ← Referencia PROD
                                            (NUNCA restaurar en PROD)
```

---

## 📊 FLUJO VISUAL

```
LUNES (Sincronizar desde PROD)
└─ npm run sync
   └─ BD LOCAL = BD PROD (datos frescos)

MARTES-VIERNES (Trabajar con seguridad)
├─ npm run backup:quick (antes de cambios)
├─ Desarrollar features
├─ npm run backup:quick (cambios completados)
├─ [Si falla] npm run restore
└─ Trabajar tranquilo

VIERNES (Fin de semana)
└─ [Opcional] npm run sync (actualizar datos si necesitas)

LUNES SIGUIENTE
└─ npm run sync (sincronizar semana siguiente)
```

---

## 🛠️ COMANDOS DISPONIBLES

| Comando | Que hace | Cuando usar |
|---------|----------|------------|
| `npm run sync` | Descarga PROD → restaura LOCAL | Lunes por la manana |
| `npm run backup:quick` | Backup rapido de LOCAL | Antes de cambios importantes |
| `npm run backup` | Backup completo de LOCAL | Manual, cuando quieras |
| `npm run restore` | Restaura un backup anterior | Cuando algo falla en LOCAL |
| `.\scripts\backup-prod.ps1` | Backup de PROD (lectura) | Emergencias, documentación |

---

## ✅ SEGURIDAD

### Que SI puedes hacer:
- ✅ Descargar de PROD (lectura)
- ✅ Restaurar en LOCAL (tu máquina)
- ✅ Hacer cambios en LOCAL
- ✅ Hacer backups cuantas veces quieras

### Que NO debes hacer:
- ❌ Restaurar en PROD sin permiso
- ❌ Compartir credenciales de .env
- ❌ Subir .env a GitHub
- ❌ Trabajar directamente en PROD

---

## 🚨 CASOS ESPECIALES

### Scenario 1: "Necesito datos más recientes de PROD"

```powershell
# Viernes a las 18:00
npm run sync

# Se descarga la version mas reciente de PROD
# Tu BD LOCAL se actualiza
```

### Scenario 2: "Rompí algo en LOCAL y quiero volver atrás"

```powershell
npm run restore
# Elige el backup de antes del cambio
```

### Scenario 3: "PROD explotó, necesito recuperar"

```powershell
# 1. Hacer backup de PROD (para análisis)
.\scripts\backup-prod.ps1
# PROD-BACKUP

# 2. Contactar administrador
# "Necesito recuperar PROD desde backup X"

# 3. El admin restaura usando Railway dashboard
```

### Scenario 4: "Quiero trabajar con datos limios"

```powershell
# Opción A: Resetear LOCAL a PROD
npm run sync

# Opción B: Restaurar a backup específico
npm run restore
# Elige "backup_prod_*.sql.gz"
```

---

## 📈 VENTAJAS DE ESTE FLUJO

| Beneficio | Como lo logra |
|-----------|---------------|
| **Datos reales** | Sincronizas desde PROD cada lunes |
| **Seguridad LOCAL** | Puedes resetear cuando quieras |
| **Sin miedo a rotura** | Backups automáticos cada cambio |
| **Recuperación rápida** | Restore en segundos |
| **PROD protegida** | No tocas PROD directamente |
| **Auditoria** | Tienes historial de todos los cambios |

---

## 📞 AYUDA

| Problema | Solucion |
|----------|----------|
| "No puedo descargar de PROD" | Verifica DATABASE_URL_PROD en .env |
| "El restore falló" | Prueba con otro backup: `npm run restore` |
| "Necesito volver a una fecha específica" | `ls backups/` y luego `npm run restore -BackupFile archivo.sql.gz` |
| "He perdido un backup importante" | Contactar si está en backups/ (30 días retención) |

