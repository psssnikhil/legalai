# Staging Environment Setup Guide

This guide will help you set up a staging environment for testing changes before deploying to production.

## Why Use Staging?

- **Test changes safely** before production
- **Preview features** with real data (sanitized)
- **Catch bugs** before users see them
- **Demo to stakeholders** without affecting production
- **Test integrations** with external services

---

## Method 1: Vercel Branch Deployments (Recommended)

Vercel automatically creates preview deployments for every branch. Let's set up a dedicated staging branch.

### Step 1: Create Staging Branch

```bash
# From your main/master branch
git checkout -b staging
git push -u origin staging
```

### Step 2: Configure Staging in Vercel

1. Go to Vercel Dashboard → Your Project → Settings
2. Navigate to "Git" section
3. Set "Production Branch" to `master` (or `main`)
4. Enable "Automatic Deployments" for all branches

### Step 3: Set Up Staging Environment Variables

1. Go to Settings → Environment Variables
2. For each variable, configure environments:
   - **Production**: Only `master`/`main` branch
   - **Preview**: All other branches (including `staging`)
   - **Development**: Local development

3. Create staging-specific variables if needed:

```
# Staging database (separate from production)
DATABASE_URL=postgresql://staging-user:password@host:5432/staging-db

# Staging NextAuth URL
NEXTAUTH_URL=https://legalai-staging-abc123.vercel.app

# Same secrets can be reused
OPENAI_API_KEY=sk-...
NEXTAUTH_SECRET=same-secret-as-prod
```

### Step 4: Deploy Staging

```bash
# Push to staging branch
git checkout staging
git merge master  # Get latest changes
git push origin staging

# Vercel will automatically deploy
```

### Step 5: Access Staging

- Staging URL format: `https://legalai-git-staging-yourname.vercel.app`
- Check Vercel Dashboard → Deployments to find exact URL
- Bookmark it for easy access

### Workflow

```bash
# 1. Develop on feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"

# 2. Push and get preview deployment
git push origin feature/new-feature
# Vercel creates preview: https://legalai-git-feature-new-feature.vercel.app

# 3. Merge to staging for testing
git checkout staging
git merge feature/new-feature
git push origin staging
# Test on staging environment

# 4. If all good, merge to production
git checkout master
git merge staging
git push origin master
# Deploys to production
```

---

## Method 2: Separate Vercel Projects

Create completely separate projects for staging and production.

### Step 1: Create Staging Project

1. Go to Vercel Dashboard
2. Click "Add New" → "Project"
3. Import same GitHub repository
4. Name it: `legalai-staging`
5. Set Root Directory to `./`
6. Deploy

### Step 2: Configure Staging Project

1. **Environment Variables**: Add all required variables
2. **Domain**: Use default Vercel domain or set custom subdomain
3. **Git Branch**: Set to deploy from `staging` branch only

### Step 3: Set Up Separate Databases

```bash
# Create separate staging database in Neon/Supabase
# Name it: legalai-staging
# Use different DATABASE_URL for staging project
```

### Advantages
- Complete isolation from production
- Separate databases
- Different domains
- Independent scaling

### Disadvantages
- More complex to manage
- Costs more (if on paid plan)
- Need to update two projects

---

## Method 3: Environment-Based Configuration

Use environment variables to distinguish staging from production in code.

### Step 1: Add Environment Detection

Create `lib/env.ts`:

```typescript
export const ENV = {
  isProduction: process.env.VERCEL_ENV === 'production',
  isStaging: process.env.VERCEL_ENV === 'preview',
  isDevelopment: process.env.NODE_ENV === 'development',
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
}

export const config = {
  apiUrl: ENV.isProduction 
    ? 'https://legalai.vercel.app'
    : ENV.isStaging
    ? process.env.NEXT_PUBLIC_STAGING_URL
    : 'http://localhost:3000',
  
  features: {
    // Enable/disable features per environment
    enableAnalytics: ENV.isProduction,
    enableDebugMode: !ENV.isProduction,
    enableBetaFeatures: ENV.isStaging,
  }
}
```

### Step 2: Use in Your App

```typescript
import { ENV, config } from '@/lib/env'

// Conditional feature flags
if (config.features.enableBetaFeatures) {
  // Show beta features only in staging
}

// Environment-specific API calls
fetch(`${config.apiUrl}/api/data`)

// Debug logging
if (ENV.isStaging || ENV.isDevelopment) {
  console.log('Debug info:', data)
}
```

---

## Staging Database Setup

### Option A: Separate Staging Database (Recommended)

```bash
# Create a new database in Neon/Supabase
# Name: legalai-staging

# In Vercel, set for Preview environment:
DATABASE_URL=postgresql://staging-user:password@staging-host:5432/staging-db

# Push schema to staging database
vercel env pull .env.staging
npx prisma db push
```

### Option B: Shared Database with Prefixes

Not recommended, but if needed:

```prisma
// prisma/schema.prisma
model User {
  id String @id @default(cuid())
  // ... fields ...
  
  @@map("users") // table name
}
```

---

## Testing on Staging

### Pre-Production Testing Checklist

- [ ] All features work correctly
- [ ] Authentication flows work
- [ ] Database operations succeed
- [ ] File uploads work
- [ ] API integrations work
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Mobile responsive
- [ ] Cross-browser testing
- [ ] Load testing (if needed)

### Automated Testing Script

Create `scripts/test-staging.sh`:

```bash
#!/bin/bash

STAGING_URL="https://your-staging-url.vercel.app"

echo "🧪 Testing staging environment..."

# Test health endpoint
echo "Testing health check..."
curl -f $STAGING_URL/api/health || echo "❌ Health check failed"

# Test authentication
echo "Testing auth endpoints..."
curl -f $STAGING_URL/api/auth/signin || echo "❌ Auth failed"

# Test API endpoints
echo "Testing API endpoints..."
curl -f $STAGING_URL/api/cases || echo "❌ Cases API failed"

echo "✅ Staging tests complete!"
```

---

## Staging Workflow Best Practices

### 1. Branch Strategy

```
main/master (production)
  └── staging (pre-production)
      ├── feature/new-feature
      ├── feature/another-feature
      └── bugfix/fix-issue
```

### 2. Deployment Pipeline

```
Local Development
    ↓
Feature Branch (Preview Deployment)
    ↓
Staging Branch (Staging Environment)
    ↓
Main Branch (Production)
```

### 3. Testing Sequence

1. **Local**: `npm run dev` - Basic functionality
2. **Preview**: Feature branch - Specific feature testing
3. **Staging**: Staging branch - Full integration testing
4. **Production**: Main branch - Final deployment

### 4. Data Management

- **Use staging database** with sanitized production data
- **Never test with real user data** in staging
- **Reset staging database** regularly
- **Use seed data** for consistent testing

### 5. Monitoring

- Set up separate monitoring for staging
- Enable verbose logging in staging
- Track staging deployments
- Monitor staging errors separately

---

## GitHub Branch Protection Rules

Protect your branches to enforce staging review:

### For Production Branch (main/master)

1. Go to GitHub → Settings → Branches
2. Add rule for `main`/`master`
3. Enable:
   - Require pull request reviews
   - Require status checks (CI/CD)
   - Require branches to be up to date
   - Include administrators

### For Staging Branch

1. Add rule for `staging`
2. Enable:
   - Require pull request reviews
   - Require status checks

---

## Environment URLs Reference

Keep track of your environments:

```
Production:  https://legalai.vercel.app
Staging:     https://legalai-git-staging.vercel.app
Preview:     https://legalai-git-feature-xxx.vercel.app (auto-generated)
Local:       http://localhost:3000
```

---

## Troubleshooting Staging Issues

### Staging Deployment Fails

```bash
# Check build logs
vercel logs --staging

# Pull staging env vars
vercel env pull .env.staging

# Test build locally
npm run build
```

### Database Connection Issues

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db push --preview-feature

# Check Prisma logs
DEBUG=prisma:* npm run build
```

### Environment Variables Not Working

1. Verify variables are set for "Preview" environment
2. Redeploy after changing variables
3. Check variable names match exactly

---

## Staging Environment Maintenance

### Weekly Tasks
- [ ] Review staging logs
- [ ] Clean up old preview deployments
- [ ] Update staging database with fresh test data
- [ ] Check for security updates

### Monthly Tasks
- [ ] Review staging costs
- [ ] Audit staging environment variables
- [ ] Update staging documentation
- [ ] Performance testing

---

## Quick Commands Reference

```bash
# Deploy to staging
git checkout staging
git merge main
git push origin staging

# Create preview deployment
git checkout -b feature/new-feature
git push origin feature/new-feature

# Promote staging to production
git checkout main
git merge staging
git push origin main

# Pull staging env vars
vercel env pull .env.staging

# View staging logs
vercel logs --staging

# List all deployments
vercel ls
```

---

## Next Steps

1. ✅ Set up staging branch
2. ✅ Configure environment variables
3. ✅ Deploy to staging
4. ✅ Test thoroughly
5. ✅ Document staging URL
6. ✅ Train team on staging workflow

---

**Your staging environment is now ready! 🚀**

