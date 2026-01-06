# FLUJO SIMPLIFICADO Y SEGURO

## Resumen Ejecutivo:

```
LUNES: npm run sync          (Descarga PROD, restaura LOCAL)
MARTES-VIERNES: npm run backup:quick  (Copia de seguridad antes de cambios)
SIEMPRE: npm run restore     (Si algo falla, vuelve atrás)
```

---

## Comando Principal

```powershell
npm run sync
```

**Que hace:**
1. Descarga BD de PROD desde Railway
2. Restaura en tu contenedor LOCAL
3. Guarda copia comprimida para emergencias
4. Ahora desarrollas con datos REALES de PROD

**Cuando usarlo:**
- Lunes por la manana
- Cuando necesitas datos actualizados de PROD
- Una vez a la semana es suficiente

---

## Comandos del Dia a Dia

```powershell
# Antes de empezar a trabajar
npm run backup:quick

# Durante el dia (si algo falla)
npm run restore

# Si necesitas ver backups
ls backups/
```

---

## CREDENCIALES - IMPORTANTE

Tu `.env` contiene credenciales expuestas:

```
DATABASE_URL_PROD=mysql://root:HkwOvwLFXIpySTWoZEVaXPZhQZgPSDbo@metro.proxy.rlwy.net:26282/railway
```

**Acciones de seguridad:**

1. Cambiar contraseña en Railway dashboard AHORA
2. Remover .env de Git:
   ```powershell
   git rm --cached .env
   echo ".env" >> .gitignore
   git commit -m "Remove .env"
   ```

Ver archivo: `SECURITY_CREDENTIALS_ALERT.md`

---

## Scripts Disponibles

| Script | Comando npm | Que hace |
|--------|------------|----------|
| Sincronizar PROD→LOCAL | `npm run sync` | Descarga y restaura |
| Backup rapido LOCAL | `npm run backup:quick` | Copia en segundos |
| Backup completo LOCAL | `npm run backup` | Copia con detalles |
| Restaurar LOCAL | `npm run restore` | Vuelve a backup anterior |

---

## Archivos Generados

```
backups/
├── prod_to_local_*.sql.gz    (PROD descargado)
├── local_backup_*.sql.gz     (Cambios locales)
└── latest.sql.gz             (Ultimo LOCAL para restaurar)
```

---

## Flujo Visual Semanal

```
LUNES (Mañana)
├─ npm run sync
│  └─ BD LOCAL = BD PROD (datos frescos)
│
MARTES-VIERNES (Trabajo diario)
├─ npm run backup:quick (antes de cambios)
├─ Trabajas, desarrollas
├─ npm run backup:quick (cambios completados)
├─ [Si falla] npm run restore
│
VIERNES (Fin de semana)
└─ Puedes sincronizar si necesitas datos nuevos
```

---

## 🚨 Casos de Emergencia

### "Rompí la BD LOCAL"
```powershell
npm run restore
# Selecciona el backup anterior
```

### "PROD explotó"
```powershell
# 1. Hacer backup de PROD (documentación)
.\scripts\backup-prod.ps1

# 2. Contactar administrador
# "Necesito restaurar PROD desde backup X"
```

### "Necesito datos más frescos de PROD"
```powershell
npm run sync
# (Se descarga la versión actual de PROD)
```

---

## Documentación completa

- `docs/BACKUP_RECOVERY_SYSTEM.md` - Sistema de backups detallado
- `docs/WORKFLOW_COMPLETO.md` - Flujo completo y escenarios
- `SECURITY_CREDENTIALS_ALERT.md` - Alertas de seguridad
- `scripts/SYNC_WORKFLOW.md` - Sincronización detallada
