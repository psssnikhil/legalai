# 🚀 FINAL DEPLOYMENT GUIDE - Legal AI to Vercel

**Complete step-by-step instructions to deploy your Legal AI application to Vercel**

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- ✅ GitHub account
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ OpenAI API key
- ✅ Code pushed to GitHub
- ✅ 30-45 minutes of time

---

## 🎯 Deployment Overview

```
1. Set up PostgreSQL database (15 min)
2. Configure environment variables (10 min)
3. Deploy to Vercel (10 min)
4. Initialize database (5 min)
5. Test deployment (10 min)
```

---

## STEP 1: Set Up PostgreSQL Database 🗄️

### Why?
Your app currently uses SQLite which **doesn't work on Vercel**. You need PostgreSQL.

### Option A: Neon (Recommended - Free)

1. **Go to [neon.tech](https://neon.tech)**

2. **Sign up** with GitHub

3. **Create a new project:**
   - Project name: `legalai-production`
   - PostgreSQL version: `16` (latest)
   - Region: `US East (Ohio)` or closest to you
   - Click **Create Project**

4. **Copy the connection string:**
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   - Save this for later - you'll need it!

### Option B: Vercel Postgres

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database**
3. Select **Postgres**
4. Name: `legalai-db`
5. Click **Create**
6. Copy the connection string

### ✅ Checkpoint
You should now have a `DATABASE_URL` that starts with `postgresql://`

---

## STEP 2: Prepare Environment Variables 🔐

### Generate NextAuth Secret

Open your terminal and run:
```bash
openssl rand -base64 32
```

Copy the output - this is your `NEXTAUTH_SECRET`

### Prepare Your Variables

Create a text file with these values (we'll use them in a moment):

```
OPENAI_API_KEY=sk-your-actual-key-here
NEXTAUTH_SECRET=the-secret-you-just-generated
NEXTAUTH_URL=will-be-added-after-first-deploy
DATABASE_URL=postgresql://your-connection-string-from-step-1
```

**Optional (only if using S3):**
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=your-bucket
AWS_S3_REGION=us-east-1
```

### ✅ Checkpoint
You have all 4 required values ready (3 complete, 1 placeholder for NEXTAUTH_URL)

---

## STEP 3: Push Code to GitHub 📤

### Check Current Status

```bash
cd /Users/nikhilpentapalli/legalai
git status
```

### Commit and Push

```bash
# Add all changes
git add .

# Commit with a message
git commit -m "Prepare for Vercel deployment with PostgreSQL"

# Push to GitHub
git push origin master
```

### Verify on GitHub
- Go to your GitHub repository
- Confirm the latest commit is there
- Check that `prisma/schema.prisma` shows `provider = "postgresql"`

### ✅ Checkpoint
Your code is on GitHub and schema.prisma is set to PostgreSQL

---

## STEP 4: Deploy to Vercel 🚀

### 4.1 Connect Vercel to GitHub

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**

2. **Click "Add New..."** → **"Project"**

3. **Import Git Repository:**
   - Select your GitHub account
   - Find `legalai` repository
   - Click **Import**

### 4.2 Configure Project Settings

On the configuration page:

1. **Project Name:** `legalai` (or your preferred name)

2. **Framework Preset:** Next.js ✅ (should be auto-detected)

3. **Root Directory:** `./` (leave as default)

4. **Build Settings:**
   - Build Command: `npm run build` ✅
   - Output Directory: `.next` ✅
   - Install Command: `npm install` ✅
   
   These should all be auto-detected - don't change them!

### 4.3 Add Environment Variables

**Click "Environment Variables" section** and add each variable:

#### Variable 1: OPENAI_API_KEY
- **Name:** `OPENAI_API_KEY`
- **Value:** `sk-your-actual-openai-key`
- **Environments:** Check all three boxes ✅
  - Production
  - Preview
  - Development

#### Variable 2: NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** `your-generated-secret-from-step-2`
- **Environments:** Check all three boxes ✅

#### Variable 3: DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://your-connection-string`
- **Environments:** Check all three boxes ✅

#### Variable 4: NEXTAUTH_URL (Placeholder)
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://legalai.vercel.app` (use your expected URL)
- **Environments:** Check all three boxes ✅

**Note:** We'll update NEXTAUTH_URL with the actual URL after first deploy

#### Optional: AWS S3 Variables (if using)
Repeat for:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`
- `AWS_S3_REGION`

### 4.4 Deploy!

1. **Click "Deploy"** button

2. **Wait for deployment** (2-3 minutes)
   - Watch the build logs
   - Should see:
     ```
     ✓ Generating Prisma Client
     ✓ Compiled successfully
     ✓ Build completed
     ```

3. **Deployment complete!** 🎉

### ✅ Checkpoint
You should see "Congratulations!" with your deployment URL

---

## STEP 5: Update NEXTAUTH_URL 🔄

### Copy Your Deployment URL

Your Vercel URL will look like:
```
https://legalai-abc123.vercel.app
```

### Update Environment Variable

1. **In Vercel Dashboard**, go to:
   - Your Project → **Settings** → **Environment Variables**

2. **Find NEXTAUTH_URL**

3. **Click "Edit"**

4. **Update value** to your actual deployment URL (the one you just got)

5. **Click "Save"**

### Redeploy

1. Go to **Deployments** tab

2. Click **"..."** on the latest deployment

3. Select **"Redeploy"**

4. Click **"Redeploy"** to confirm

5. Wait for redeployment (~2 minutes)

### ✅ Checkpoint
NEXTAUTH_URL now matches your actual deployment URL

---

## STEP 6: Initialize Database 📊

### Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
cd /Users/nikhilpentapalli/legalai
vercel link

# Pull environment variables
vercel env pull .env.production.local

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push
```

### Or Manually in Neon Dashboard

1. Go to your Neon project
2. Click **SQL Editor**
3. Run the Prisma SQL (generated by `prisma db push`)
4. Verify tables were created

### Verify Database

Check that these tables exist:
- User
- Account
- Session
- Case
- Document
- ChatSession
- ChatMessage
- VoiceNote
- CaseAnalysis

### ✅ Checkpoint
Database schema is deployed and tables exist

---

## STEP 7: Test Your Deployment ✅

### 7.1 Visit Your App

Go to your deployment URL:
```
https://your-app.vercel.app
```

### 7.2 Test Authentication

1. **Click "Sign Up"** or navigate to `/auth/signup`

2. **Create a test account:**
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!

3. **Click Sign Up**

4. **Should redirect to dashboard** ✅

5. **Sign out and sign in again** to test login ✅

### 7.3 Test Core Features

#### Test AI Case Intake
1. Navigate to "AI Case Intake"
2. Type a message: "I need help with a contract dispute"
3. Verify AI responds with streaming text ✅

#### Test Document Upload
1. Click document upload
2. Upload a test PDF
3. Verify it processes successfully ✅

#### Test AI Case Assistant
1. Navigate to "AI Case Assistant"
2. Create a new case
3. Verify case is saved ✅

### 7.4 Check for Errors

1. **Open browser DevTools** (F12)
2. **Check Console tab** - should see no red errors
3. **Check Network tab** - API calls should be 200 OK

### ✅ Checkpoint
All features work correctly in production

---

## STEP 8: Set Up Automatic Deployments (Optional) 🤖

### Enable Auto-Deploy on Push

This is already configured! Vercel automatically deploys when you push to GitHub.

**To test:**
```bash
# Make a small change
echo "# Deployed successfully!" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deploy"
git push origin master

# Check Vercel dashboard - should see new deployment starting
```

### Enable GitHub Actions CI/CD (Optional)

The workflow is already created in `.github/workflows/deploy.yml`

**To enable:**

1. **Go to GitHub** repository → **Settings** → **Secrets and variables** → **Actions**

2. **Add these secrets:**

   Get these values first:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel link
   
   # This creates .vercel/project.json
   cat .vercel/project.json
   ```

   Add secrets:
   - **VERCEL_TOKEN**: Generate at [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - **VERCEL_ORG_ID**: From `.vercel/project.json` (orgId field)
   - **VERCEL_PROJECT_ID**: From `.vercel/project.json` (projectId field)
   - **OPENAI_API_KEY**: Your OpenAI key (for build tests)

3. **Push to GitHub:**
   ```bash
   git push origin master
   ```

4. **Check Actions tab** - should see workflow running

### ✅ Checkpoint
Automatic deployments are working

---

## STEP 9: Set Up Staging Environment (Optional) 🎭

### Create Staging Branch

```bash
# Create staging branch
git checkout -b staging

# Push to GitHub
git push -u origin staging
```

### Configure Staging Environment

1. **Create staging database** in Neon:
   - Name: `legalai-staging`
   - Copy connection string

2. **In Vercel**, add staging-specific env var:
   - Go to Settings → Environment Variables
   - Edit `DATABASE_URL`
   - Add separate value for Preview environment
   - Use staging database connection string

3. **Deploy staging:**
   ```bash
   git checkout staging
   git push origin staging
   ```

4. **Find staging URL** in Vercel dashboard:
   ```
   https://legalai-git-staging-xxx.vercel.app
   ```

### Workflow

```bash
# Develop on feature branch
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature

# Merge to staging for testing
git checkout staging
git merge feature/new-feature
git push origin staging
# Test on staging URL

# Deploy to production
git checkout master
git merge staging
git push origin master
# Deploys to production
```

### ✅ Checkpoint
Staging environment is set up and working

---

## STEP 10: Configure Custom Domain (Optional) 🌐

### Add Custom Domain

1. **In Vercel Dashboard**, go to:
   - Your Project → **Settings** → **Domains**

2. **Enter your domain:**
   - Example: `legalai.com` or `app.yourdomain.com`

3. **Add DNS records** at your domain registrar:
   
   For apex domain (legalai.com):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
   
   For subdomain (app.legalai.com):
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

4. **Wait for DNS propagation** (5 min - 48 hours)

5. **Verify** - domain should show as verified in Vercel

### Update NEXTAUTH_URL

After domain is active:
1. Update `NEXTAUTH_URL` to your custom domain
2. Redeploy

### ✅ Checkpoint
Custom domain is working

---

## 🎉 DEPLOYMENT COMPLETE!

Your Legal AI application is now live on Vercel!

### Your Deployment URLs:

- **Production:** https://your-app.vercel.app
- **Staging:** https://your-app-git-staging.vercel.app (if configured)
- **Custom Domain:** https://your-domain.com (if configured)

### What's Working:

✅ Authentication (Sign Up / Sign In)  
✅ AI Chat with streaming responses  
✅ Document upload and processing  
✅ Case management  
✅ AI Case Assistant workflow  
✅ Legal Library Chat  
✅ Court Diary  
✅ Document Drafting  
✅ Automatic deployments on push  

---

## 📊 Post-Deployment Tasks

### Immediate (Do Now)

- [ ] Test all features thoroughly
- [ ] Share deployment URL with team
- [ ] Bookmark Vercel dashboard
- [ ] Set up error monitoring

### Within 24 Hours

- [ ] Enable Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Configure backup strategy
- [ ] Review API usage and costs
- [ ] Document any issues found

### Within 1 Week

- [ ] Set up custom domain (if needed)
- [ ] Configure staging environment
- [ ] Add monitoring and alerts
- [ ] Create user documentation
- [ ] Train team on deployment workflow

---

## 🔧 Troubleshooting

### Build Fails

**Check Vercel build logs:**
1. Go to Deployments
2. Click failed deployment
3. Read error message

**Common fixes:**
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify all dependencies installed
npm install
```

### Database Connection Errors

**Verify connection string:**
```bash
# Test locally
npx prisma db push
```

**Common issues:**
- Missing `?sslmode=require`
- Wrong username/password
- Database doesn't allow Vercel IPs

### Authentication Issues

**Check these:**
- NEXTAUTH_URL matches deployment URL exactly
- NEXTAUTH_SECRET is set
- No trailing slash in NEXTAUTH_URL
- Cookies are enabled in browser

### Environment Variables Not Working

**Remember:**
- Must redeploy after adding/changing variables
- Variables are case-sensitive
- No quotes needed in Vercel dashboard
- Use Production/Preview/Development checkboxes correctly

---

## 🆘 Getting Help

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- [Vercel Support](https://vercel.com/support)

### Component Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)

### Check Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs

# View specific deployment
vercel logs [deployment-url]
```

---

## 📈 Monitoring Your App

### Vercel Analytics

1. Go to your project in Vercel
2. Click **Analytics** tab
3. Enable Vercel Analytics
4. View real-time metrics

### Error Tracking

Add Sentry (optional):
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Uptime Monitoring

Use services like:
- [Better Uptime](https://betteruptime.com) (free)
- [UptimeRobot](https://uptimerobot.com) (free)
- Vercel Pro (built-in)

---

## 💰 Cost Considerations

### Free Tier Includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic SSL
- Preview deployments
- Analytics (basic)

### Monitor Usage:
- OpenAI API costs (pay per use)
- Database storage (depends on provider)
- Vercel bandwidth
- S3 storage (if using)

### Set Spending Limits:
1. OpenAI: Dashboard → Settings → Limits
2. Neon: Free tier is fixed
3. Vercel: Upgrade only if needed

---

## 🔄 Making Updates

### Quick Updates

```bash
# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Update feature X"
git push origin master

# Vercel automatically deploys!
```

### Rollback if Needed

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click **"..."** → **"Promote to Production"**

---

## ✅ Final Checklist

Before considering deployment complete:

- [ ] App loads at production URL
- [ ] Can create account and sign in
- [ ] AI chat works and streams correctly
- [ ] Documents upload successfully
- [ ] All pages are accessible
- [ ] No console errors
- [ ] Mobile responsive
- [ ] NEXTAUTH_URL is correct
- [ ] Database is working
- [ ] Environment variables are set
- [ ] Automatic deployments work
- [ ] Team has access to URLs
- [ ] Documentation is updated

---

## 🎊 Congratulations!

You've successfully deployed your Legal AI application to Vercel!

**What you've accomplished:**
- ✅ Migrated from SQLite to PostgreSQL
- ✅ Configured all environment variables
- ✅ Deployed to production on Vercel
- ✅ Set up automatic deployments
- ✅ Tested all features in production
- ✅ Created staging environment (optional)
- ✅ Configured CI/CD (optional)

**Your app is now:**
- 🌍 Live on the internet
- 🚀 Auto-deploys on git push
- 🔐 Secure with authentication
- 🤖 Powered by AI
- 📊 Using production database
- ⚡ Fast on Vercel's edge network

---

## 📝 Keep This Guide

Save these URLs for reference:
- **This Guide:** `/Users/nikhilpentapalli/legalai/FINAL_DEPLOYMENT_GUIDE.md`
- **Checklist:** `VERCEL_DEPLOYMENT_CHECKLIST.md`
- **Environment Vars:** `ENVIRONMENT_VARIABLES.md`
- **Staging Setup:** `STAGING_ENVIRONMENT_SETUP.md`

---

**Need help? Check the troubleshooting section or open an issue on GitHub.**

**Happy deploying! 🚀**

