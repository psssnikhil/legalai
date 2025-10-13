# 🔧 Debug Vercel Authentication Issues

## ✅ Checklist to Fix Login Issues on Vercel

### 1️⃣ Check NEXTAUTH_URL is Correct

**Problem:** If NEXTAUTH_URL doesn't match your actual deployment URL, NextAuth will fail silently.

**Fix:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your deployment URL (e.g., `legalai-g94wysqd0-p...vercel.app`)
3. Go to **Settings** → **Environment Variables**
4. Find **NEXTAUTH_URL**
5. Make sure it's EXACTLY your Vercel URL:
   ```
   https://legalai-g94wysqd0-psssnikhil-gmailcoms-projects.vercel.app
   ```
   (Use YOUR actual URL from Vercel)

⚠️ **Important:**
- NO trailing slash
- Must be `https://` (not `http://`)
- Must match EXACTLY

**After updating, REDEPLOY:**
- Go to Deployments → Click "..." → Redeploy

---

### 2️⃣ Verify All Environment Variables are Set

Go to **Settings** → **Environment Variables** and confirm these exist:

```
✅ DATABASE_URL        (PostgreSQL connection string)
✅ OPENAI_API_KEY      (starts with sk-)
✅ NEXTAUTH_SECRET     (random string)
✅ NEXTAUTH_URL        (your Vercel URL)
```

Make sure ALL are checked for:
- ☑️ Production
- ☑️ Preview
- ☑️ Development

---

### 3️⃣ Check Database Connection from Vercel

**Test if Vercel can reach your Neon database:**

1. Go to your Neon Console: [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Go to **Settings** → **IP Allow**
4. Make sure it's set to **"Allow all"** (or add Vercel IPs)

**Or check in SQL Editor:**
```sql
SELECT * FROM "User" LIMIT 5;
```

If you see users, database connection is working.

---

### 4️⃣ View Real-Time Logs

1. In Vercel Dashboard → Your Project
2. Click **Logs** tab (or **Runtime Logs**)
3. Try logging in
4. Watch for errors like:
   - "NEXTAUTH_URL mismatch"
   - "Database connection failed"
   - "Invalid credentials"

---

### 5️⃣ Test with Fresh Browser

Sometimes cookies get stuck:

1. Open **Incognito/Private window**
2. Go to your Vercel URL
3. Try logging in
4. Or clear cookies for your Vercel domain

---

## 🔧 Quick Fix Commands

### Get Your Exact Vercel URL
```bash
vercel ls
```

### Update NEXTAUTH_URL via CLI
```bash
# Get your production URL first
vercel ls

# Then set NEXTAUTH_URL
vercel env add NEXTAUTH_URL production
# When prompted, enter: https://your-actual-url.vercel.app
```

### Redeploy
```bash
vercel --prod
```

---

## 🐛 Common Errors and Fixes

### Error: "Callback URL Mismatch"

**Cause:** NEXTAUTH_URL is wrong

**Fix:**
1. Get exact URL from Vercel Dashboard
2. Update NEXTAUTH_URL
3. Redeploy

### Error: "No session returned"

**Cause:** NEXTAUTH_SECRET not set or different between local and Vercel

**Fix:**
1. Copy NEXTAUTH_SECRET from your `.env.local`
2. Add to Vercel environment variables
3. Redeploy

### Error: Database connection timeout

**Cause:** Vercel can't reach Neon database

**Fix:**
1. Check DATABASE_URL is correct
2. Verify Neon allows connections from all IPs
3. Test connection in Neon console

---

## 📊 Debug Login Flow

### What Should Happen (Successful Login):
```
1. POST /api/auth/callback/credentials → 200 OK
2. GET /api/auth/session → 200 OK (with session data)
3. Redirect to dashboard → 200 OK
```

### What's Happening Now (Failed Login):
```
1. GET /auth/signin → 200 (load page)
2. POST /api/auth/callback/credentials → 302 (redirect back)
3. GET /auth/signin → 200 (back to signin page) ❌
```

This means authentication is failing at step 2.

---

## 🔍 Step-by-Step Debugging

### Step 1: Verify Environment Variables

Run this in your browser console on Vercel (while logged in to Vercel dashboard):

Or check via CLI:
```bash
vercel env ls
```

Should show:
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- OPENAI_API_KEY

### Step 2: Check Logs for Specific Error

1. Go to Vercel → Logs
2. Filter by "Error"
3. Try logging in
4. Look for error messages

### Step 3: Test Database Directly

```bash
# Pull your production env vars
vercel env pull .env.production

# Test database connection
export $(cat .env.production | xargs)
npx prisma studio
```

---

## ✅ Correct Configuration Example

### In Vercel Dashboard (Settings → Environment Variables):

```
DATABASE_URL
Value: postgresql://neondb_owner:npg_ncVNfp8TX0HK@ep-nameless-truth-add153jw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environments: ☑️ Production ☑️ Preview ☑️ Development

NEXTAUTH_URL
Value: https://legalai-g94wysqd0-psssnikhil-gmailcoms-projects.vercel.app
Environments: ☑️ Production ☑️ Preview ☑️ Development

NEXTAUTH_SECRET
Value: 2ee471b089a8cf4a2a260e2c8b07d260
Environments: ☑️ Production ☑️ Preview ☑️ Development

OPENAI_API_KEY
Value: sk-proj-...
Environments: ☑️ Production ☑️ Preview ☑️ Development
```

---

## 🚨 Emergency Fix

If nothing works, try this:

### 1. Generate New NextAuth Secret
```bash
openssl rand -base64 32
```

### 2. Update in Vercel
```bash
vercel env rm NEXTAUTH_SECRET production
vercel env add NEXTAUTH_SECRET production
# Paste the new secret
```

### 3. Update Local
```bash
# Update .env.local with same secret
```

### 4. Redeploy
```bash
vercel --prod
```

---

## 📞 Still Not Working?

Share these details:

1. **Your exact Vercel URL** (from `vercel ls`)
2. **Environment variables list** (from `vercel env ls` - without values)
3. **Error logs** from Vercel dashboard
4. **What happens when you try to login**

---

## 💡 Pro Tip: Use Vercel's Built-in Variables

Instead of hardcoding NEXTAUTH_URL, you can use Vercel's system variables:

In your code, you could use:
```typescript
// In production, use Vercel's URL
const url = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXTAUTH_URL
```

But for now, manually setting NEXTAUTH_URL is simpler.

---

**Most likely fix: Update NEXTAUTH_URL to match your exact Vercel deployment URL and redeploy! 🚀**

