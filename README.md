# 🎬 Sahab SaaS Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-2.7.0-3448C5?style=flat-square&logo=cloudinary)](https://cloudinary.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square)](https://clerk.com/)

A modern, full-stack SaaS platform for media management with advanced features including media upload, transformation, sharing, team collaboration, and subscription-based billing.

![Project Banner](./public/logo.png)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎥 Media Management
- **Single & Bulk Upload** - Upload videos and images individually or in bulk
- **Background Upload Processing** - Continue browsing while files upload
- **Media Library** - Organized view of all uploaded media with filtering
- **Bulk Operations** - Download or delete multiple files at once
- **Media Optimization** - Automatic compression and multiple resolutions
- **Smart Thumbnails** - Auto-generated thumbnails for videos and images

### 🔗 Sharing & Collaboration
- **Public Share Links** - Generate unique, shareable links for any media
- **View Tracking** - Monitor how many times shared content is viewed
- **Expiration Dates** - Set expiration for shared links
- **Custom Metadata** - Add titles and descriptions to shared content
- **Social Sharing** - One-click sharing to social platforms

### 👥 Team Management
- **Team Invitations** - Invite team members via encrypted email links
- **Role-Based Access** - Admin, Manager, and Member roles
- **Permission Control** - Granular permissions for team members
- **Invitation Tracking** - Monitor pending, accepted, and declined invitations

### 💳 Subscription System
- **Three-Tier Plans** - FREE, BASIC (999 EGP/month), and PRO (1999 EGP/month)
- **Usage Tracking** - Real-time monitoring of storage, uploads, and transformations
- **Plan Limits** - Enforced limits based on subscription tier
- **Usage Notifications** - Automatic alerts at 80% and 100% usage
- **Payment Integration** - Seamless Paymob payment gateway integration

### 📊 Analytics & Insights
- **Usage Dashboard** - Visual charts showing storage, uploads, and trends
- **Monthly Reports** - Detailed analytics by month and year
- **Plan Comparison** - Visual comparison of available plans
- **Payment History** - Complete transaction history

### 🔔 Notification System
- **Real-time Notifications** - Instant updates for important events
- **Multiple Types** - Upload status, usage warnings, team invites, payments
- **Action URLs** - Direct links to relevant pages from notifications
- **Mark as Read** - Individual or bulk mark as read

### 🔐 Security & Authentication
- **Clerk Authentication** - Secure, production-ready auth with social logins
- **Protected Routes** - Middleware-based route protection
- **Encrypted Invitations** - AES-256 encryption for invitation tokens
- **HMAC Verification** - Secure webhook handling for payments
- **Environment-based Secrets** - No hardcoded credentials

### 🎨 User Experience
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support** - Beautiful dark theme
- **Smooth Animations** - Polished UI with Tailwind animations
- **Progress Tracking** - Real-time upload and processing progress
- **Error Handling** - Graceful error messages and recovery

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icons
- **[Recharts](https://recharts.org/)** - Data visualization

### Backend
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Serverless API endpoints
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database (via Neon)

### Third-Party Services
- **[Clerk](https://clerk.com/)** - Authentication and user management
- **[Cloudinary](https://cloudinary.com/)** - Media storage and transformation
- **[Paymob](https://paymob.com/)** - Payment gateway (Egyptian market)
- **[Resend](https://resend.com/)** - Transactional email service
- **[React Email](https://react.email/)** - Email template engine

### Development Tools
- **[Turbopack](https://turbo.build/pack)** - Fast bundler (Next.js 15)
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prisma Studio](https://www.prisma.io/studio)** - Database GUI
- **[tsx](https://github.com/esbuild-kit/tsx)** - TypeScript execution

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  Next.js 15 (React 19) + TypeScript + Tailwind CSS          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Middleware Layer                          │
│  Clerk Auth Middleware (Route Protection)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Media API   │  │  Payment API │  │  User API    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Usage API   │  │  Invite API  │  │  Notif API   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Data Layer                                │
│  Prisma ORM → PostgreSQL (Neon)                             │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                External Services                             │
│  Cloudinary  │  Paymob  │  Resend  │  Clerk                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Example: File Upload

```
1. User selects files → 2. Client validates → 3. Check usage limits
                                                      ↓
4. Upload to Cloudinary ← 5. Generate presigned URL ← API
                                                      ↓
6. Store metadata in DB → 7. Update usage tracking → 8. Send notification
                                                      ↓
9. Return success response → 10. Update UI
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **PostgreSQL** database (Neon, Supabase, or local)
- **Cloudinary** account
- **Clerk** account
- **Paymob** account (for payments)
- **Resend** account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alihazzem/Sahab-SaaS.git
   cd Sahab-SaaS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in all required environment variables (see [Environment Variables](#-environment-variables))

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed initial data (plans)
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

### Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with initial plans
npm run db:seed

# Reset database and re-seed
npm run db:reset
```

### Create Admin User

```bash
# Run the admin creation script
node scripts/create-admin.js

# Follow the prompts to enter admin email
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Paymob Payment Gateway
PAYMOB_API_KEY="your-paymob-api-key"
PAYMOB_INTEGRATION_ID="your-integration-id"
PAYMOB_HMAC_SECRET="your-hmac-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Resend Email Service
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Encryption (for invitation tokens)
ENCRYPTION_KEY="your-32-character-random-string"

# Admin Access (optional)
ADMIN_SECRET="your-super-secret-admin-password"
```

### Getting API Keys

| Service | Sign Up | Documentation |
|---------|---------|---------------|
| **Neon** | [neon.tech](https://neon.tech) | [Docs](https://neon.tech/docs) |
| **Clerk** | [clerk.com](https://clerk.com) | [Docs](https://clerk.com/docs) |
| **Cloudinary** | [cloudinary.com](https://cloudinary.com) | [Docs](https://cloudinary.com/documentation) |
| **Paymob** | [paymob.com](https://paymob.com) | [Docs](https://docs.paymob.com) |
| **Resend** | [resend.com](https://resend.com) | [Docs](https://resend.com/docs) |

---

## 🗄️ Database Schema

### Core Models

#### **Media**
Stores all uploaded media files (videos and images).

```prisma
model Media {
  id             String   @id @default(cuid())
  userId         String   // Clerk user ID
  type           String   // "video" | "image"
  title          String?
  description    String?
  publicId       String   // Cloudinary public ID
  url            String
  versions       Json?    // Multiple resolutions
  originalSize   Int
  compressedSize Int?
  duration       Int?     // For videos
  width          Int?     // For images
  height         Int?     // For images
  tags           String[]
  optimized      Boolean
  sharedLinks    SharedMedia[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### **Subscription**
Manages user subscriptions to plans.

```prisma
model Subscription {
  id        String             @id @default(cuid())
  userId    String             @unique
  planId    String
  plan      Plan               @relation(...)
  startDate DateTime           @default(now())
  endDate   DateTime
  status    SubscriptionStatus
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
}
```

#### **UsageTracking**
Tracks monthly usage per user.

```prisma
model UsageTracking {
  id                  String   @id @default(cuid())
  userId              String
  storageUsed         Int      @default(0) // MB
  transformationsUsed Int      @default(0)
  uploadsCount        Int      @default(0)
  month               Int      // 1-12
  year                Int
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([userId, month, year])
}
```

### Plan Comparison

| Feature | FREE | BASIC (999 EGP/mo) | PRO (1999 EGP/mo) |
|---------|------|-------------------|------------------|
| Storage | 100 MB | 50 GB | 500 GB |
| Max Upload Size | 10 MB | 500 MB | 2 GB |
| Transformations | 50/month | 5,000/month | Unlimited |
| Team Members | 1 | 5 | Unlimited |
| Support | Community | Email | Priority |

See full schema: [`prisma/schema.prisma`](./prisma/schema.prisma)

---

## 📚 API Documentation

Complete API reference with all endpoints, request/response examples, and authentication requirements.

**[→ View Full API Documentation](./API_DOCUMENTATION.md)**

### Quick API Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Media** | 15 endpoints | Upload, list, delete, share media |
| **Subscription** | 3 endpoints | Manage subscriptions and plans |
| **Payment** | 5 endpoints | Payment initiation and webhooks |
| **Usage** | 4 endpoints | Track and analyze usage |
| **Notifications** | 4 endpoints | Manage user notifications |
| **Invitations** | 4 endpoints | Team member invitations |
| **Admin** | 6 endpoints | Admin dashboard and management |

### Example API Request

```typescript
// Upload a video
const formData = new FormData();
formData.append('file', videoFile);
formData.append('title', 'My Video');

const response = await fetch('/api/media/upload/video', {
  method: 'POST',
  body: formData,
  credentials: 'include', // Required for Clerk auth
});

const data = await response.json();
```

---

## 🚀 Deployment

### Recommended: Vercel

1. **Connect your repository to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Alternative Platforms

- **Railway**: [Deploy Guide](https://railway.app/new)
- **Render**: [Deploy Guide](https://render.com/docs)
- **Netlify**: [Deploy Guide](https://www.netlify.com/blog/2020/11/30/how-to-deploy-next.js-sites-to-netlify/)

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run database migrations
- [ ] Seed initial plans (`npm run db:seed`)
- [ ] Create admin user (`node scripts/create-admin.js`)
- [ ] Test authentication flow
- [ ] Test file upload
- [ ] Test payment integration
- [ ] Configure custom domain
- [ ] Set up error monitoring (Sentry)

**Detailed deployment guide:** [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

---

## 📁 Project Structure

```
cloudinary-saas/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed data script
│   └── migrations/                # Database migrations
├── public/
│   └── logo.png                   # Public assets
├── scripts/
│   └── create-admin.js            # Admin creation utility
├── src/
│   ├── app/
│   │   ├── (app)/                 # Protected routes
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── admin/             # Admin panel
│   │   │   └── subscription/      # Subscription management
│   │   ├── api/                   # API routes
│   │   │   ├── media/             # Media management
│   │   │   ├── payment/           # Payment processing
│   │   │   ├── subscription/      # Subscription APIs
│   │   │   ├── usage/             # Usage tracking
│   │   │   ├── notifications/     # Notifications
│   │   │   └── invite/            # Team invitations
│   │   ├── auth/                  # Auth pages (sign-in/up)
│   │   ├── share/                 # Public share pages
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── dashboard/             # Dashboard components
│   │   │   ├── media-library.tsx
│   │   │   ├── upload-modal.tsx
│   │   │   ├── bulk-upload-modal.tsx
│   │   │   ├── analytics-dashboard.tsx
│   │   │   └── ...
│   │   ├── emails/                # Email templates
│   │   └── ui/                    # Reusable UI components
│   ├── hooks/
│   │   ├── useBackgroundUpload.ts # Background upload hook
│   │   └── useUsageAnalytics.ts   # Analytics hook
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client
│   │   ├── cloudinary.ts          # Cloudinary config
│   │   ├── paymob.ts              # Payment gateway
│   │   ├── usage-limits.ts        # Usage limit checks
│   │   ├── invitation-tokens.ts   # Team invitations
│   │   └── notifications.ts       # Notification system
│   ├── types/
│   │   └── index.d.ts             # TypeScript types
│   ├── utils/
│   │   ├── format.ts              # Formatting utilities
│   │   └── storage.ts             # Storage utilities
│   └── middleware.ts              # Clerk auth middleware
├── .env.local                     # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js
├── DEPLOYMENT_GUIDE.md            # Deployment instructions
├── API_DOCUMENTATION.md           # API reference
└── README.md                      # This file
```

---

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)
*Main dashboard with media library and analytics*

### Media Upload
![Upload](./screenshots/upload.png)
*Bulk upload with background processing*

### Analytics
![Analytics](./screenshots/analytics.png)
*Usage analytics and insights*

### Subscription Plans
![Plans](./screenshots/plans.png)
*Three-tier subscription system*

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Write meaningful commit messages
- Update documentation as needed
- Test thoroughly before submitting

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - Amazing React framework
- [Clerk](https://clerk.com/) - Seamless authentication
- [Cloudinary](https://cloudinary.com/) - Powerful media management
- [Prisma](https://www.prisma.io/) - Excellent ORM
- [Vercel](https://vercel.com/) - Best deployment platform
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful components

---

## 📧 Contact

**Ali Hazzem** - [@alihazzem](https://github.com/alihazzem)

**Project Link:** [https://github.com/alihazzem/Sahab-SaaS](https://github.com/alihazzem/Sahab-SaaS)

---

## 🔗 Links

- **Live Demo:** [Coming Soon]
- **Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues:** [GitHub Issues](https://github.com/alihazzem/Sahab-SaaS/issues)

---

<div align="center">

**Made with ❤️ by Ali Hazzem**

⭐ Star this repo if you find it helpful!

</div>
