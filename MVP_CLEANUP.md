# 🧹 MVP Cleanup Checklist

## Archivos a Eliminar (Deprecated Dev/Test Scripts)

### Root
- [ ] `audit-fixes.sh` - Script de referencia, no más necesario
- [ ] `AUDIT_RESULTS.md` - Mover a docs/ o eliminar (duplicado)
- [ ] `AUDIT_SUMMARY.md` - Mover a docs/ o eliminar (está en AUDIT_CHECKLIST.md)

### apps/api/src (Test/Debug Scripts)
- [ ] `find_match.ts` - Debug script para buscar matches
- [ ] `test_edit_match.ts` - Test script para editar matches
- [ ] `fix_data.ts` - Fix script para corregir datos
- [ ] `reset_admin.ts` - Reset script para admin
- [ ] `reset_passwords.ts` - Reset script para passwords

### Archivos en scripts/ a Revisar
- [ ] Todos los scripts en `packages/database/src/scripts/` excepto seed necesarios

---

## Archivos a Mover a /docs

- [ ] `TRADUCCION.md` → `docs/TRADUCCION.md`
- [ ] Verificar qué está en root vs docs

---

## Archivos a Mantener en Root

- [x] `README.md` - Principal, con instrucciones
- [x] `AUDIT_CHECKLIST.md` - Checklist de verificación
- [x] `AUDIT_REPORT.md` - Reporte exhaustivo (grande pero valioso)
- [x] `docker-compose.yml` - Para dev local
- [x] `Dockerfile*` - Para build
- [x] `.env*` - Configuration
- [x] `.gitignore` - Git
- [x] `package.json` - Monorepo
- [x] `seed-real-data.sql` - Datos iniciales (útil)

---

## Archivos a Revisar en package.json

### Root package.json
- [ ] Verificar que no hay scripts innecesarios
- [ ] Limpiar si hay referencias a scripts eliminados

### apps/api/package.json
- [ ] Limpiar scripts si refieren a archivos eliminados (find_match, test_edit_match, etc)

### apps/web/package.json
- [ ] OK, scripts esenciales: dev, build, preview

---

## Documentación en /docs (Mantener Todas)

- [x] `QUICK_START.md` - Getting started
- [x] `RAILWAY_VERCEL_DEPLOY.md` - Production deployment
- [x] `DOCKER_SETUP.md` - Docker local setup
- [x] `MANUAL_USUARIO.md` - User guide
- [x] `REGLAS_CIERRE_TEMPORADA.md` - Business rules
- [x] `ASCENSOS_DESCENSOS_GUIA.md` - Promotion/Relegation rules
- [x] `CLEANUP_LOG.md` - Historical cleanup log (MANTENER para referencia)

---

## README.md - Updates

- [ ] Sección: "Documentación"
  - Link a docs/QUICK_START.md
  - Link a docs/RAILWAY_VERCEL_DEPLOY.md
  - Link a docs/MANUAL_USUARIO.md

- [ ] Sección: "Auditoría"
  - Link a AUDIT_CHECKLIST.md
  - Link a AUDIT_REPORT.md para detalles

---

## Git Cleanup Commit

```bash
git rm apps/api/src/find_match.ts
git rm apps/api/src/test_edit_match.ts
git rm apps/api/src/fix_data.ts
git rm apps/api/src/reset_admin.ts
git rm apps/api/src/reset_passwords.ts
git rm audit-fixes.sh
git mv TRADUCCION.md docs/TRADUCCION.md
git commit -m "chore: remove debug scripts, reorganize docs for MVP v1.0"
git push origin master
```

---

## Status: Pendiente Ejecución

Espera confirmación para proceder.
