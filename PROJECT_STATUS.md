# Legal AI — Project Status & Deployment Guide

> Last updated: June 2026  
> Branch: `simplify/v2`  
> Stack: Next.js 14 · PostgreSQL (Neon) · OpenAI Assistants API · Google Drive · Vercel

---

## What Has Been Built

### 1. App Simplification
The original app had 11 sidebar items and complex overlapping AI features. It has been simplified to 6 focused items:

| Before | After |
|---|---|
| Dashboard, AI Case Intake, AI Case Assistant, AI Drafting, Dictation, Cases, Court Diary, Clients, Documents, Legal Library, Legal Research, Company Settings | **Dashboard, Cases, Clients, Court Diary, Dictation, Settings** |

Removed pages now redirect to `/cases` so no broken links.

### 2. Case Detail Page (`/cases/[id]`)
Each case has a dedicated page with 4 tabs:
- **Overview** — inline edit (title, status, priority, type, assignee), client info, quick actions
- **Documents** — upload/download/delete files per case
- **Hearings** — schedule and track court hearings per case
- **AI Chat** — GPT-powered assistant with full case context

### 3. OpenAI Assistants API Integration
Replaced the manual RAG pipeline entirely. No more embedding code, vector stores to manage, or chunking logic to maintain.

- Each **case** gets its own OpenAI **Vector Store** (auto-indexes uploaded documents)
- Each **chat session** gets its own **Thread** (full conversation history managed by OpenAI)
- **Documents uploaded to a case** are automatically sent to OpenAI and indexed
- Falls back gracefully to plain `gpt-4o-mini` chat if Assistants API is unavailable
- Helper: `lib/openai-assistant.ts`

### 4. Google Drive Integration (Service Account)
Files are stored in your company Google Drive — not on the app server.

- Uses a **Google Service Account** (permanent access, no token expiry)
- When a case is created, a Drive folder is created inside your company folder: `Legal AI Cases / Case - [Title]`
- Files uploaded to a case go to that Drive folder automatically
- Files are also indexed in OpenAI vector store simultaneously
- Helper: `lib/google-drive-service.ts`

### 5. Dashboard Simplified
- Welcome header with today's date
- 4 stat cards: Total Cases, Active Cases, Upcoming Hearings, Total Clients
- Recent Cases list (last 5, clickable to case detail)
- Upcoming Hearings list (next 5)
- Quick action buttons

### 6. Dictation (Unchanged — already solid)
- Real-time speech recognition (Web Speech API)
- AI auto-correction with legal formatting mode
- Toggle between raw and corrected text
- Multi-language support (English, Hindi, Tamil, Telugu, and more)
- Powered by `/api/dictation-correct` using OpenAI

### 7. Settings Page
- Profile view (name, email from session)
- Preferences placeholder (expandable later)

### 8. Database Schema Updates
New fields added to support integrations:
- `Case.openaiVectorStoreId` — links case to OpenAI vector store
- `Case.googleDriveFolderId` / `Case.googleDriveFolderUrl` — Drive folder per case
- `ChatSession.openaiThreadId` — links chat session to OpenAI thread
- `Document.openaiFileId` — OpenAI file ID after upload
- `Document.googleDriveFileId` / `Document.googleDriveFileUrl` — Drive file link

---

## Current Local Setup

### Running locally with SQLite
The app runs locally using SQLite (`prisma/dev.db`). This is intentional — no external DB needed for development.

```bash
# Local credentials in .env.local
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="xGt56OJIXNGk7DfdT01ORDsgosYPAX7pRRAd51U357g="
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-proj-..."         # ✅ configured
GOOGLE_CLIENT_ID="..."               # ✅ configured
GOOGLE_CLIENT_SECRET="..."           # ✅ configured
GOOGLE_SERVICE_ACCOUNT_EMAIL="legal-ai-drive@legal-ai-india-497809.iam.gserviceaccount.com"  # ✅ configured
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="..."  # ✅ configured
GOOGLE_DRIVE_PARENT_FOLDER_ID="1MhhwXj9SiEvQBpTbgqslZfrMVprFQcO1"  # ✅ configured
```

### Local test credentials
- Email: `admin@legalai.com`
- Password: `admin123`

### Start dev server
```bash
cd legalai
npm run dev
# → http://localhost:3000
```

---

## Pending Steps to Deploy to Production

### Step 1 — Fix schema for PostgreSQL (2 min)
Before deploying, change one line in `prisma/schema.prisma`:

```prisma
// Change this:
provider = "sqlite"

// To this:
provider = "postgresql"
```

Also remove the comment line above it.

### Step 2 — Push code to GitHub (5 min)
From your machine:
```bash
git checkout simplify/v2
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin simplify/v2
```

> Note: Push from your other system/Git account as planned.

### Step 3 — Deploy to Vercel (10 min)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `/` (default)
4. Set **Framework Preset** to `Next.js` (auto-detected)
5. Set **Branch** to `simplify/v2`

**Add these Environment Variables in Vercel dashboard:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate |
| `NEXTAUTH_URL` | `https://YOUR-APP.vercel.app` (fill after first deploy) |
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_ASSISTANT_ID` | Leave blank for first deploy — fill after |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Your service account email |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Full PEM key from service account JSON (with `\n` line breaks) |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | `1MhhwXj9SiEvQBpTbgqslZfrMVprFQcO1` |

6. Click **Deploy**

> Vercel automatically runs `prisma generate && prisma db push && next build` (configured in `vercel.json`). The Neon schema is pushed on first deploy.

### Step 4 — After first deploy (5 min)

**4a. Get your Vercel URL**  
It will be something like `https://legalai-abc123.vercel.app`

**4b. Update NEXTAUTH_URL**  
In Vercel → Settings → Environment Variables → update `NEXTAUTH_URL` to your actual URL → Redeploy

**4c. Add Vercel URL to Google OAuth**  
Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth client → Add to Authorized Redirect URIs:
```
https://YOUR-APP.vercel.app/api/auth/callback/google
```

**4d. Get the OpenAI Assistant ID**  
After first deploy, open the app, go to any case, send a chat message. Check Vercel logs — you'll see:
```
[OpenAI] Created assistant: asst_xxxxxxxxxxxx
```
Copy that ID → add `OPENAI_ASSISTANT_ID=asst_xxxx` to Vercel env vars → **Redeploy once more**

This ensures all users share one assistant (saves cost and keeps context consistent).

### Step 5 — Create user accounts (5 min)
For each team member (up to 4-5 users):

**Option A — Email/password:**  
Visit `https://YOUR-APP.vercel.app/auth/signup` and create accounts manually.

**Option B — Google sign-in:**  
They just click "Sign in with Google" using their company Google account. Account is auto-created.

> Recommended: disable public signup after creating all accounts (ask the developer to add a signup whitelist).

---

## Architecture Overview

```
Browser (4-5 users)
    │
    ▼
Vercel (Next.js 14 — serverless)
    │
    ├──► Neon PostgreSQL
    │     All metadata: cases, clients, hearings,
    │     document records, chat history
    │
    ├──► OpenAI Assistants API
    │     Per-case vector stores (document indexing)
    │     Per-session threads (conversation history)
    │     gpt-4o-mini for responses
    │
    ├──► Google Drive (Service Account)
    │     Per-case folders in company Drive
    │     All uploaded files stored here
    │     Accessible directly from Drive too
    │
    └──► Google OAuth
          User authentication
          Company Google accounts sign in directly
```

---

## Cost Estimate (4-5 users)

| Service | Free Tier | When you'd pay |
|---|---|---|
| Vercel | 100GB bandwidth/month | Never at this scale |
| Neon | 0.5GB PostgreSQL | ~$19/month if DB exceeds 0.5GB (unlikely for months) |
| OpenAI | Pay per token | ~$2–10/month depending on chat usage |
| Google Drive | 15GB company account | Upgrade Workspace if needed (~$3/user/month) |
| Google OAuth | Free | Never |

**Expected total: $2–10/month**

---

## File Structure Reference

```
legalai/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── cases/
│   │   ├── page.tsx                # Cases list
│   │   └── [id]/page.tsx           # Case detail (tabs)
│   ├── clients/page.tsx
│   ├── court-diary/page.tsx
│   ├── dictation/page.tsx
│   ├── settings/page.tsx
│   └── api/
│       ├── cases/
│       │   ├── route.ts            # Cases CRUD + single case lookup
│       │   ├── chat/route.ts       # AI chat (Assistants API)
│       │   └── drive/route.ts      # Google Drive folder creation
│       ├── documents/
│       │   ├── route.ts
│       │   └── upload/route.ts     # Upload → Drive + OpenAI
│       ├── hearings/
│       └── clients/
├── components/
│   └── Sidebar.tsx                 # Simplified 6-item nav
├── lib/
│   ├── openai-assistant.ts         # OpenAI Assistants API wrapper
│   ├── google-drive-service.ts     # Google Drive service account
│   ├── auth.ts                     # NextAuth config (Google + credentials)
│   └── prisma.ts
├── prisma/
│   └── schema.prisma               # DB schema (switch to postgresql for prod)
├── .env.local                      # Local credentials (gitignored)
├── .env.example                    # Template for all env vars
└── vercel.json                     # Vercel build config
```

---

## Quick Reference — Key Credentials

> These are stored in `.env.local` (never committed to Git)

| Key | Status |
|---|---|
| Neon DATABASE_URL | ✅ Ready |
| OpenAI API Key | ✅ Ready |
| Google OAuth Client ID/Secret | ✅ Ready |
| Google Service Account | ✅ Ready |
| Google Drive Folder ID | ✅ Ready |
| NEXTAUTH_SECRET | Generate fresh with `openssl rand -base64 32` |
| OPENAI_ASSISTANT_ID | Auto-generated on first deploy |
| NEXTAUTH_URL | Set to Vercel URL after deploy |
