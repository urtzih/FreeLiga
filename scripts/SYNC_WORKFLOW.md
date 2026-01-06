# FLUJO OPERACIONAL RECOMENDADO
# Importar PROD → Trabajar en LOCAL → Solo restaurar PROD en emergencias

## OPCION 1: FLUJO DIARIO CON DATOS DE PROD

### Al empezar la jornada:

```powershell
# Descargar ultima version de PROD e importar en LOCAL
.\scripts\sync-prod-to-local.ps1

# Esto:
# 1. Descarga BD de PROD (metro.proxy.rlwy.net)
# 2. Restaura en tu contenedor LOCAL
# 3. Guarda copia comprimida en backups/
```

Ahora trabajas con **datos reales de PROD** en tu maquina.

### Durante el dia:

```powershell
# Si necesitas volver atras en LOCAL
.\scripts\restore-database.ps1
# Elige un backup anterior
```

### Casos extremos (restaurar en PROD):

⚠️ **USAR SOLO EN EMERGENCIAS**

```powershell
# Solo si algo exploto en PROD y necesitas recuperar
# USAR RAILWAY DASHBOARD o contactar administrador
```

---

## OPCION 2: FLUJO CONSERVADOR (Recomendado)

### Semana 1:
```powershell
# Lunes por la manana
.\scripts\sync-prod-to-local.ps1

# Trabajas toda la semana con estos datos
# Haces cambios locales sin miedo
```

### Semana 2:
```powershell
# Lunes siguiente
.\scripts\sync-prod-to-local.ps1
# Sincronizas nuevamente con PROD
```

Esto te da:
✅ Datos reales para desarrollar
✅ Seguridad (todo local)
✅ Historial de backups

---

## ARCHIVOS GENERADOS

```
backups/
├── prod_to_local_20260106_220000.sql.gz   ← PROD importado a LOCAL
├── local_backup_20260106_220100.sql.gz    ← Cambios locales
├── latest.sql.gz                           ← Ultimo LOCAL
└── latest_prod.sql.gz                      ← Referencia PROD (no restaurar)
```

---

## FLUJO VISUAL

```
LUNES (Sincronizar)
  ↓
.\scripts\sync-prod-to-local.ps1
  ↓
BD LOCAL = BD PROD
  ↓
Trabajas toda la semana tranquilo
  ├── npm run backup:quick (antes de cambios importantes)
  ├── Desarrollas features
  └── Testas en local
  ↓
VIERNES
  ↓
Descargas nuevamente si necesitas datos frescos
```

---

## QUE NUNCA HACER

- ❌ No restaurar en PROD sin confirmacion explícita
- ❌ No subir .env con credenciales a GitHub
- ❌ No trabajar directamente en PROD
- ❌ No eliminar backups sin motivo

---

## COMANDOS RAPIDOS

| Accion | Comando |
|--------|---------|
| Sincronizar PROD→LOCAL | `.\scripts\sync-prod-to-local.ps1` |
| Backup LOCAL | `npm run backup` |
| Backup rapido | `npm run backup:quick` |
| Restaurar LOCAL | `.\scripts\restore-database.ps1` |
| Ver backups | `ls backups/` |
