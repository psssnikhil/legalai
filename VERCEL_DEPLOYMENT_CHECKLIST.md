# Vercel Deployment Checklist ✅

## Pre-Deployment Tasks

### 1. Database Migration (CRITICAL) 🔴
- [ ] Sign up for PostgreSQL database (Neon, Supabase, or Vercel Postgres)
- [ ] Get DATABASE_URL connection string
- [ ] Update `prisma/schema.prisma` (already done - provider changed to postgresql)
- [ ] Test local connection with production database
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push` to create tables in production database

### 2. Environment Variables 🔐
Collect all these values before deployment:

- [ ] **OPENAI_API_KEY** - Get from OpenAI dashboard
- [ ] **NEXTAUTH_SECRET** - Generate using: `openssl rand -base64 32`
- [ ] **NEXTAUTH_URL** - Will be your Vercel URL (update after first deploy)
- [ ] **DATABASE_URL** - PostgreSQL connection string
- [ ] **AWS_ACCESS_KEY_ID** (Optional - for S3)
- [ ] **AWS_SECRET_ACCESS_KEY** (Optional - for S3)
- [ ] **AWS_S3_BUCKET_NAME** (Optional - for S3)
- [ ] **AWS_S3_REGION** (Optional - for S3)

### 3. Code Preparation 📝
- [ ] Verify all dependencies are in package.json
- [ ] Check no hardcoded localhost URLs
- [ ] Update image domains in next.config.js if using external images
- [ ] Test build locally: `npm run build`
- [ ] Commit all changes to git
- [ ] Push to GitHub

### 4. GitHub Setup 🐙
- [ ] Create GitHub repository (if not already done)
- [ ] Push your code to GitHub
- [ ] Ensure main/master branch is up to date

## Deployment Steps

### Step 1: Create Vercel Account
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with GitHub (recommended)
- [ ] Authorize Vercel to access your repositories

### Step 2: Import Project
- [ ] Click "Add New" → "Project"
- [ ] Select your legalai repository
- [ ] Click "Import"

### Step 3: Configure Project
- [ ] **Framework Preset:** Next.js (auto-detected)
- [ ] **Root Directory:** ./ (leave as default)
- [ ] **Build Command:** `npm run build` (auto-detected)
- [ ] **Output Directory:** .next (auto-detected)

### Step 4: Add Environment Variables
Add each variable in the Environment Variables section:

```
OPENAI_API_KEY=sk-...
NEXTAUTH_SECRET=generated-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=your-key (optional)
AWS_SECRET_ACCESS_KEY=your-secret (optional)
AWS_S3_BUCKET_NAME=your-bucket (optional)
AWS_S3_REGION=us-east-1 (optional)
```

**Important:** Set these for all environments (Production, Preview, Development)

### Step 5: Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for build to complete
- [ ] Check build logs for any errors

### Step 6: Post-Deployment Configuration
- [ ] Copy your deployment URL (e.g., https://legalai.vercel.app)
- [ ] Update NEXTAUTH_URL environment variable with actual URL
- [ ] Redeploy (Settings → Deployments → Click "..." → Redeploy)

### Step 7: Database Initialization
- [ ] Verify database connection is working
- [ ] Check that tables were created (use Prisma Studio or database GUI)
- [ ] Test creating a user account

## Testing Checklist

### Authentication
- [ ] Sign up works
- [ ] Sign in works
- [ ] Sign out works
- [ ] Protected routes redirect to login
- [ ] Session persists across page refreshes

### Core Features
- [ ] Dashboard loads correctly
- [ ] AI Case Intake chat works
- [ ] Document upload works
- [ ] AI Case Assistant workflow works
- [ ] Legal Library Chat works
- [ ] Court Diary works
- [ ] Document drafting works

### AI Features
- [ ] OpenAI API calls work
- [ ] Streaming responses work
- [ ] Document analysis works
- [ ] Similar cases search works

### Performance
- [ ] Pages load in < 3 seconds
- [ ] No console errors
- [ ] Images load properly
- [ ] API routes respond quickly

## Post-Deployment Tasks

### Immediate
- [ ] Test all features in production
- [ ] Check error logs in Vercel dashboard
- [ ] Verify all API endpoints work
- [ ] Test on mobile devices
- [ ] Share deployment URL with team

### Within 24 Hours
- [ ] Set up custom domain (optional)
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CORS if needed
- [ ] Set up staging environment

### Within 1 Week
- [ ] Set up automatic deployments on push
- [ ] Configure branch previews
- [ ] Add monitoring and alerts
- [ ] Set up backup strategy for database
- [ ] Document API endpoints
- [ ] Create user documentation

## Troubleshooting Common Issues

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are installed
- Test `npm run build` locally
- Check for TypeScript errors

### Database Connection Errors
- Verify DATABASE_URL is correct
- Check database allows connections from Vercel IPs
- Test connection locally with production DATABASE_URL
- Add connection pooling: `?connection_limit=1`

### Authentication Issues
- Verify NEXTAUTH_URL matches deployment URL exactly
- Check NEXTAUTH_SECRET is set
- Clear browser cookies and try again
- Check cookies work (not blocked by browser)

### API Routes Not Working
- Check environment variables are set
- Verify API routes don't have hardcoded localhost URLs
- Check CORS settings if calling from external domain
- Review API logs in Vercel dashboard

### Environment Variables Not Working
- Remember to redeploy after adding/changing env vars
- Check variables are set for correct environment
- Use `process.env.VARIABLE_NAME` to access
- Don't expose sensitive variables to client-side

## Rollback Plan

If something goes wrong:

1. **Quick Rollback:**
   - Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Fix and Redeploy:**
   - Fix issue locally
   - Test thoroughly
   - Commit and push
   - Auto-deploys or manual deploy

## Performance Optimization

After successful deployment:

- [ ] Enable Edge Functions for faster responses
- [ ] Configure caching for static assets
- [ ] Optimize images with Next.js Image component
- [ ] Enable compression
- [ ] Set up CDN for static files
- [ ] Monitor Core Web Vitals

## Security Checklist

- [ ] All environment variables are secret (not in code)
- [ ] Database connection uses SSL
- [ ] API routes have authentication
- [ ] File uploads are validated and sanitized
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] No sensitive data in logs

## Monitoring & Maintenance

- [ ] Set up Vercel Analytics
- [ ] Configure error alerts
- [ ] Monitor API usage and costs
- [ ] Track OpenAI API usage
- [ ] Monitor database size and connections
- [ ] Set up uptime monitoring
- [ ] Create backup schedule

## Documentation

- [ ] Update README with production URL
- [ ] Document environment variables
- [ ] Create API documentation
- [ ] Document deployment process
- [ ] Create user guide
- [ ] Document troubleshooting steps

---

## Quick Reference Commands

```bash
# Test build locally
npm run build && npm start

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# View database
npx prisma studio

# Deploy via CLI
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Pull environment variables
vercel env pull
```

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Deployment URL:** _______________  
**Database Provider:** _______________  

---

✅ **All checked? You're ready to deploy!**

