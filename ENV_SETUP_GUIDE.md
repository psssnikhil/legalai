# 🔑 Environment Setup Guide - Critical for AI Features

## ⚠️ IMPORTANT: AI Features Won't Work Without This Setup!

Your Legal AI application **requires proper environment configuration** to function. Follow this guide carefully.

---

## 📋 Quick Setup (5 Minutes)

### Step 1: Create Environment File

Create a file named `.env.local` in your project root directory (`/Users/nikhilpentapalli/legalai/`):

```bash
touch .env.local
```

### Step 2: Add Required Variables

Copy and paste this into your `.env.local` file:

```env
# ========================================
# REQUIRED - OpenAI Configuration
# ========================================
OPENAI_API_KEY=sk-your-actual-openai-key-here

# ========================================
# REQUIRED - NextAuth Authentication
# ========================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-long-random-secret-here

# ========================================
# Database (Already Configured)
# ========================================
DATABASE_URL="file:./prisma/dev.db"

# ========================================
# OPTIONAL - AWS S3 Document Storage
# ========================================
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_S3_BUCKET_NAME=your_bucket_name
# AWS_S3_REGION=us-east-1
```

---

## 🔐 Getting Your API Keys

### 1. OpenAI API Key (REQUIRED) 🤖

The AI features **will not work** without this!

**Steps:**
1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Replace `sk-your-actual-openai-key-here` in `.env.local`

**Cost:** Pay-as-you-go based on usage
- GPT-4o-mini: ~$0.15 per 1M input tokens
- Typical chat message: ~$0.001 - $0.01

**Important:** 
- Keep your API key secret
- Never commit it to git
- Add billing limits in OpenAI dashboard to control costs

---

### 2. NextAuth Secret (REQUIRED) 🔒

Used for secure authentication.

**Option A - Generate with OpenSSL (Recommended):**
```bash
openssl rand -base64 32
```

**Option B - Generate with Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C - Use this temporary secret (Development Only):**
```
Jq8kW2nP9vR5xC3mF7tY1aL6bN4hD0sQ8zA9uE2wI5g=
```

Copy the generated string and replace `your-long-random-secret-here` in `.env.local`

---

### 3. AWS S3 (OPTIONAL) ☁️

Only needed if you want to store documents in AWS S3. Otherwise, documents are stored in the database.

**If you want S3 storage:**
1. Create AWS account at https://aws.amazon.com
2. Create an S3 bucket
3. Create IAM user with S3 access
4. Get Access Key ID and Secret Key
5. Uncomment the AWS lines in `.env.local` and add your credentials

**If you don't need S3:**
- Leave those lines commented out
- Documents will be stored in SQLite database (works fine for development)

---

## ✅ Verification Steps

After setting up your `.env.local`:

### 1. Check File Contents
```bash
cat .env.local
```

You should see your actual API key (not the placeholder).

### 2. Restart Development Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 3. Test AI Features

1. Go to http://localhost:3000
2. Sign in or create an account
3. Go to "AI Case Intake" from the sidebar
4. Type a message in the chat
5. If you see an AI response → ✅ Working!
6. If you see an error → ❌ Check your API key

---

## 🐛 Troubleshooting

### Issue: "I'm sorry, I encountered an error"

**Solution:** 
- Check that `OPENAI_API_KEY` is set correctly
- Verify the key starts with `sk-`
- Make sure you have credits in your OpenAI account
- Restart the development server

### Issue: "Unauthorized" or "Authentication Error"

**Solution:**
- Check that `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your local URL (usually http://localhost:3000)
- Clear browser cookies and try again

### Issue: Environment variables not loading

**Solution:**
- File must be named `.env.local` (not `.env.local.txt`)
- File must be in project root (same folder as `package.json`)
- No spaces around the `=` sign
- No quotes around values (unless they contain spaces)
- Restart the server after changes

### Issue: "OpenAI API key is required"

**Solution:**
- Your `.env.local` file is missing or not in the right location
- The OPENAI_API_KEY variable name is misspelled
- There are extra spaces in the file

---

## 💰 OpenAI Cost Management

### Estimated Costs (Development)
- **Per chat message:** ~$0.001 - $0.01
- **Per document analysis:** ~$0.05 - $0.20
- **Per case analysis:** ~$0.10 - $0.50

### Daily Budget Example
- 100 chat messages: ~$0.50 - $1.00
- 20 document analyses: ~$1.00 - $4.00
- 10 case analyses: ~$1.00 - $5.00
- **Total: ~$2.50 - $10.00 per day**

### Setting Up Budget Limits

1. Go to: https://platform.openai.com/account/billing/limits
2. Set a monthly budget limit (e.g., $50)
3. Enable email notifications
4. Monitor usage regularly

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore` (already configured)
- Use different API keys for development and production
- Rotate API keys periodically
- Set billing limits on OpenAI account
- Use strong, unique `NEXTAUTH_SECRET`

### ❌ DON'T:
- Never commit `.env.local` to git
- Never share your API keys publicly
- Never hardcode API keys in code
- Never use production keys in development

---

## 📝 Example Working Configuration

Here's what a working `.env.local` looks like:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-abc123xyz789...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=Jq8kW2nP9vR5xC3mF7tY1aL6bN4hD0sQ8zA9uE2wI5g=

# Database
DATABASE_URL="file:./prisma/dev.db"
```

---

## 🚀 Production Deployment

For production (Vercel, AWS, etc.):

1. **Never commit `.env.local`** to git
2. Set environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - AWS: Use AWS Systems Manager Parameter Store
   - Heroku: Settings → Config Vars

3. Use production OpenAI key (separate from development)
4. Change `NEXTAUTH_URL` to your production domain
5. Use PostgreSQL instead of SQLite:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

---

## ✅ Setup Complete Checklist

- [ ] Created `.env.local` file in project root
- [ ] Added valid OpenAI API key
- [ ] Generated and added NextAuth secret
- [ ] Verified DATABASE_URL is set
- [ ] Restarted development server
- [ ] Tested AI chat feature
- [ ] Tested document upload
- [ ] Set up OpenAI billing limits
- [ ] Confirmed no errors in browser console

---

## 📞 Need Help?

If you're still having issues:

1. **Check the browser console** (F12 → Console tab)
2. **Check terminal logs** where `npm run dev` is running
3. **Verify file location**: 
   ```bash
   ls -la .env.local
   ```
4. **Test API key directly**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

---

## 🎉 Success!

Once configured correctly, you'll have access to:
- ✅ AI-powered chat assistant
- ✅ Document analysis
- ✅ Case intake automation
- ✅ Legal research assistance
- ✅ Document drafting
- ✅ Case analysis with SWOT

**Your AI Legal Assistant is now ready to use!** 🚀

---

**Last Updated:** October 13, 2025  
**Version:** 1.1.0

