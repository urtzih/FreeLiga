# AGENTS.md

## Objetivo del proyecto

FreeLiga es una aplicacion full-stack para gestionar una liga de squash con grupos, ranking avanzado, registro de partidos y administracion de temporadas.

## Stack y tecnologias

- Backend: Node.js 20, Fastify, Prisma, MySQL, Zod, JWT, Pino.
- Frontend: React 18, Vite, TypeScript, TailwindCSS, React Query, React Router.
- Infra: Docker/Docker Compose, Railway (API + DB), Vercel (web), scripts PowerShell/Bash para backups.

## Entornos disponibles

- No hay entorno de staging dedicado en este proyecto.
- Validacion previa a produccion: siempre en local (build + pruebas manuales end-to-end).
- Si un cambio toca BBDD, hacer validacion local completa y desplegar en produccion con backup previo y plan de rollback.
- Para push/notificaciones, usar despliegue en 2 fases: primero con scheduler desactivado, luego activar tras smoke test en produccion.

## Lecciones de deploy (Railway/Vercel) - Abril 2026

- Railway API tiene `watchPatterns` en `"/apps/api/**"`: si un commit solo toca Prisma/docs/scripts fuera de `apps/api`, puede no desplegarse automaticamente.
- Si el cambio requiere deploy y no toca `apps/api`, forzar deploy manual en Railway o incluir un cambio minimo no funcional dentro de `apps/api`.
- Si no aparece boton `Deploy latest commit`, usar `Deployments` -> menu `...` del ultimo deploy -> `Redeploy` (o CLI: `railway deployment up` / `railway redeploy`).
- Verificar siempre proyecto y servicio antes de desplegar (`superb-balance` + `@freesquash/api`) para no redeployar otro servicio por error.
- Todas las migraciones Prisma deben quedar versionadas en `packages/database/prisma/migrations/**/migration.sql` (no ignorarlas por `*.sql` global).
- Antes de desplegar cambios de BBDD: comprobar que `prisma migrate deploy` puede ejecutarse en produccion y que no hay entradas fallidas en `_prisma_migrations`.
- Si aparece `P3009`/`P3018`, resolver estado con `prisma migrate resolve --rolled-back <migration>` y volver a desplegar con SQL compatible con la version real de MySQL.
- Para invalidar cache publico tras deploy: usar `POST /api/public/cache/invalidate` con header `x-cache-token`; definir `CACHE_INVALIDATE_TOKEN` en Railway (evitar fallback `dev-token` en produccion).

## Variables de entorno de produccion (Railway API)

- Minimo esperado en `@freesquash/api`:
  - `NODE_ENV=production`
  - `HOST=0.0.0.0`
  - `PORT` (Railway puede inyectarlo; no hardcodear si no hace falta)
  - `DATABASE_URL` (MySQL de Railway)
  - `JWT_SECRET`
  - `ALLOWED_ORIGINS` y `FRONTEND_URL` apuntando a Vercel (`https://free-liga-web.vercel.app`)
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
  - `CACHE_INVALIDATE_TOKEN` (obligatorio en prod para invalidador de cache)
- Evitar variables de frontend (`VITE_*`) en el servicio API de Railway salvo necesidad operativa concreta.
- No copiar secretos reales en docs, issues o commits; usar placeholders y gestionar valores reales solo en Railway.

## Estructura de carpetas

- `apps/api`: API Fastify, rutas y servicios.
- `apps/web`: Frontend React.
- `packages/database`: Prisma schema y cliente.
- `scripts`: backups, restore y sync de BD.
- `docs`: documentacion tecnica y operativa.
- `docs/archive`: documentacion historica/legacy (no editar salvo necesidad).
- `monitoring`: Loki/Grafana/Prometheus (opcional).

## Convenciones de codigo

- TypeScript `strict` en backend y frontend.
- Validaciones de entrada con Zod en rutas.
- Logging con `logger` (Pino). Evitar `console.*` en rutas productivas.
- Mantener compatibilidad de contratos de API y esquemas de BD.
- Todo copy nuevo o modificado en frontend debe quedar en multidioma (`es` + `eu`) usando el sistema de i18n (sin literales sueltos en componentes).
- Excepcion de idioma: panel/admin solo en español.
- La palabra reservada `average` no se traduce (ni en español ni en euskera).

## Convenciones de nombres

- Backend: `*.routes.ts`, `*.service.ts`, `*.utils.ts`.
- Frontend: componentes PascalCase (`Component.tsx`), hooks `useX`.
- Prisma: modelos en singular (User, Match), tablas mapeadas con `@@map`.

## Flujo de trabajo recomendado

- Instalar dependencias: `npm install --workspaces`.
- Desarrollo local: `npm run dev` (API + Web).
- API standalone: `npm run dev:api`.
- Web standalone: `npm run dev:web`.
- Prisma: `npm run db:generate`, `npm run db:push`, `npm run db:studio`.

## Comandos operativos frecuentes

- Instalar dependencias: `npm install --workspaces`.
- Arrancar proyecto en local (API + Web): `npm run dev`.
- Arrancar por separado:
  - API: `npm run dev:api`.
  - Web: `npm run dev:web`.
- Validacion antes de dar por bueno:
  - Build: `npm run build --workspaces`.
  - Lint: `npm run lint`.
- Traer copia de produccion a local (sync completo): `npm run sync`.
- Backup local completo: `npm run backup`.
- Backup rapido antes de cambios sensibles: `npm run backup:quick`.
- Restaurar backup en local: `npm run restore`.

Notas:
- `npm run sync` ejecuta `scripts/sync-prod-to-local.ps1` (descarga de Railway + restore en MySQL local + backup en `backups/`).
- Para `sync` se requiere `.env` con `DATABASE_URL_PROD` y `DATABASE_URL` validas, y Docker/MySQL local operativo.

## Ejecutar, testear, lint y build

- Build: `npm run build --workspaces`.
- Lint: `npm run lint`.
- Formato: `npm run format` y `npm run format:check`.
- Testing: no hay suite automatica; usar verificacion manual.

## Que revisar antes de tocar codigo

- Esquema de BD en `packages/database/prisma/schema.prisma`.
- Rutas y permisos en `apps/api/src/routes`.
- Logica de ranking en `apps/api/src/services/ranking.service.ts`.
- Integracion Google Calendar en `apps/api/src/services/googleCalendar.service.ts`.
- Cache publico en `apps/api/src/services/cache.service.ts` y rutas publicas.

## Zonas sensibles o criticas

- Registro de partidos y ranking (impacta clasificacion y estadisticas).
- Gestion de temporadas y cierres (persisten historico).
- Autenticacion y permisos (JWT y roles).
- Sincronizacion con Google Calendar (tokens y eventos).

## Reglas para cambios pequenos y seguros

- Preferir cambios locales y acotados.
- No romper contratos de API sin actualizar frontend y docs.
- Mantener mensajes de error y validaciones consistentes.
- Actualizar documentacion si cambia el flujo de uso.

## Reglas para refactors

- Evitar refactors masivos sin necesidad.
- Cambios estructurales deben venir con un plan y pasos de verificacion.
- No tocar el esquema de BD sin migracion explicita y validacion.

## Como documentar decisiones

- Documentar cambios relevantes en `docs/ARCHITECTURE.md` o `docs/IMPLEMENTATION_SUMMARY.md`.
- Anadir notas en el README si afecta a la puesta en marcha.

## Criterios para elegir soluciones simples frente a complejas

- Priorizar la opcion mas simple que mantenga compatibilidad y estabilidad.
- Evitar introducir nuevas dependencias o infra si no aportan valor claro.

## Buenas practicas especificas del repo

- Usar `docs/DOCUMENTATION_INDEX.md` como indice principal.
- Usar `.env.example` como plantilla y no commitear `.env`.
- Mantener los backups fuera de git (`backups/`).
- Revisar cache publico despues de cambios en partidos o grupos.
- Entorno de trabajo preferido: OpenCode (con modelos ChatGPT Pro y GitHub Copilot).
- Produccion: la autenticacion/login de Grafana no esta activa (Railway no lo permitio). No asumir dashboards protegidos hasta migrar infraestructura.
- Produccion actual: sin Docker; solo MySQL gestionado.
