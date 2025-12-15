# 🚀 Railway + Vercel Production Deployment Guide

Guía completa para desplegar **FreeSquash League** a producción usando **Railway** (backend) y **Vercel** (frontend).

---

## 📋 Prerequisites

- GitHub account with FreeLiga repository pushed
- Railway account ([railway.app](https://railway.app))
- Vercel account ([vercel.com](https://vercel.com))
- MySQL database (Railway managed or external)

---

## 🔧 Backend Deployment (Railway)

### Step 1: Create Railway Account & Project

1. Go to [railway.app](https://railway.app)
2. Sign up / Sign in with GitHub
3. Create new project: **Dashboard → New Project**
4. Select **Deploy from GitHub Repo**
5. Choose **FreeLiga** repository
6. Confirm and create

### Step 2: Add MySQL Database Service (Optional)

If you don't have an external database:

1. In Railway Dashboard: **New → Database → MySQL**
2. Railway auto-generates connection string in `DATABASE_URL`
3. Keep for next step

### Step 3: Configure Environment Variables

In **Railway Dashboard → Project → Variables**:

```env
# Database connection (from MySQL service or external provider)
DATABASE_URL=mysql://username:password@host:3306/database_name

# JWT authentication secret
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-recommended

# Frontend URL (will update after Vercel deployment)
FRONTEND_URL=https://your-vercel-domain.vercel.app

# Allowed CORS origins (comma-separated if multiple)
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app

# Environment
NODE_ENV=production
```

**Important**: Change `JWT_SECRET` to a strong random string in production!

Generate secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Configure Deployment Settings

In **Railway Dashboard → Deployments**:

- **Root Directory**: leave empty (monorepo root)
- **Builder**: Docker
- **Dockerfile**: `./Dockerfile`
- **Start Command**: Leave empty (auto-detected from Dockerfile)

### Step 5: Deploy

Railway auto-deploys on:
- Git push to main branch
- Manual trigger via Dashboard → Deploy button

Check deployment logs:
```
Dashboard → Logs → View all logs
```

### Step 6: Get Backend URL

After successful deployment:
1. Go to **Railway Dashboard → Project**
2. Select **API** service
3. Copy **Public URL** (format: `https://xxx.up.railway.app`)
4. Save this for Vercel configuration

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Create Vercel Account & Import Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Sign in with GitHub
3. Import Git Repository: **Add New → Project → Import Git Repo**
4. Select **FreeLiga** repository
5. Click **Import**

### Step 2: Configure Build Settings

Vercel should auto-detect, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build --workspace=apps/web`
- **Output Directory**: `dist`
- **Install Command**: `npm install --workspaces`

**Note**: A `vercel.json` file has been added to `apps/web` to handle client-side routing (SPA rewrites). Ensure this file is pushed to GitHub.

### Step 3: Add Environment Variables

In **Vercel Dashboard → Project Settings → Environment Variables**:

```env
VITE_API_URL=https://your-railway-backend-url.up.railway.app
```

Replace `your-railway-backend-url` with the Railway public URL from Step 6 above.

### Step 4: Deploy

Click **Deploy** button. Vercel will:
1. Install dependencies
2. Build React/Vite app
3. Generate static dist/ folder
4. Deploy to global CDN

Deployment URL: `https://xxxx.vercel.app`

### Step 5: Update Railway FRONTEND_URL

Now that you have Vercel URL:

1. Go back to **Railway Dashboard**
2. Select **API** service → **Variables**
3. Update `FRONTEND_URL` to your Vercel URL
4. Railway auto-redeploys with new variables

---

## ✅ Verification Checklist

### Backend (Railway)

```bash
# Test health endpoint
curl https://your-railway-url.up.railway.app/health

# Test API connection
curl https://your-railway-url.up.railway.app/api/seasons

# Test login
curl -X POST https://your-railway-url.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@freesquash.com","password":"123456"}'
```

Should return JWT token.

### Frontend (Vercel)

1. Visit `https://your-vercel-domain.vercel.app`
2. Should load React app (no blank page)
3. Try login with:
   - Email: `admin@freesquash.com`
   - Password: `123456`
4. Verify API calls work (check Network tab in DevTools)

### Database

Verify seed data loaded:
```bash
# If MySQL is accessible from your machine
mysql -h host -u freeliga -p freeliga123 freeliga -e "SELECT COUNT(*) as user_count FROM users;"
```

Should return: `75` (admin + 74 players)

---

## 🔄 Continuous Deployment

Both Railway and Vercel auto-deploy on git push:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Railway & Vercel automatically build and deploy
# Check progress in respective dashboards
```

---

## 🔐 Security Best Practices

1. **Change JWT_SECRET**: Use strong random value, NOT default
2. **HTTPS Only**: Both Railway and Vercel provide free HTTPS
3. **CORS Validation**: Only allow your Vercel domain in `ALLOWED_ORIGINS`
4. **Database Credentials**: Use environment variables, never commit to git
5. **Version Control**: Keep `.env` and `.env.production` out of git (check `.gitignore`)

---

## 🛠️ Troubleshooting

### Railway Build Fails

Check **Railway Dashboard → Logs**:

```
Error: npm install failed
→ Solution: Ensure package.json valid, run locally first

Error: Prisma generation failed
→ Solution: Run npx prisma generate locally, commit node_modules if needed
```

### Vercel Build Fails

Check **Vercel Dashboard → Deployments → Build Logs**:

```
Error: Module not found (apps/web/src/...)
→ Solution: Check import paths, ensure files exist

Error: VITE_API_URL not set
→ Solution: Add environment variable in Vercel dashboard
```

### API & Frontend Can't Communicate

1. **Check VITE_API_URL**: Must point to Railway public URL
2. **Check CORS**: Verify Vercel domain in Railway `ALLOWED_ORIGINS`
3. **Check JWT**: Verify `JWT_SECRET` same on Railway (no drift after changes)
4. **Browser DevTools**: Check Network tab for 401/403 errors

### Database Connection Error

1. **Verify DATABASE_URL**: Format must be `mysql://user:pass@host:port/db`
2. **Test Locally**: Run against production database locally first
3. **Check Firewall**: Ensure Railway/VPC allows MySQL port (3306)
4. **MySQL Credentials**: Verify user has SELECT/INSERT/UPDATE/DELETE permissions

---

## 📊 Production URLs

After deployment, update bookmarks:

| Service | URL |
|---------|-----|
| Frontend | `https://your-vercel-domain.vercel.app` |
| Backend API | `https://your-railway-url.up.railway.app` |
| API Docs | `https://your-railway-url.up.railway.app/documentation` |
| Health Check | `https://your-railway-url.up.railway.app/health` |

---

## 📞 Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Fastify Docs**: https://www.fastify.io/docs/latest

---

**Last Updated**: December 2025  
**Status**: Production Ready
