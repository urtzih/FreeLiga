# Setup and Deployment Guide

## 📦 Local Development Setup

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (included in Docker Desktop)
- Git (for version control)

### Quick Start
```bash
# Copy environment template
cp .env.local.example .env.local

# Start all services (MySQL + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down          # Stop containers
docker-compose down -v       # Stop + remove volumes (resets DB)
```

### Access Points
- **Frontend (Web)**: http://localhost:4173
- **Backend API**: http://localhost:3001
- **MySQL**: localhost:3306 (user: freeliga, password: freeliga123)
- **API Docs**: http://localhost:3001/documentation

### Common Operations
```bash
# View logs for specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f mysql

# Database operations
docker-compose exec api npm run db:generate
docker-compose exec api npx prisma db push
docker-compose exec api npx prisma db seed

# Connect to MySQL
mysql -h localhost -u freeliga -p freeliga123 freeliga

# Full reset
docker-compose down -v
rm -rf node_modules apps/*/node_modules packages/*/node_modules
docker-compose up --build
```

### Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3306

# macOS/Linux
lsof -i :3306
```

**Docker daemon not running:**
- Start Docker Desktop from Applications

**Code changes not reflected:**
```bash
# Rebuild images
docker-compose up --build
```

**MySQL connection error:**
```bash
# Wait 10-15 seconds after docker-compose up
docker-compose logs mysql
```

## 🚀 Production Deployment

### Backend (Railway)

1. **Create Project in Railway**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select FreeLiga repository

2. **Add MySQL Database**
   - Dashboard → New → Database → MySQL
   - Wait for Online status

3. **Configure Environment Variables**
   ```env
   DATABASE_URL=${{MySQL.DATABASE_URL}}
   JWT_SECRET=your-super-secret-key-min-32-chars
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   NODE_ENV=production
   PORT=3001
   ```

4. **Build Settings**
   - Builder: Dockerfile
   - Dockerfile Path: `./Dockerfile`
   - Custom Build Command: `npm run build --workspace=@freesquash/api`
   - Watch Paths: `/apps/api/**`

5. **Deploy Settings**
   - Custom Start Command: `node apps/api/dist/server.js`
   - Healthcheck Path: `/health`
   - CPU: 2 vCPU (max)
   - Memory: 1 GB (max)

6. **Generate Public Domain**
   - Settings → Public Networking → Generate Domain
   - Save the generated URL (e.g., `https://freesquashapi-production.up.railway.app`)

7. **Verify Deployment**
   - Check Deployments tab for successful build
   - Test healthcheck: `https://freesquashapi-production.up.railway.app/health`
   - Test API docs: `https://freesquashapi-production.up.railway.app/documentation`

### Frontend (Vercel)

1. **Import Project**
   - Go to [vercel.com](https://vercel.com)
   - Add New → Project
   - Import FreeLiga repository

2. **Configure Build**
   - Root Directory: `apps/web` (important for monorepo)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --prefix=../..` or `npm ci --prefix=../..`

3. **Add Environment Variables**
   - VITE_API_URL: `https://freesquashapi-production.up.railway.app`
   - Apply to Production, Preview, Development

4. **Deploy**
   - Click Deploy
   - Wait 2-3 minutes for build completion
   - Vercel will provide production URL

5. **Update Railway CORS**
   - Return to Railway → API Service → Variables
   - Update `FRONTEND_URL` and `ALLOWED_ORIGINS` with your Vercel URL
   - Railway will restart automatically

6. **Verify Integration**
   - Open frontend URL
   - Login with: admin@freesquash.com / 123456
   - Check browser console (F12) for CORS errors
   - Test direct API endpoint if needed

## 📊 Production URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://free-liga-web.vercel.app |
| Backend API (Railway) | https://freesquashapi-production.up.railway.app ✅ |
| API Docs | https://freesquashapi-production.up.railway.app/documentation |
| Healthcheck | https://freesquashapi-production.up.railway.app/health |

## 🔧 Architecture Overview

```
┌─────────────────────────────────────┐
│       Frontend (Vite)               │
│     http://localhost:4173           │
│      (hot reload enabled)           │
└──────────────┬──────────────────────┘
               │ HTTP (CORS)
               │
┌──────────────▼──────────────────────┐
│       Backend API (Fastify)         │
│     http://localhost:3001           │
│     (hot reload via tsx watch)      │
└──────────────┬──────────────────────┘
               │ Prisma ORM
               │
┌──────────────▼──────────────────────┐
│      MySQL Database (8.0)           │
│     localhost:3306                  │
│   (persistent volume)               │
└─────────────────────────────────────┘
```

## 📝 Environment Variables

### Backend (.env.local for local, Railway dashboard for production)
- `NODE_ENV`: `development` or `production`
- `PORT`: API port (3001)
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Key for signing JWTs (min 32 chars, must be set)
- `FRONTEND_URL`: Frontend URL for CORS
- `ALLOWED_ORIGINS`: Origins permitted for CORS

### Frontend (.env for local, Vercel dashboard for production)
- `VITE_API_URL`: Backend API base URL

## ✅ Deployment Checklist

- [ ] Git repository up to date
- [ ] All tests passing
- [ ] Environment variables configured in Railway
- [ ] Environment variables configured in Vercel
- [ ] Railway domain generated and public
- [ ] Vercel build successful
- [ ] CORS variables updated in Railway with final Vercel URL
- [ ] Healthcheck responds: `{"status":"ok"}`
- [ ] API docs accessible
- [ ] Frontend loads without CORS errors
- [ ] Login works (admin@freesquash.com / 123456)
- [ ] Database operations functional
