# 🏠 Local Development Setup Guide

This guide explains how to run the app locally with separate environment from Vercel production.

---

## 🎯 Two Separate Environments

### Local Development
- Runs on: `http://localhost:3000`
- Uses: `.env.local` file
- Database: Your choice (see options below)
- For: Development and testing

### Vercel Production  
- Runs on: `https://your-app.vercel.app`
- Uses: Vercel Dashboard environment variables
- Database: Neon PostgreSQL (production)
- For: Live users

---

## 🔧 Setup Local Development

### Step 1: Configure .env.local

The `.env.local` file is already created. Edit it to add your OpenAI API key:

```bash
# Open in your editor
nano .env.local
# or
code .env.local
```

**Required: Add your OpenAI API key:**
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### Step 2: Choose Your Local Database

You have 3 options for local development:

#### Option A: Share Production Database (Simplest)

✅ **Already configured!** Uses the same Neon database.

**Pros:**
- No setup needed
- Same data as production
- Test with real data

**Cons:**
- Shares data with production (be careful!)
- Changes affect production

**Current setting in .env.local:**
```env
DATABASE_URL=postgresql://neondb_owner:npg_5x9SwiulhvPQ@ep-muddy-hall-add3qe8e-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

#### Option B: Separate Dev Database (Recommended)

Create a second Neon database just for development.

**Steps:**
1. Go to [console.neon.tech](https://console.neon.tech)
2. Click "Create new project"
3. Name it: `legalai-dev`
4. Copy the connection string
5. Update `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:pass@ep-dev-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

**Pros:**
- Separate dev and production data
- Safe to experiment
- Still cloud-based (no local PostgreSQL needed)

---

#### Option C: Local PostgreSQL (Advanced)

Run PostgreSQL on your machine.

**Steps:**

1. **Install PostgreSQL:**
   ```bash
   # macOS with Homebrew
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create database:**
   ```bash
   psql postgres
   CREATE DATABASE legalai_dev;
   \q
   ```

3. **Update .env.local:**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/legalai_dev
   ```

**Pros:**
- Complete isolation
- Works offline
- Full control

**Cons:**
- Need to install PostgreSQL
- More setup required

---

### Step 3: Initialize Database

After choosing your database option:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) View your database
npx prisma studio
```

### Step 4: Run Development Server

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📂 Environment Files

### .env.local (Local - YOU manage this)
```
✅ Used for: npm run dev
✅ Location: Project root
✅ Git: Ignored (in .gitignore)
✅ Edit: Manually with text editor
```

### Vercel Dashboard (Production - Vercel manages this)
```
✅ Used for: Vercel deployments
✅ Location: Vercel dashboard
✅ Git: Not in repository
✅ Edit: Via Vercel Settings → Environment Variables
```

---

## 🔐 Environment Variables Reference

### Local (.env.local)
```env
OPENAI_API_KEY=sk-your-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generated-secret
DATABASE_URL=postgresql://... (your choice from options above)
```

### Vercel (Dashboard)
```env
OPENAI_API_KEY=sk-your-key
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=same-secret
DATABASE_URL=postgresql://... (production Neon database)
```

---

## 🧪 Testing Your Setup

### 1. Start Dev Server
```bash
npm run dev
```

Should see:
```
✓ Ready in 2.1s
○ Local: http://localhost:3000
```

### 2. Test Database Connection

```bash
npx prisma studio
```

Should open browser at `http://localhost:5555` showing your database.

### 3. Test Application

1. Visit [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up"
3. Create test account
4. Should successfully create account ✅

---

## 🔄 Switching Between Environments

### Work Locally
```bash
# Uses .env.local automatically
npm run dev
```

### Deploy to Production
```bash
# Commit changes
git add .
git commit -m "Your changes"
git push origin master

# Vercel auto-deploys
# Uses Vercel dashboard environment variables
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"

**Check:**
1. DATABASE_URL is set in `.env.local`
2. Connection string starts with `postgresql://`
3. Database exists and is accessible

**Test connection:**
```bash
npx prisma db push
```

### "OpenAI API error"

**Check:**
1. OPENAI_API_KEY is set in `.env.local`
2. Key starts with `sk-`
3. Key is active in OpenAI dashboard

**Test:**
```bash
# Verify env var is loaded
node -e "console.log(process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing')"
```

### "Changes not reflecting"

**Solution:**
```bash
# Restart dev server
# Press Ctrl+C to stop
# Then run again:
npm run dev
```

### ".env.local not loading"

**Check:**
1. File is named exactly `.env.local` (not `.env-local` or `env.local`)
2. File is in project root (same folder as `package.json`)
3. Restart dev server after creating/editing

---

## 💡 Best Practices

### ✅ DO:
- Use `.env.local` for local development
- Keep separate dev and production databases (Option B)
- Restart dev server after changing `.env.local`
- Test locally before deploying to Vercel

### ❌ DON'T:
- Commit `.env.local` to git (it's ignored)
- Share your `.env.local` file
- Use production database for risky experiments
- Put secrets in code files

---

## 📊 Environment Comparison

| Feature | Local (.env.local) | Vercel (Dashboard) |
|---------|-------------------|-------------------|
| **URL** | http://localhost:3000 | https://your-app.vercel.app |
| **Database** | Your choice | Neon production |
| **Config File** | .env.local | Vercel dashboard |
| **Git Tracked** | No (ignored) | No (separate) |
| **Auto-reload** | Yes (dev server) | No (redeploy needed) |
| **Usage** | Development | Production |

---

## 🚀 Quick Start Commands

```bash
# First time setup
cp .env.example .env.local  # If you have an example file
nano .env.local             # Add your OPENAI_API_KEY
npx prisma generate
npx prisma db push
npm run dev

# Daily development
npm run dev                 # Start dev server
npx prisma studio           # View database
npm run build               # Test production build

# Before deploying
npm run build               # Make sure it builds
git add .
git commit -m "Changes"
git push origin master      # Auto-deploys to Vercel
```

---

## ✅ Verification Checklist

Local development is working if:
- [ ] `npm run dev` starts without errors
- [ ] Can visit http://localhost:3000
- [ ] Can create account
- [ ] Can sign in
- [ ] AI chat works
- [ ] `npx prisma studio` opens database viewer

---

## 📞 Need Help?

Common issues:
1. **Database errors** → Check DATABASE_URL format
2. **OpenAI errors** → Check OPENAI_API_KEY is set
3. **Auth errors** → Check NEXTAUTH_SECRET and NEXTAUTH_URL
4. **Changes not applying** → Restart dev server

---

**You're all set for local development! 🎉**

Run `npm run dev` and start building!

