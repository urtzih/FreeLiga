# Limpieza del Proyecto (12 Dic 2025)

## Archivos Eliminados (Deprecated)

Eliminados porque ya no son necesarios con la dockerización completa:

### Scripts Legacy (no Docker)
- `setup.ps1` - Setup manual local sin Docker
- `build-production.ps1` - Build manual sin Docker/Railway
- `test-data.ps1` - Testing manual local
- `nginx.conf.example` - No usamos nginx (Railway + Vercel)

### Scripts TypeScript/Testing Locales
- `check_player.ts` - Script de verificación local
- `test_me_endpoint.ts` - Testing manual
- `seed-test-users.ts` - Seeds de test obsoletos
- `generate_sql.js` - Generador de SQL (uso único, no necesario)

### SQL Legacy
- `fix_current_group.sql` - Usa columna `currentGroupId` inexistente
- `create_prod_db.sql` - Setup manual BD sin Docker
- `delete_closure.sql` - Limpieza manual obsoleta
- `seed-test-users.sql` - Seeds de test

### Archivos Temporales
- `temp_groupview.txt` - Archivo temporal

### Directorios
- `node_modules/` - Deps ahora están en contenedores Docker

## Archivos Mantendos

### Docker + Deployment
- `Dockerfile` - Build backend (multi-stage)
- `Dockerfile.dev` - Desarrollo backend con hot reload
- `.dockerignore` - Exclusiones build
- `docker-compose.yml` - Orquestación local (MySQL + API + Web)
- `railway.json` - Config Railway backend
- `DOCKER_SETUP.md` - Docs Docker completa
- `QUICK_START.md` - Guía rápida
- `LOCAL_DEV_SETUP.md` - Setup sin Docker (alternativo)

### Configuración
- `.env.local.example` - Template variables locales
- `.env.production.example` - Template producción
- `.gitignore` - Ya bien configurado (ignora .env, node_modules, build, etc)
- `package.json` - Root monorepo (necesario)
- `package-lock.json` - Lock file (será regenerado en Docker)

### Documentación
- `README.md` - Descripción proyecto
- `MANUAL_USUARIO.md` - Manual usuario final
- `TRADUCCION.md` - Traducción textos
- `REGLAS_CIERRE_TEMPORADA.md` - Reglas negocio
- `ASCENSOS_DESCENSOS_GUIA.md` - Guía promotions
- `PRODUCTION_CONFIG.md` - Config producción

### Datos
- `seed-real-data.sql` - Seed actual con datos reales (75 usuarios, 7 grupos)

## Estructura Limpia Recomendada

```
FreeLiga/
├── .git/                          # Control versión
├── .gitignore                     # Excluir .env, node_modules, etc
├── .env.local.example             # Template local
├── .env.production.example        # Template producción
├── apps/
│   ├── api/                       # Backend Fastify
│   └── web/                       # Frontend React/Vite
├── packages/
│   └── database/                  # Prisma schema + migrations
├── docker-compose.yml             # Orquestación local (dev)
├── Dockerfile                     # Build producción
├── Dockerfile.dev                 # Build desarrollo
├── .dockerignore                  # Exclusiones Docker
├── railway.json                   # Config Railway
├── package.json                   # Root workspace
├── README.md                      # Proyecto
├── DOCKER_SETUP.md                # Docs Docker
├── QUICK_START.md                 # Guía rápida
├── LOCAL_DEV_SETUP.md             # Setup sin Docker
├── PRODUCTION_CONFIG.md           # Config prod
├── MANUAL_USUARIO.md              # Docs usuario
├── REGLAS_CIERRE_TEMPORADA.md    # Reglas negocio
├── seed-real-data.sql            # Seed datos
└── CLEANUP_LOG.md                 # Este archivo
```

## Próximos Pasos

1. ✅ Eliminar archivos deprecated
2. ✅ Eliminar `node_modules` local (vive en Docker)
3. ⏭️ **Commit a Git** con cleanup
4. ⏭️ **Push a GitHub** (si no está ya)
5. ⏭️ **Deploy a Railway** (backend)
6. ⏭️ **Deploy a Vercel** (frontend)

## Variables de Entorno

- `.env` (raíz) - Ignorado en `.gitignore`, solo local
- `.env.local` - Ignorado, generado desde `.env.local.example`
- `.env.production.example` - Template para Railway/Vercel
- Docker: Variables viven en `docker-compose.yml` (dev) y Railway/Vercel dashboard (prod)

## Performance

- **Sin node_modules local**: -500MB+ espacio disco
- **Build Docker más limpio**: Sin artefactos locales
- **Hot reload en dev**: Sigue funcionando via volúmenes Docker
