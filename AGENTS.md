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
