# FreeSquash League - MVP

A full-stack web application for managing a squash league with ranked groups, advanced ranking algorithms, match recording, and global classification.

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **React Query** (@tanstack/react-query) for server state management
- **React Router** for navigation
- **TanStack Table** for advanced data tables
- **Axios** for API requests

### Backend

- **Node.js 20** with TypeScript
- **Fastify** web framework with compression (@fastify/compress) and ETag support
- **Prisma ORM** for database access
- **MySQL 8.0** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **Zod** for validation

### Infrastructure

- **Docker** with multi-stage builds (development/production)
- **docker-compose** for local orchestration
- **Railway** for backend production (Node 20 + Docker)
- **Vercel** for frontend production (static CDN)
- **MySQL on Docker** for local & production databases

## Features

### Implemented (MVP)

#### Authentication

- [x] Email/password registration
- [x] JWT-based authentication
- [x] Protected routes
- [x] Role-based access (Player/Admin)

#### Player Features

- [x] **Dashboard**: Personal stats, current ranking, recent matches, streak indicator
- [x] **Group View**: Rankings, progress indicators (days remaining, completion %), contact tools (call, WhatsApp, copy phone)
- [x] **Match Recording**: Score input with validation (0-3), injury/cancellation handling
- [x] **Match History**: Complete match record with results
- [x] **Global Classification**: Advanced filtering (season, group, date range), sortable table with TanStack Table

#### Ranking System

- [x] **4-Tier Tie-Breaking Algorithm**:
  1. Matches won (primary)
  2. Head-to-head (2 players tied)
  3. Mini-league for 3+ players (internal wins -> internal average)
  4. Global average -> Alphabetical fallback
- [x] Automatic ranking updates after match recording
- [x] Injury/cancelled matches excluded from rankings

#### Admin Features

- [x] Admin dashboard
- [x] Season management (CRUD)
- [x] Group management (CRUD)
- [x] Player management (view)
- [x] Bug report management with status tracking

#### Performance & UX

- [x] Animated progress bar loader (replaces static loading text)
- [x] HTTP compression (gzip/br) for 60-90% response reduction
- [x] ETag support for conditional GETs (304 Not Modified)
- [x] Cache-Control headers on safe GET endpoints (60s max-age, 120s stale-while-revalidate)
- [x] React Query with 60s staleTime to minimize unnecessary refetches

## Future Enhancements (Post-MVP)

- [ ] Promotion/Relegation system
- [ ] Player availability indicators
- [ ] Suggested matches algorithm
- [ ] Admin: Assign/remove players from groups UI
- [ ] Admin: Edit player details
- [ ] Email notifications
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)

## Setup Instructions

### Prerequisites (Local Development)

- **Docker** (v20+) and **docker-compose**
- **Git**
- Windows, macOS, or Linux

### Option 1: Quick Start with Docker (Recommended)

1. **Clone & Setup**

```bash
git clone <repo-url>
cd FreeLiga
cp .env.example .env
docker-compose up -d
```

2. **Wait for Services**

- MySQL: localhost (container `freeliga-mysql` on 3306)
- Backend API: http://localhost:3001 (with compression, ETag, cache headers)
- Frontend: http://localhost:4173 (with animated loaders)

3. **Test Login**

- Email: `admin@freesquash.com`
- Password: `123456`

**That's it!** All services (MySQL, API, Web) running with hot reload enabled.

### Option 2: Local Development without Docker

#### Prerequisites

- Node.js 20+ and npm
- MySQL 8.0 (install locally or use Docker MySQL container only)

#### Setup

1. **Install Dependencies**

```bash
npm install --workspaces
```

2. **Database Configuration**
   Copy `.env.example` to `.env` in the project root:

```env
DATABASE_URL="mysql://freeliga:freeliga123@localhost:3306/freeliga"
```

> Never commit `.env` or production credentials. Use `.env.example` as the template.

3. **Start MySQL (Docker only)**

```bash
docker run --name freesquash-db \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_USER=freeliga \
  -e MYSQL_PASSWORD=freeliga123 \
  -e MYSQL_DATABASE=freeliga \
  -p 3306:3306 \
  -d mysql:8.0
```

4. **Initialize Database**

```bash
cd packages/database
npx prisma db push
```

5. **Load Seed Data (Optional)**

```bash
mysql -h localhost -u freeliga -p freeliga123 freeliga < seed-real-data.sql
```

6. **Start Development Servers**

```bash
# Terminal 1: Backend
npm run dev:api  # Runs on http://localhost:3001

# Terminal 2: Frontend
npm run dev:web  # Runs on http://localhost:4173
```

## Project Structure

```
freesquash-league/
|-- apps/
|   |-- api/                    # Fastify backend
|   |   |-- src/
|   |   |   |-- routes/         # API routes
|   |   |   |-- services/       # Business logic
|   |   |   `-- server.ts       # App entry point
|   |   `-- package.json
|   `-- web/                    # React frontend
|       |-- src/
|       |   |-- components/     # Reusable components
|       |   |-- contexts/       # React contexts
|       |   |-- lib/            # Utilities
|       |   |-- pages/          # Route pages
|       |   `-- main.tsx        # App entry point
|       `-- package.json
|-- packages/
|   `-- database/               # Prisma schema & client
|       |-- prisma/
|       |   `-- schema.prisma
|       `-- src/
|           `-- index.ts
`-- package.json                # Root workspace config
```

## Key API Endpoints

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Players

- `GET /api/players` - List all players
- `GET /api/players/:id` - Get player details
- `GET /api/players/:id/stats` - Get player statistics

### Groups

- `GET /api/groups` - List groups
- `GET /api/groups/:id` - Get group with rankings
- `POST /api/groups` - Create group (admin)
- `POST /api/groups/:id/players` - Assign player (admin)

### Matches

- `GET /api/matches` - List matches (filterable)
- `POST /api/matches` - Record match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match (admin)

### Seasons

- `GET /api/seasons` - List seasons
- `POST /api/seasons` - Create season (admin)

### Classification

- `GET /api/classification` - Global rankings (with filters)

### Public (No Auth)

- `GET /api/public/stats` - Active season public stats (players, played matches with result, groups)
- `GET /api/public/stats/historical` - Historical public stats (total seasons, total players, total groups, total played matches with result)
- `GET /api/public/recent-matches` - Latest played matches
- `GET /api/public/groups-summary` - Active season groups summary
- `GET /api/public/group/:id/classification` - Public group classification

### Public Cache Invalidation

- `POST /api/public/cache/invalidate` - Invalidate public cache (`public:*`) via token (automation/webhook)
- `POST /api/public/cache/invalidate/admin` - Invalidate public cache from authenticated admin UI
- Required header for token endpoint: `x-cache-token: <CACHE_INVALIDATE_TOKEN>`
- If `CACHE_INVALIDATE_TOKEN` is not configured, development fallback is `dev-token`

## Testing the Ranking Algorithm

1. Create a season
2. Create a group and assign players
3. Record matches to test tie scenarios:
   - **2-player tie**: Record matches so two players have same wins
   - **3+ player tie**: Create circular wins (A beats B, B beats C, C beats A)
   - **Injury match**: Set `matchStatus = INJURY` - should not affect rankings
4. View group rankings to verify tie-breaking logic

## Deployment Guide

### Backend Deployment (Railway)

1. **Create Railway Account** at [railway.app](https://railway.app)

2. **Connect GitHub Repository**
   - Go to Dashboard -> New Project -> GitHub Repo
   - Select `FreeLiga` repository

3. **Configure Environment Variables**
   In Railway dashboard, add:

   ```
   DATABASE_URL=mysql://user:password@host:3306/database
   JWT_SECRET=your-secret-key-here-change-this
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
   NODE_ENV=production
   ```

4. **Deploy**
   - Railway auto-detects Dockerfile
   - Sets start command: `node apps/api/dist/server.js`
   - Deployment URL provided in dashboard

### Frontend Deployment (Vercel)

1. **Create Vercel Account** at [vercel.com](https://vercel.com)

2. **Import Project**
   - Go to Dashboard -> Add New -> Project -> Import Git Repo
   - Select `FreeLiga` repository

3. **Configure Build**
   - Framework: `Vite`
   - Root Directory: `apps/web`
   - Build Command: `npm run build --workspace=apps/web`
   - Output Directory: `dist`

4. **Set Environment Variables**

   ```
   VITE_API_URL=https://your-railway-backend-url.up.railway.app
   ```

   > Required for public home widgets (`/api/public/*`). If missing, Vercel can return `index.html` and the browser throws `Unexpected token '<'` when parsing JSON.

5. **Deploy**
   - Vercel auto-builds and deploys
   - Gets free HTTPS certificate
   - Automatic deployments on git push

### Database

**Option A: MySQL on Railway**

- Add MySQL service in Railway dashboard
- Connection string auto-generated in `DATABASE_URL`
- Run migrations: `npx prisma migrate deploy`

**Option B: Managed MySQL (Supabase, PlanetScale, AWS RDS)**

- Get connection string from provider
- Set `DATABASE_URL` in Railway environment
- Run migrations: `npx prisma migrate deploy`

### Post-Deployment Verification

```bash
# Test backend health
curl https://your-railway-backend-url.up.railway.app/health

# Test login (admin credentials)
curl -X POST https://your-railway-backend-url.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@freesquash.com","password":"123456"}'
```

Visit frontend URL and verify login works end-to-end.

## Documentation

For more detailed information, see:

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Deployment Guide](docs/RAILWAY_VERCEL_DEPLOY.md)** - Deploy to Railway + Vercel
- **[Backup & Recovery System](docs/BACKUP_RECOVERY_SYSTEM.md)** - Database backup & disaster recovery
- **[Docker Setup](docs/DOCKER_SETUP.md)** - Local development with Docker
- **[Logging System](docs/LOGGING_SYSTEM.md)** - Structured logging, analysis & dashboards
- **[User Manual](docs/MANUAL_USUARIO.md)** - End-user guide (Spanish)
- **[Audit Checklist](AUDIT_CHECKLIST.md)** - Security & performance verification
- **[Full Audit Report](AUDIT_REPORT.md)** - Comprehensive security analysis
- **[Business Rules](docs/REGLAS_CIERRE_TEMPORADA.md)** - Season closure rules
- **[Promotion/Relegation](docs/ASCENSOS_DESCENSOS_GUIA.md)** - Group movement rules
- **[AGENTS.md](AGENTS.md)** - Guidelines for code agents and contributors

## Troubleshooting

### Docker Issues

- **Services won't start**: Check `docker-compose logs <service-name>`
- **Port already in use**: Kill existing containers: `docker-compose down -v`
- **Database not syncing**: Run `docker-compose exec api npx prisma db push`

### Database Connection Issues

- **Can't connect to MySQL**: Verify MySQL container is healthy: `docker-compose ps`
- **Prisma client missing**: Run `npm install --workspaces` and `npx prisma generate`

### Port Conflicts

- MySQL: 3306 (mapped to localhost)
- Backend API: 3001
- Frontend: 4173
- Check with `netstat -ano | findstr :PORT` (Windows) or `lsof -i :PORT` (Mac/Linux)

## Security & Audit

### Security Features Implemented

- [x] **JWT Authentication** with bcryptjs password hashing
- [x] **CORS Protection** with dynamic allowed origins
- [x] **Input Validation** using Zod schemas
- [x] **Environment Validation** (JWT_SECRET enforced in production)
- [x] **Database Security** (Prisma ORM prevents SQL injection)
- [x] **Secure Headers** (Compression, ETag, Cache-Control)
- [x] **Token Expiration** (Logout on 401 errors)

### Build-Time Advisory (PWA)

PWA is enabled via `vite-plugin-pwa`. `npm audit` reports high-severity advisories in build-time dependencies (`workbox-build -> @rollup/plugin-terser -> serialize-javascript`). This does not affect runtime behavior. Risk is limited to the build/CI environment. We accept this risk for now and will revisit when upstream fixes land.

### Completed Audit Tasks

1. **Removed console.log() from production code**
   - Cleaned up debug statements from RecordMatch.tsx and EditMatchModal.tsx

2. **Added Database Indices**
   - Match: `groupId`, `player1Id`, `player2Id`, `winnerId`, `date`
   - BugReport: `status`, `createdAt`

3. **Validated Environment Variables**
   - JWT_SECRET now throws error if not configured or using fallback
   - ALLOWED_ORIGINS properly set for production

4. **Performance Optimizations**
   - Compression: 60-90% reduction with @fastify/compress
   - ETag: Conditional GET support
   - Cache-Control: 60s max-age on safe endpoints
   - React Query: 60s staleTime for local caching

### Full Audit Report

See [AUDIT_REPORT.md](AUDIT_REPORT.md) for comprehensive security analysis, performance review, and recommendations for future improvements.

## Database Backup & Recovery

### Quick Commands

```bash
# Download PROD database and restore locally (PRIMARY WORKFLOW)
npm run sync

# Backup current LOCAL database (before making changes)
npm run backup:quick

# Download only from PROD (no restore, read-only)
npm run backup:prod

# Restore from previous backup (if something breaks)
npm run restore

# Full backup with detailed output
npm run backup
```

### Daily Development Workflow

**MONDAY MORNING**: Get fresh production data

```bash
npm run sync
# BD LOCAL = BD PROD (all real data)
```

**TUESDAY-FRIDAY**: Work safely in development

```bash
npm run backup:quick     # Before making changes
# ... develop ...
npm run backup:quick     # After completing changes
# If something breaks: npm run restore
```

### Manual Download from Railway

If `npm run sync` encounters connection issues:

1. Go to https://railway.app/
2. Select FreeLiga project -> MySQL -> Backups tab
3. Download the latest backup
4. Save to `backups/` folder
5. Run: `npm run restore`

Full guide: [DESCARGAR_BACKUP_RAILWAY.md](docs/DESCARGAR_BACKUP_RAILWAY.md)

### Backup Files Location

```
backups/
|-- prod_sync_20260106_121500.sql.gz       (Downloaded from PROD and restored)
|-- backup_prod_20260106_230003.sql.gz     (Only downloaded from PROD)
|-- local_backup_20260106_145230.sql.gz    (Local development backup)
|-- latest_prod.sql.gz                     (Latest PROD backup marker)
|-- latest_local.sql.gz                    (Latest LOCAL backup marker)
`-- latest.sql.gz                          (Generic latest marker, if present)
```

**Note**: `backups/` is git-ignored and auto-cleans backups older than 30 days

---

## Security

### Production Credentials

**CRITICAL**: `.env` file contains sensitive production credentials - NEVER commit!

**If you exposed credentials in git history:**

```bash
# Remove from tracking
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env with exposed credentials"

# Clean git history (prevent access to old commits)
# See: SECURITY_FIX_REQUIRED.md for detailed steps
```

See complete security guide: [SECURITY_FIX_REQUIRED.md](SECURITY_FIX_REQUIRED.md)

## License

All rights reserved. This software and its source code are the intellectual property of Urtzi Diaz Arberas.

## Author

**Urtzi Diaz Arberas**

- GitHub: [@urtzih](https://github.com/urtzih)
- Repository: [FreeLiga](https://github.com/urtzih/FreeLiga)
- Copyright (c) 2024-2026 Urtzi Diaz Arberas
- All intellectual property rights reserved

## Contributing

This is an MVP. Future contributions should follow the feature roadmap in the implementation plan.

---

Built with love for the FreeSquash League by Urtzi Diaz Arberas
