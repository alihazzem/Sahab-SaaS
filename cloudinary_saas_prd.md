# 📄 Product Requirements Document (PRD)  
## Cloudinary SaaS Platform  

---

## 1. Overview  
A SaaS platform for **media management** (image/video upload, optimization, and transformation) powered by **Cloudinary**.  
Built with:  
- **Frontend**: Next.js + ShadCN UI + TailwindCSS  
- **Backend**: Node.js (Express or Next.js API Routes)  
- **Database**: Prisma ORM + NeonDB (Postgres)  
- **Payments**: Paymob (EGP currency)  
- **Auth**: NextAuth.js (JWT + OAuth support)  
- **Hosting**: Vercel (frontend), Render/Fly.io (backend), NeonDB (database)  

---

## 2. Core Features  
1. **Authentication & Roles**  
   - Email/password, Google OAuth  
   - Roles: `user`, `admin`  
   - Role-based access for APIs and dashboards  

2. **Media Management**  
   - Upload images/videos → stored in Cloudinary  
   - Transformations (resize, crop, watermark, etc.)  
   - Organized by user → linked in NeonDB  

3. **Pricing Plans (EGP)**  
   - **Free** (0 EGP): 500MB storage, 5MB max upload, 50 transformations/month, 1 team member, community support  
   - **Pro** (199 EGP/month): 10GB storage, 100MB max upload, 5,000 transformations/month, 5 team members, email support  
   - **Enterprise** (999 EGP/month): 100GB storage, 1GB max upload, 50,000 transformations/month, unlimited team members, priority support  

4. **Billing & Payments (Paymob)**  
   - Store prices in **piastres** (1 EGP = 100 piastres)  
   - Subscriptions auto-renew monthly  
   - Failed payments trigger downgrade to Free plan  

5. **Dashboard (ShadCN UI)**  
   - Media library with search/filter/sort  
   - Upload button (drag-and-drop)  
   - Usage analytics (storage used, transformations used)  
   - Subscription management (upgrade/downgrade/cancel)  

6. **Admin Panel**  
   - Manage users, subscriptions, payments  
   - View system-wide media usage stats  
   - Approve/refund Paymob transactions if needed  

---

## 3. Database Schema (Prisma + NeonDB)

```prisma
model User {
  id             String          @id @default(cuid())
  email          String          @unique
  password       String?
  role           Role            @default(USER)
  subscription   Subscription?
  media          Media[]
  payments       Payment[]
  createdAt      DateTime        @default(now())
}

model Plan {
  id                  String         @id @default(cuid())
  name                String         @unique
  price               Int            // stored in piastres (EGP * 100)
  currency            String         @default("EGP")
  storageLimit        Int            // MB
  maxUploadSize       Int            // MB
  transformationsLimit Int
  teamMembers         Int
  supportLevel        String
  subscriptions       Subscription[]
  payments            Payment[]
}

model Subscription {
  id           String    @id @default(cuid())
  userId       String    @unique
  user         User      @relation(fields: [userId], references: [id])
  planId       String
  plan         Plan      @relation(fields: [planId], references: [id])
  startDate    DateTime  @default(now())
  endDate      DateTime
  status       SubscriptionStatus
}

model Media {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  publicId    String    @unique
  url         String
  type        MediaType
  size        Int       // KB
  uploadedAt  DateTime  @default(now())
  isDeleted   Boolean   @default(false)
}

model Payment {
  id                String         @id @default(cuid())
  userId            String
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId            String
  plan              Plan           @relation(fields: [planId], references: [id])
  amount            Int            // in piastres
  currency          String         @default("EGP")
  status            PaymentStatus
  provider          String         // "paymob"
  providerTxnId     String
  createdAt         DateTime       @default(now())
}

enum Role {
  USER
  ADMIN
}

enum MediaType {
  IMAGE
  VIDEO
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
}
```

---

## 4. API Endpoints  

### Auth  
- `POST /api/auth/signup` – Register user  
- `POST /api/auth/login` – Login (JWT)  
- `POST /api/auth/logout` – Logout  

### Media  
- `POST /api/media/upload` – Upload image/video  
- `GET /api/media/list` – List user’s media  
- `DELETE /api/media/:id` – Delete media  
- `POST /api/media/transform` – Apply transformation  

### Plans & Subscriptions  
- `GET /api/plans` – Get all plans  
- `POST /api/subscribe` – Subscribe to a plan (Paymob integration)  
- `POST /api/subscription/cancel` – Cancel subscription  
- `GET /api/subscription/status` – Get user subscription  

### Payments  
- `POST /api/payment/initiate` – Start Paymob payment session  
- `POST /api/payment/webhook` – Handle Paymob callback  
- `GET /api/payment/history` – List past payments  

### Admin  
- `GET /api/admin/users` – List all users  
- `GET /api/admin/usage` – System-wide usage stats  
- `POST /api/admin/update-role` – Promote/demote user  

---

## 5. Roles & Access  
- **User**: Can upload/manage media, view subscription, make payments  
- **Admin**: Full system access, user management, usage insights  

---

## 6. Payment Flow (Paymob in EGP)  
1. User selects plan (amount stored in piastres, e.g., 19900 for 199 EGP).  
2. Backend calls Paymob API → get `payment_token`.  
3. Redirect user to Paymob hosted page.  
4. On success, Paymob calls webhook → update DB: `Payment.success`, `Subscription.active`.  

---

## 7. Analytics & Dashboard  
- Track:  
  - Storage usage  
  - Transformations count  
  - Upload count per user  
- Show charts on dashboard (ShadCN + Chart.js/Recharts).  

---

## 8. Seed Data (Plans in DB)  

```ts
const plans = [
  {
    name: "Free",
    price: 0,
    storageLimit: 500,
    maxUploadSize: 5,
    transformationsLimit: 50,
    teamMembers: 1,
    supportLevel: "community",
  },
  {
    name: "Pro",
    price: 19900, // 199 EGP
    storageLimit: 10000,
    maxUploadSize: 100,
    transformationsLimit: 5000,
    teamMembers: 5,
    supportLevel: "email",
  },
  {
    name: "Enterprise",
    price: 99900, // 999 EGP
    storageLimit: 100000,
    maxUploadSize: 1000,
    transformationsLimit: 50000,
    teamMembers: -1, // unlimited
    supportLevel: "priority",
  },
];
```

---

## 9. Future Enhancements  
- Team collaboration (invite members, roles inside team)  
- Custom domains for media delivery  
- API rate limiting per plan  
- AI-powered transformations (background removal, smart crop)  

---
