# Render Deployment Guide

## Overview
Your backend is ready for Render deployment. This guide covers setup, persistence issues with SQLite, and next steps.

## Files Created for Render
- **`backend/Dockerfile`** - Docker image for Render
- **`backend/.dockerignore`** - Files to exclude from Docker build
- **`render.yaml`** - Render deployment configuration (already present, now using Docker)
- **`backend/.env.example`** - Environment variable template

## Quick Start (Manual via Render Dashboard)

### Step 1: Push to GitHub
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Add Render deployment config"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dict-regional-calendar.git
git push -u origin main
```

### Step 2: Create Render Service
1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. **Connect GitHub repository** — select your repo
4. **Configure service:**
   - **Name:** `dict-regional-calendar-backend`
   - **Region:** `Oregon` (or your choice)
   - **Runtime:** `Docker`
   - **Build & Start Command:** (leave default — uses Dockerfile)
5. **Add Environment Variables** under **"Advanced"**:
   ```
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://r11regionalcalender.web.app
   JWT_SECRET=<your-secure-random-key-here>
   ```
6. **Choose Plan:** Free tier availa ble
7. **Create Web Service**

### Step 3: Wait for Deployment
- Render will pull your repo, build the Docker image, and deploy
- You'll get a public URL like: `https://dict-regional-calendar-backend.onrender.com`
- Visit `https://dict-regional-calendar-backend.onrender.com/health` to verify it's running

### Step 4: Update Frontend API URL
1. Rebuild frontend with your Render backend URL:
   ```powershell
   $env:VITE_API_URL="https://dict-regional-calendar-backend.onrender.com/api"
   npm run build
   firebase deploy
   ```

2. Or (bash/CI):
   ```bash
   export VITE_API_URL="https://dict-regional-calendar-backend.onrender.com/api"
   npm run build
   firebase deploy
   ```

## Important: SQLite Persistence Issue ⚠️

### Problem
SQLite database (`dict_calendar.db`) is stored in the container's ephemeral filesystem. **When Render redeploys or restarts the service, your database is lost.**

Free tier: No way to attach persistent storage.

### Solutions

#### Option A: Use Render Paid Plan + Persistent Disk (Recommended Short-Term)
1. Upgrade to **Render's Starter plan** (~$10/month)
2. Attach a **Persistent Disk** (5GB free, then $0.25/GB)
3. Configure database path to `/var/data/dict_calendar.db`
4. Update `backend/src/database.ts`:
   ```typescript
   const dbPath = process.env.DATABASE_PATH || path.join('/var/data', 'dict_calendar.db');
   ```

#### Option B: Migrate to PostgreSQL (Recommended Long-Term)
- Switch from SQLite to PostgreSQL (managed DB service)
- Render offers free PostgreSQL tier with limits
- Provides reliability, backups, and scalability
- Requires code changes to use `node-postgres` or Prisma instead of `better-sqlite3`

#### Option C: Use a Different Host
- **Railway** — free tier with persistent volumes
- **Fly.io** — persistent storage options
- **Vercel with Postgres** — serverless + managed DB

## Backend CORS Configuration

Your backend already allows requests from the frontend:
```typescript
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
})
```

This is set in `backend/src/server.ts`. Render deployment sets:
```
FRONTEND_URL=https://r11regionalcalender.web.app
```

## Monitoring & Logs

After deployment:
1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab to see real-time server logs
3. Check `/health` endpoint to verify service is up
4. Monitor errors, DB issues, or connection problems

## Environment Variables

Set these in Render Dashboard under **"Environment"**:
- `PORT` = `3000`
- `NODE_ENV` = `production`
- `FRONTEND_URL` = `https://r11regionalcalender.web.app`
- `JWT_SECRET` = generate a strong random key

## Troubleshooting

### Service keeps crashing
- Check logs in Render dashboard
- Verify `NODE_ENV=production`
- Ensure `PORT=3000` is set

### Frontend can't reach backend
- Verify CORS: `FRONTEND_URL` should match hosting URL
- Check backend health: `https://<your-backend>.onrender.com/health`
- Inspect browser console for real errors
- Ensure `VITE_API_URL` matches your Render backend URL

### Database lost after restart
- Expected with free tier + SQLite
- Consider **Option B: PostgreSQL migration** or upgrade to paid plan with persistent disk

## Next Steps

1. **Deploy:** Follow "Quick Start" above
2. **Test:** Visit `/health` endpoint
3. **Update Frontend:** Rebuild with `VITE_API_URL="https://<your-backend>.onrender.com/api"`
4. **Monitor:** Check Render logs for errors
5. **Plan:** Decide on SQLite persistence strategy (Option A/B/C)

## Additional Resources

- [Render Docs - Docker Deployments](https://render.com/docs/docker)
- [Render Docs - Environment Variables](https://render.com/docs/environment-variables)
- [Render Docs - Persistent Disks](https://render.com/docs/persistent-disks)
- [PostgreSQL Migration Guide](./POSTGRES_MIGRATION.md) (coming soon)
