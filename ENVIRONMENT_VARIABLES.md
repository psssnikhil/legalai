# Environment Variables Configuration Guide

Complete reference for all environment variables used in the Legal AI application.

## Required Environment Variables

### 🔑 OpenAI API

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**Where to get it:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create account
3. Click "Create new secret key"
4. Copy and save (you won't see it again)

**Notes:**
- Required for all AI features
- Keep it secret and secure
- Monitor usage at OpenAI dashboard
- Set spending limits if needed

---

### 🔐 NextAuth Configuration

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

**NEXTAUTH_URL:**
- Local: `http://localhost:3000`
- Production: `https://your-app.vercel.app`
- Staging: `https://your-app-staging.vercel.app`

**NEXTAUTH_SECRET:**
Generate using:
```bash
openssl rand -base64 32
```

Or online: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

**Notes:**
- Use different secrets for production and development
- Update NEXTAUTH_URL after first deployment
- Must match exactly (no trailing slash)

---

### 🗄️ Database Configuration

```bash
# Development (SQLite - Not for production!)
DATABASE_URL="file:./prisma/dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname:5432/database?sslmode=require"
```

**PostgreSQL Providers:**

**Option 1: Neon (Recommended)**
```bash
DATABASE_URL="postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```
- Free tier: 500MB storage
- Serverless, instant scaling
- Get it: [neon.tech](https://neon.tech)

**Option 2: Supabase**
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```
- Free tier: 500MB storage
- Additional features (auth, storage)
- Get it: [supabase.com](https://supabase.com)

**Option 3: Vercel Postgres**
```bash
# Automatically set by Vercel
DATABASE_URL="postgresql://..."
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```
- Integrated with Vercel
- Pay as you go
- Get it: Vercel Dashboard → Storage → Postgres

**Notes:**
- **NEVER** use SQLite in production (Vercel doesn't support it)
- Use connection pooling for serverless: `?connection_limit=1`
- Enable SSL: `?sslmode=require`
- Keep separate databases for staging and production

---

## Optional Environment Variables

### ☁️ AWS S3 Configuration (Optional)

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=legal-ai-documents
AWS_S3_REGION=us-east-1
```

**When to use:**
- If you want to store uploaded documents in S3
- For production file storage at scale
- For better performance and reliability

**How to get:**
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to IAM → Users
3. Create new user with S3 permissions
4. Create access keys
5. Create S3 bucket
6. Configure bucket permissions

**Alternative:**
If you don't configure S3, documents will be stored temporarily in memory (not persisted across deployments).

---

## Setting Environment Variables

### Local Development

1. **Create `.env.local` file:**
```bash
cp .env.example .env.local
```

2. **Add your values:**
```bash
# .env.local
OPENAI_API_KEY=sk-...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret
DATABASE_URL="file:./prisma/dev.db"
```

3. **Never commit `.env.local`:**
Already in `.gitignore`

---

### Vercel Production

**Method 1: Vercel Dashboard (Recommended)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. For each variable:
   - Enter **Name** (e.g., `OPENAI_API_KEY`)
   - Enter **Value** (e.g., `sk-...`)
   - Select environments:
     - ✅ **Production** (main/master branch)
     - ✅ **Preview** (other branches)
     - ✅ **Development** (local development)
5. Click **Save**
6. **Redeploy** your application

**Method 2: Vercel CLI**

```bash
# Add a single variable
vercel env add OPENAI_API_KEY

# Pull variables to local
vercel env pull .env.production.local

# List all variables
vercel env ls
```

---

### GitHub Actions

Add secrets for CI/CD:

1. Go to GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

```
VERCEL_TOKEN         # Get from Vercel → Account Settings → Tokens
VERCEL_ORG_ID        # Get from Vercel project settings
VERCEL_PROJECT_ID    # Get from Vercel project settings
OPENAI_API_KEY       # Your OpenAI API key (for build testing)
```

To get Vercel IDs:
```bash
vercel project ls
```

---

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./prisma/dev.db"
```

### Staging
```bash
NODE_ENV=production
NEXTAUTH_URL=https://legalai-staging.vercel.app
DATABASE_URL="postgresql://user:pass@staging-host:5432/staging-db"
```

### Production
```bash
NODE_ENV=production
NEXTAUTH_URL=https://legalai.vercel.app
DATABASE_URL="postgresql://user:pass@prod-host:5432/prod-db"
```

---

## Security Best Practices

### ✅ DO:
- Use strong, randomly generated secrets
- Keep different secrets for dev/staging/prod
- Rotate secrets regularly (every 90 days)
- Use environment variables (never hardcode)
- Use a password manager to store secrets
- Review who has access to secrets
- Monitor API usage and spending

### ❌ DON'T:
- Never commit secrets to git
- Never share secrets in Slack/email
- Never use the same secret across environments
- Never expose secrets to client-side code
- Never log secrets in console/files
- Never store secrets in screenshots

---

## Verifying Environment Variables

### Local Verification

Create `scripts/check-env.js`:

```javascript
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
];

console.log('🔍 Checking environment variables...\n');

let missing = [];
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    missing.push(varName);
  }
});

if (missing.length > 0) {
  console.log(`\n❌ Missing ${missing.length} required environment variable(s)`);
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
}
```

Run it:
```bash
node scripts/check-env.js
```

### Production Verification

Add to `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    openai: !!process.env.OPENAI_API_KEY,
    nextauth: !!process.env.NEXTAUTH_SECRET,
    database: !!process.env.DATABASE_URL,
  };

  const allOk = Object.values(checks).every(check => check);

  return NextResponse.json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
}
```

Test it:
```bash
curl https://your-app.vercel.app/api/health
```

---

## Troubleshooting

### "Environment variable is undefined"

**Solution:**
1. Verify variable is set in Vercel Dashboard
2. Check spelling matches exactly
3. Redeploy after adding variables
4. Clear cache: Settings → Data Cache → Clear

### "Database connection failed"

**Solution:**
1. Verify DATABASE_URL format is correct
2. Check database accepts connections from Vercel
3. Test connection locally:
```bash
npx prisma db push --preview-feature
```
4. Add connection pooling: `?connection_limit=1`

### "NextAuth configuration error"

**Solution:**
1. Verify NEXTAUTH_URL matches deployment URL exactly
2. Ensure no trailing slash
3. Check NEXTAUTH_SECRET is set
4. Clear cookies and try again

### "OpenAI API key invalid"

**Solution:**
1. Verify key starts with `sk-`
2. Check key is active in OpenAI dashboard
3. Ensure no extra spaces or quotes
4. Test key locally first

---

## Environment Variables Template

Save this as your reference:

```bash
# ==============================================
# REQUIRED VARIABLES
# ==============================================

# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# ==============================================
# OPTIONAL VARIABLES
# ==============================================

# AWS S3 (if using S3 for document storage)
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET_NAME=legal-ai-documents
AWS_S3_REGION=us-east-1

# ==============================================
# AUTO-SET BY VERCEL (DON'T MANUALLY SET)
# ==============================================

# NODE_ENV=production
# VERCEL=1
# VERCEL_ENV=production
# VERCEL_URL=your-app.vercel.app
```

---

## Quick Commands

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Test database connection
npx prisma db push

# Check Prisma Client
npx prisma generate

# Pull Vercel env vars
vercel env pull

# Add env var via CLI
vercel env add VARIABLE_NAME

# List all env vars
vercel env ls

# Remove env var
vercel env rm VARIABLE_NAME production
```

---

## Need Help?

- **Vercel Docs**: [vercel.com/docs/environment-variables](https://vercel.com/docs/environment-variables)
- **NextAuth Docs**: [next-auth.js.org/configuration/options](https://next-auth.js.org/configuration/options)
- **Prisma Docs**: [prisma.io/docs/reference/database-reference/connection-urls](https://www.prisma.io/docs/reference/database-reference/connection-urls)

---

✅ **All environment variables configured? You're ready to deploy!**

