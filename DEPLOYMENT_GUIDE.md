# 🚀 Deployment Guide - Cloudinary SaaS Platform

## 📋 Pre-Deployment Checklist

### 1. **Environment Variables Setup**

Create these environment variables in your deployment platform (Vercel/Production):

```env
# Database
DATABASE_URL="your-production-postgresql-url"
DIRECT_URL="your-production-postgresql-direct-url"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Paymob Payment Gateway (for subscription payments)
PAYMOB_API_KEY="your-paymob-api-key"
PAYMOB_INTEGRATION_ID="your-integration-id"
PAYMOB_HMAC_SECRET="your-hmac-secret"
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"

# Resend (Email Service)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@your-domain.com"

# Encryption (for invitation tokens)
ENCRYPTION_KEY="your-32-character-encryption-key"

# Admin Access (optional - for emergency admin access)
ADMIN_SECRET="your-secret-admin-password"
```

---

### 2. **Files to Remove Before Deployment**

These files should be **deleted** as they are development-only documentation:

```bash
# Delete these markdown files
rm DEVELOPMENT_TASKS.md
rm ACTUAL_COMPLETION_STATUS.md
```

**Keep these files:**
- `README.md` - For GitHub repository documentation
- `.gitignore` - Essential for version control
- `package.json` - Required for dependencies
- All configuration files (next.config.ts, tsconfig.json, etc.)

---

### 3. **Code Cleanup Tasks**

#### A. Remove Console Logs (Optional but Recommended)

Console statements found in production code:

**Files with console.log/error:**
- `src/lib/usage-limits.ts` - Lines 24, 51, 56, 59, 93, 107, 137, 177, 203
- `src/lib/paymob.ts` - Lines 220, 251, 281
- `src/lib/notifications.ts` - Line 48
- `src/lib/invitation-tokens.ts` - Lines 127, 207, 216, 255, 289, 325, 367
- `src/lib/email.ts` - Line 137

**Action:** 
- Keep `console.error` statements for production error tracking
- Remove `console.log` debugging statements
- Consider using a proper logging service like Sentry or LogRocket

#### B. Verify No Hardcoded Secrets

```bash
# Check for potential hardcoded secrets
grep -r "api_key" src/
grep -r "password" src/
grep -r "secret" src/
```

Ensure all sensitive data uses environment variables.

---

### 4. **Database Setup**

#### Step 1: Setup Production Database
- Use **Neon PostgreSQL** or **Vercel Postgres**
- Get your `DATABASE_URL` and `DIRECT_URL`

#### Step 2: Run Migrations
```bash
# Set production DATABASE_URL in terminal or .env
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Optional) Seed initial data
npm run db:seed
```

#### Step 3: Verify Database Schema
```bash
# Check migration status
npx prisma migrate status

# Open Prisma Studio to verify
npm run db:studio
```

---

### 5. **Third-Party Service Configuration**

#### A. Clerk Authentication
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a production application
3. Configure:
   - Sign-in/Sign-up URLs
   - Redirect URLs to your production domain
   - Social login providers (if any)
4. Copy production API keys

#### B. Cloudinary
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Create a production cloud or use existing
3. Configure:
   - Upload presets
   - Transformation settings
   - Storage limits
4. Copy production API credentials

#### C. Paymob (Payment Gateway)
1. Go to [Paymob Dashboard](https://accept.paymob.com)
2. Switch to production mode
3. Configure:
   - Payment methods
   - Webhook URLs
   - Integration IDs
4. Copy production API keys

#### D. Resend (Email Service)
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Verify your domain for email sending
3. Create API key
4. Configure SPF/DKIM records in your DNS

---

### 6. **Deployment Platforms**

#### **Recommended: Vercel (Easiest)**

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure in Vercel Dashboard**
   - Go to your project settings
   - Add all environment variables
   - Set build command: `npm run build`
   - Set output directory: `.next`
   - Enable automatic deployments from main branch

3. **Database Connection**
   - Vercel works well with Neon, Supabase, or Vercel Postgres
   - Enable connection pooling for better performance

4. **Domain Setup**
   - Add custom domain in Vercel dashboard
   - Update DNS records
   - SSL is automatic

#### **Alternative: Railway/Render**

Similar process:
1. Connect GitHub repository
2. Add environment variables
3. Set build command
4. Deploy

---

### 7. **Build Configuration**

Your `next.config.ts` should include:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
}
```

---

### 8. **Post-Deployment Testing**

After deployment, test these critical features:

#### Authentication
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Sign out
- [ ] Password reset

#### Media Upload
- [ ] Single video upload
- [ ] Single image upload
- [ ] Bulk video upload
- [ ] Bulk image upload
- [ ] Background upload continues while browsing

#### Media Management
- [ ] View media library
- [ ] Delete media
- [ ] Bulk delete
- [ ] Download media
- [ ] Bulk download

#### Sharing
- [ ] Create share link
- [ ] Access shared media (logged out)
- [ ] Download from share page
- [ ] Open in new tab from share page

#### Subscriptions
- [ ] View plans
- [ ] Subscribe to paid plan
- [ ] Payment processing (Paymob)
- [ ] Usage tracking updates
- [ ] Plan limits enforced

#### Admin Features
- [ ] Admin dashboard access
- [ ] User management
- [ ] Subscription management

#### Notifications
- [ ] Usage warnings
- [ ] Upload success/failure
- [ ] Invitation notifications

---

### 9. **Performance Optimization**

#### A. Enable Caching
```typescript
// In next.config.ts
const nextConfig = {
  // ... other config
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ],
}
```

#### B. Optimize Images
- All images are already served from Cloudinary
- Cloudinary automatically optimizes and resizes

#### C. Database Connection Pooling
- Use Prisma Data Proxy or connection pooling
- Set `connection_limit` in DATABASE_URL

---

### 10. **Monitoring & Error Tracking**

#### Recommended Services:
1. **Sentry** - Error tracking
   ```bash
   npm install @sentry/nextjs
   ```

2. **Vercel Analytics** - Performance monitoring (built-in)

3. **LogRocket** - Session replay and debugging

4. **Cloudinary Analytics** - Media usage statistics

---

### 11. **Security Checklist**

- [ ] All `.env` files are in `.gitignore`
- [ ] No hardcoded API keys in code
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Clerk authentication properly configured
- [ ] API routes protected with auth middleware
- [ ] Rate limiting enabled (if needed)
- [ ] CORS properly configured
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)

---

### 12. **Backup Strategy**

#### Database Backups
- Neon provides automatic backups
- Configure additional backup schedule if needed

#### Media Backups
- Cloudinary stores all media
- Enable versioning in Cloudinary settings

---

## 🎯 Quick Deployment Commands

```bash
# 1. Clean install dependencies
rm -rf node_modules
rm package-lock.json
npm install

# 2. Delete development docs
rm DEVELOPMENT_TASKS.md ACTUAL_COMPLETION_STATUS.md

# 3. Build for production
npm run build

# 4. Test production build locally
npm start

# 5. Deploy to Vercel
vercel --prod
```

---

## 📞 Support & Troubleshooting

### Common Issues:

**Build Fails:**
- Check all environment variables are set
- Verify DATABASE_URL is accessible
- Check Prisma schema is up to date

**Authentication Not Working:**
- Verify Clerk keys
- Check redirect URLs in Clerk dashboard
- Ensure NEXT_PUBLIC variables are set

**Database Connection Issues:**
- Check DATABASE_URL format
- Verify database is accessible from deployment platform
- Enable connection pooling

**Upload Fails:**
- Verify Cloudinary credentials
- Check upload presets in Cloudinary
- Verify file size limits

---

## 🎉 Deployment Complete!

Once deployed:
1. Test all features thoroughly
2. Monitor error logs
3. Check performance metrics
4. Set up monitoring alerts
5. Create admin user: `node scripts/create-admin.js`

---

**Need Help?** Check the logs in:
- Vercel Dashboard → Logs
- Clerk Dashboard → Logs
- Cloudinary Dashboard → Usage

**Good luck with your deployment! 🚀**
