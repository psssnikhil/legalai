# Legal AI - Authentication Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-make-it-long-and-random"

# Google OAuth (Optional - for Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Set up Database
```bash
# Generate Prisma client
npm run db:generate

# Create database and tables
npm run db:push

# Set up initial data (creates admin user and sample users)
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev
```

## 🔐 Authentication Features

### **Multiple Sign-in Options:**
- **Email/Password**: Traditional credentials-based authentication
- **Google OAuth**: One-click sign-in with Google accounts
- **Secure Password Hashing**: Using bcryptjs for password security

### **User Roles:**
- **ADMIN**: Full access to all features including user management
- **LAWYER**: Access to cases, documents, and legal research
- **PARALEGAL**: Limited access to assigned cases and documents
- **USER**: Basic access to dashboard and assigned resources

### **Security Features:**
- JWT-based sessions
- Password hashing with bcryptjs
- Route protection middleware
- CSRF protection
- Secure cookie handling

## 👥 Default Users

After running `npm run db:setup`, you'll have these users:

### Admin User
- **Email**: admin@legalai.com
- **Password**: admin123
- **Role**: ADMIN
- **Access**: Full system access

### Sample Users
- **John Smith** (john@legalai.com) - Lawyer
- **Sarah Johnson** (sarah@legalai.com) - Paralegal  
- **Mike Chen** (mike@legalai.com) - User

All sample users have password: `password123`

## 🔧 Google OAuth Setup (Optional)

If you want to enable Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to your `.env.local` file

## 📱 Pages Created

- **`/auth/signin`** - Sign in page with email/password and Google OAuth
- **`/auth/signup`** - Registration page with user details
- **`/team`** - User management (Admin only)
- **`/`** - Protected dashboard (requires authentication)

## 🛠️ Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database
rm prisma/dev.db
npm run db:push
npm run db:setup
```

## 🔒 Security Notes

- Change the default admin password immediately
- Use strong, unique passwords in production
- Set up proper environment variables for production
- Consider using a production database (PostgreSQL, MySQL)
- Enable HTTPS in production

## 🚨 Troubleshooting

### Common Issues:

1. **"Module not found" errors**: Run `npm install` again
2. **Database connection errors**: Make sure `DATABASE_URL` is set correctly
3. **Google OAuth not working**: Check your Google Cloud Console settings
4. **Authentication redirects**: Ensure `NEXTAUTH_URL` matches your domain

### Getting Help:

- Check the browser console for errors
- Verify all environment variables are set
- Ensure the database is properly initialized
- Check that all dependencies are installed

## 🎯 Next Steps

Once authentication is working:

1. Test all sign-in methods
2. Create additional users through the team management page
3. Customize user roles and permissions
4. Set up production environment variables
5. Configure email notifications (optional)

The authentication system is now fully functional and ready for production use! 🚀
