# Railway Deployment Guide

## Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Verify your email

## Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `anonymous5469/AGNICORE`
4. Click "Add Variables" to configure environment variables (see below)

## Step 3: Add PostgreSQL Database
1. In your project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a database
4. Note the "Database URL" in the "Connect" tab

## Step 4: Configure Environment Variables
Add these variables in Railway Dashboard:

```
DATABASE_URL=<your-railway-postgres-url>
JWT_SECRET=<generate-strong-secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-secure-password>
ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
PORT=8080
RUST_LOG=info
```

**Note**: The PostgreSQL URL will be automatically provided by Railway after you create the database.

## Step 5: Deploy
1. Railway will auto-deploy when you push to GitHub
2. Or click "Deploy" in the dashboard
3. Check logs for any errors

## Step 6: Update Frontend
1. Go to Vercel dashboard
2. Update environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-railway-url.up.railway.app/api`
3. Redeploy frontend

## Railway Free Tier Limits
- App sleeps after 30 minutes of inactivity
- Wakes up on next request (15-30 second delay)
- PostgreSQL data persists even when app sleeps
- $5/month free credit covers light usage
