# 📖 API Documentation

Complete API reference for the Sahab SaaS Platform.

**Base URL:** `https://your-domain.com/api` or `http://localhost:3000/api` (development)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Media Management](#media-management)
3. [Subscription & Plans](#subscription--plans)
4. [Payment Processing](#payment-processing)
5. [Usage Tracking](#usage-tracking)
6. [Notifications](#notifications)
7. [Team Invitations](#team-invitations)
8. [Admin APIs](#admin-apis)
9. [Health Check](#health-check)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All API endpoints (except public share links) require **Clerk authentication**.

### Authentication Method

Include credentials in your requests:

```typescript
fetch('/api/endpoint', {
  method: 'GET',
  credentials: 'include', // Required!
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Getting the Current User

Clerk automatically provides the authenticated user in API routes:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use userId...
}
```

---

## 🎬 Media Management

### 1. Upload Video

**Endpoint:** `POST /api/media/upload/video`

**Description:** Upload a video file to Cloudinary and store metadata in the database.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  ```typescript
  {
    file: File,           // Video file (required)
    title?: string,       // Optional title
    description?: string, // Optional description
  }
  ```

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "clxxx123",
    "userId": "user_xxx",
    "type": "video",
    "title": "My Video",
    "description": "Video description",
    "publicId": "videos/xxx",
    "url": "https://res.cloudinary.com/...",
    "originalSize": 15728640,
    "duration": 120,
    "createdAt": "2024-11-02T10:00:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Invalid file or missing required fields
- `401` - Unauthorized
- `403` - Usage limit exceeded
- `413` - File too large
- `500` - Upload failed

**Example:**
```typescript
const formData = new FormData();
formData.append('file', videoFile);
formData.append('title', 'Product Demo');
formData.append('description', 'Demo of our new product');

const response = await fetch('/api/media/upload/video', {
  method: 'POST',
  body: formData,
  credentials: 'include',
});

const data = await response.json();
```

---

### 2. Upload Image

**Endpoint:** `POST /api/media/upload/image`

**Description:** Upload an image file to Cloudinary.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:** Same as video upload

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "clxxx456",
    "type": "image",
    "url": "https://res.cloudinary.com/...",
    "width": 1920,
    "height": 1080,
    "originalSize": 524288
  }
}
```

---

### 3. List Media

**Endpoint:** `GET /api/media/list`

**Description:** Get paginated list of user's media files with optional filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `type` (string, optional) - Filter by "video" or "image"
- `search` (string, optional) - Search in title and description

**Request:**
```
GET /api/media/list?page=1&limit=20&type=video&search=demo
```

**Response:**
```json
{
  "success": true,
  "media": [
    {
      "id": "clxxx123",
      "type": "video",
      "title": "Product Demo",
      "url": "https://res.cloudinary.com/...",
      "createdAt": "2024-11-02T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "pages": 3,
    "currentPage": 1,
    "perPage": 20
  }
}
```

---

### 4. Get Media by ID

**Endpoint:** `GET /api/media/[id]`

**Description:** Get detailed information about a specific media file.

**Request:**
```
GET /api/media/clxxx123
```

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "clxxx123",
    "userId": "user_xxx",
    "type": "video",
    "title": "Product Demo",
    "description": "Demo video",
    "publicId": "videos/xxx",
    "url": "https://res.cloudinary.com/...",
    "versions": {
      "1080p": "https://...",
      "720p": "https://...",
      "480p": "https://..."
    },
    "originalSize": 15728640,
    "compressedSize": 8388608,
    "duration": 120,
    "tags": ["demo", "product"],
    "optimized": true,
    "createdAt": "2024-11-02T10:00:00.000Z"
  }
}
```

---

### 5. Update Media

**Endpoint:** `PATCH /api/media/[id]`

**Description:** Update media metadata (title, description, tags).

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "clxxx123",
    "title": "Updated Title",
    "description": "Updated description",
    "tags": ["tag1", "tag2"],
    "updatedAt": "2024-11-02T11:00:00.000Z"
  }
}
```

---

### 6. Delete Media

**Endpoint:** `DELETE /api/media/delete`

**Description:** Delete one or multiple media files.

**Request:**
```json
{
  "mediaIds": ["clxxx123", "clxxx456"]
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 2,
  "failed": 0,
  "results": [
    {
      "id": "clxxx123",
      "success": true
    },
    {
      "id": "clxxx456",
      "success": true
    }
  ]
}
```

---

### 7. Batch Download

**Endpoint:** `POST /api/media/batch-download`

**Description:** Get download URLs for multiple media files.

**Request:**
```json
{
  "mediaIds": ["clxxx123", "clxxx456", "clxxx789"]
}
```

**Response:**
```json
{
  "success": true,
  "downloads": [
    {
      "id": "clxxx123",
      "title": "Video 1",
      "url": "https://res.cloudinary.com/...",
      "type": "video"
    },
    {
      "id": "clxxx456",
      "title": "Image 1",
      "url": "https://res.cloudinary.com/...",
      "type": "image"
    }
  ]
}
```

**Notes:**
- Maximum 100 files per request
- URLs are valid for 1 hour
- Downloads are staggered to prevent browser blocking

---

### 8. Create Share Link

**Endpoint:** `POST /api/media/share/create`

**Description:** Create a public share link for media.

**Request:**
```json
{
  "mediaId": "clxxx123",
  "title": "Shared Video Title",
  "description": "Custom description for share",
  "expiresAt": "2024-12-31T23:59:59.000Z" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "shareLink": {
    "id": "share_xxx",
    "mediaId": "clxxx123",
    "shareToken": "abc123xyz789",
    "url": "https://your-domain.com/share/abc123xyz789",
    "title": "Shared Video Title",
    "description": "Custom description for share",
    "views": 0,
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "isActive": true,
    "createdAt": "2024-11-02T10:00:00.000Z"
  }
}
```

---

### 9. Get Share Links

**Endpoint:** `GET /api/media/share/list`

**Description:** List all share links created by the user.

**Response:**
```json
{
  "success": true,
  "shareLinks": [
    {
      "id": "share_xxx",
      "media": {
        "id": "clxxx123",
        "title": "Video Title",
        "type": "video",
        "url": "https://..."
      },
      "shareToken": "abc123xyz789",
      "url": "https://your-domain.com/share/abc123xyz789",
      "views": 42,
      "isActive": true,
      "createdAt": "2024-11-02T10:00:00.000Z"
    }
  ]
}
```

---

### 10. View Shared Media (Public)

**Endpoint:** `GET /api/media/share/view/[token]`

**Description:** Access shared media by token (no authentication required).

**Request:**
```
GET /api/media/share/view/abc123xyz789
```

**Response:**
```json
{
  "success": true,
  "sharedMedia": {
    "title": "Shared Video",
    "description": "Video description",
    "media": {
      "type": "video",
      "url": "https://res.cloudinary.com/...",
      "duration": 120,
      "width": 1920,
      "height": 1080
    },
    "views": 43,
    "createdAt": "2024-11-02T10:00:00.000Z"
  }
}
```

**Error Codes:**
- `404` - Share link not found or expired
- `410` - Share link is no longer active

---

### 11. Update Share Link

**Endpoint:** `PATCH /api/media/share/[id]`

**Description:** Update share link settings.

**Request:**
```json
{
  "title": "New Title",
  "description": "New description",
  "isActive": false,
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "shareLink": {
    "id": "share_xxx",
    "title": "New Title",
    "isActive": false,
    "updatedAt": "2024-11-02T11:00:00.000Z"
  }
}
```

---

### 12. Delete Share Link

**Endpoint:** `DELETE /api/media/share/[id]`

**Description:** Delete a share link (media file is not deleted).

**Response:**
```json
{
  "success": true,
  "message": "Share link deleted successfully"
}
```

---

### 13. Upload Thumbnail

**Endpoint:** `POST /api/media/upload/thumbnail`

**Description:** Upload a custom thumbnail for a video.

**Request:**
- **Content-Type:** multipart/form-data
- **Body:**
  ```typescript
  {
    mediaId: string,
    file: File
  }
  ```

**Response:**
```json
{
  "success": true,
  "thumbnailUrl": "https://res.cloudinary.com/..."
}
```

---

## 💳 Subscription & Plans

### 1. Get All Plans

**Endpoint:** `GET /api/plans`

**Description:** Get list of all available subscription plans.

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "plan_free",
      "name": "FREE",
      "price": 0,
      "currency": "EGP",
      "storageLimit": 100,
      "maxUploadSize": 10,
      "transformationsLimit": 50,
      "teamMembers": 1,
      "supportLevel": "Community"
    },
    {
      "id": "plan_basic",
      "name": "BASIC",
      "price": 99900,
      "currency": "EGP",
      "storageLimit": 51200,
      "maxUploadSize": 500,
      "transformationsLimit": 5000,
      "teamMembers": 5,
      "supportLevel": "Email"
    },
    {
      "id": "plan_pro",
      "name": "PRO",
      "price": 199900,
      "currency": "EGP",
      "storageLimit": 512000,
      "maxUploadSize": 2048,
      "transformationsLimit": 999999,
      "teamMembers": 999,
      "supportLevel": "Priority"
    }
  ]
}
```

**Note:** Prices are in piastres (EGP * 100). Divide by 100 to get EGP.

---

### 2. Get Subscription Status

**Endpoint:** `GET /api/subscription/status`

**Description:** Get current user's subscription status and usage.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "userId": "user_xxx",
    "plan": {
      "id": "plan_basic",
      "name": "BASIC",
      "price": 99900,
      "storageLimit": 51200,
      "maxUploadSize": 500,
      "transformationsLimit": 5000,
      "teamMembers": 5
    },
    "status": "ACTIVE",
    "startDate": "2024-10-01T00:00:00.000Z",
    "endDate": "2024-11-01T00:00:00.000Z"
  },
  "usage": {
    "storageUsed": 15360,
    "storageLimit": 51200,
    "storagePercentage": 30,
    "transformationsUsed": 1250,
    "transformationsLimit": 5000,
    "transformationsPercentage": 25,
    "uploadsCount": 45
  }
}
```

---

### 3. Check Plan Limits

**Endpoint:** `GET /api/subscription/limits`

**Description:** Check if user can perform an action based on their plan limits.

**Query Parameters:**
- `action` - "upload" | "storage" | "transformation"
- `size` - (optional) File size in bytes for upload check

**Request:**
```
GET /api/subscription/limits?action=upload&size=524288000
```

**Response:**
```json
{
  "success": true,
  "allowed": true,
  "limit": 524288000,
  "current": 15728640,
  "remaining": 508559360,
  "percentage": 3
}
```

Or if limit exceeded:

```json
{
  "success": false,
  "allowed": false,
  "limit": 10485760,
  "current": 15728640,
  "exceeded": true,
  "message": "File size exceeds plan limit",
  "suggestedPlan": "BASIC"
}
```

---

## 💰 Payment Processing

### 1. Initiate Payment

**Endpoint:** `POST /api/payment/initiate`

**Description:** Initiate a payment for a subscription plan.

**Request:**
```json
{
  "planId": "plan_basic"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "pay_xxx",
    "amount": 99900,
    "currency": "EGP",
    "status": "PENDING"
  },
  "paymob": {
    "paymentUrl": "https://accept.paymob.com/api/acceptance/iframes/xxx?payment_token=xxx",
    "paymentToken": "xxx",
    "orderId": "123456"
  }
}
```

**Usage:**
Redirect user to `paymob.paymentUrl` to complete payment.

---

### 2. Payment Webhook

**Endpoint:** `POST /api/payment/webhook`

**Description:** Paymob webhook for payment status updates (internal use).

**Request:**
```json
{
  "type": "TRANSACTION",
  "obj": {
    "id": 123456,
    "success": true,
    "amount_cents": 99900,
    "order": {
      "id": 123456,
      "merchant_order_id": "pay_xxx"
    },
    "hmac": "calculated_hmac"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

**Notes:**
- This endpoint is called by Paymob
- HMAC signature is verified
- Updates payment status and creates/updates subscription

---

### 3. Get Payment History

**Endpoint:** `GET /api/payment/history`

**Description:** Get user's payment transaction history.

**Query Parameters:**
- `limit` (number, default: 50) - Number of transactions
- `status` (string, optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "id": "pay_xxx",
      "plan": {
        "name": "BASIC",
        "price": 99900
      },
      "amount": 99900,
      "currency": "EGP",
      "status": "SUCCESS",
      "provider": "paymob",
      "providerTxnId": "123456",
      "createdAt": "2024-11-01T10:00:00.000Z"
    }
  ]
}
```

---

### 4. Test Payment Completion (Development Only)

**Endpoint:** `POST /api/payment/test-complete`

**Description:** Manually complete a payment for testing (only in development).

**Request:**
```json
{
  "paymentId": "pay_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "status": "SUCCESS"
  },
  "subscription": {
    "status": "ACTIVE"
  }
}
```

**Note:** This endpoint is only available in development mode.

---

## 📊 Usage Tracking

### 1. Get Current Usage

**Endpoint:** `GET /api/usage/current`

**Description:** Get current month's usage statistics.

**Response:**
```json
{
  "success": true,
  "usage": {
    "storageUsed": 15360,
    "transformationsUsed": 1250,
    "uploadsCount": 45,
    "month": 11,
    "year": 2024
  },
  "limits": {
    "storage": 51200,
    "transformations": 5000,
    "maxUploadSize": 500
  },
  "percentages": {
    "storage": 30,
    "transformations": 25
  }
}
```

---

### 2. Update Usage

**Endpoint:** `POST /api/usage/update`

**Description:** Update usage statistics (called internally after uploads).

**Request:**
```json
{
  "type": "storage" | "transformation" | "upload",
  "amount": 10485760, // For storage: bytes, for transformation: count
  "operation": "increment" | "decrement"
}
```

**Response:**
```json
{
  "success": true,
  "usage": {
    "storageUsed": 25845760,
    "transformationsUsed": 1251,
    "uploadsCount": 46
  }
}
```

---

### 3. Get Usage Analytics

**Endpoint:** `GET /api/usage/analytics`

**Description:** Get historical usage analytics with charts data.

**Query Parameters:**
- `months` (number, default: 6) - Number of months to retrieve

**Request:**
```
GET /api/usage/analytics?months=12
```

**Response:**
```json
{
  "success": true,
  "analytics": [
    {
      "month": 11,
      "year": 2024,
      "storageUsed": 15360,
      "transformationsUsed": 1250,
      "uploadsCount": 45,
      "label": "Nov 2024"
    },
    {
      "month": 10,
      "year": 2024,
      "storageUsed": 12288,
      "transformationsUsed": 980,
      "uploadsCount": 38,
      "label": "Oct 2024"
    }
  ],
  "totals": {
    "totalStorage": 27648,
    "totalTransformations": 2230,
    "totalUploads": 83
  },
  "averages": {
    "avgStoragePerMonth": 13824,
    "avgTransformationsPerMonth": 1115,
    "avgUploadsPerMonth": 41.5
  }
}
```

---

### 4. Sync Usage with Cloudinary

**Endpoint:** `POST /api/usage/sync`

**Description:** Sync storage usage with Cloudinary actual usage.

**Response:**
```json
{
  "success": true,
  "before": {
    "storageUsed": 15360
  },
  "after": {
    "storageUsed": 15728640
  },
  "difference": 368640,
  "synced": true
}
```

---

## 🔔 Notifications

### 1. Get Notifications

**Endpoint:** `GET /api/notifications`

**Description:** Get user's notifications with pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `unreadOnly` (boolean, default: false)

**Request:**
```
GET /api/notifications?page=1&limit=10&unreadOnly=true
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_xxx",
      "type": "USAGE_WARNING",
      "title": "Storage Usage Warning",
      "message": "You've used 80% of your storage limit",
      "actionUrl": "/subscription",
      "actionLabel": "Upgrade Plan",
      "metadata": {
        "percentage": 80,
        "limit": 51200,
        "used": 40960
      },
      "isRead": false,
      "createdAt": "2024-11-02T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "pages": 2,
    "currentPage": 1,
    "unreadCount": 5
  }
}
```

---

### 2. Create Notification

**Endpoint:** `POST /api/notifications`

**Description:** Create a notification for a user (admin or system use).

**Request:**
```json
{
  "userId": "user_xxx",
  "type": "SYSTEM_ANNOUNCEMENT",
  "title": "New Feature Available",
  "message": "Check out our new bulk upload feature!",
  "actionUrl": "/dashboard",
  "actionLabel": "Try It Now",
  "metadata": {
    "feature": "bulk-upload"
  }
}
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "notif_xxx",
    "type": "SYSTEM_ANNOUNCEMENT",
    "title": "New Feature Available",
    "isRead": false,
    "createdAt": "2024-11-02T10:00:00.000Z"
  }
}
```

---

### 3. Mark Notification as Read

**Endpoint:** `PATCH /api/notifications/[id]`

**Description:** Mark a specific notification as read.

**Request:**
```json
{
  "isRead": true
}
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "notif_xxx",
    "isRead": true,
    "updatedAt": "2024-11-02T10:30:00.000Z"
  }
}
```

---

### 4. Mark All as Read

**Endpoint:** `POST /api/notifications/mark-all-read`

**Description:** Mark all user's notifications as read.

**Response:**
```json
{
  "success": true,
  "updated": 15,
  "message": "All notifications marked as read"
}
```

---

### 5. Delete Notification

**Endpoint:** `DELETE /api/notifications/[id]`

**Description:** Delete a specific notification.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## 👥 Team Invitations

### 1. Send Invitation

**Endpoint:** `POST /api/invite/send`

**Description:** Invite a team member via email.

**Request:**
```json
{
  "email": "teammate@example.com",
  "role": "MEMBER" | "MANAGER",
  "permissions": ["view_media", "upload_media"]
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "inv_xxx",
    "email": "teammate@example.com",
    "role": "MEMBER",
    "status": "PENDING",
    "inviteToken": "encrypted_token",
    "inviteUrl": "https://your-domain.com/invite/encrypted_token",
    "tokenExpiresAt": "2024-11-09T10:00:00.000Z",
    "createdAt": "2024-11-02T10:00:00.000Z"
  },
  "message": "Invitation email sent successfully"
}
```

---

### 2. Validate Invitation

**Endpoint:** `GET /api/invite/validate?token=xxx`

**Description:** Validate an invitation token.

**Response:**
```json
{
  "success": true,
  "valid": true,
  "invitation": {
    "id": "inv_xxx",
    "email": "teammate@example.com",
    "role": "MEMBER",
    "teamOwner": {
      "email": "owner@example.com",
      "name": "Team Owner"
    },
    "expiresAt": "2024-11-09T10:00:00.000Z"
  }
}
```

Or if invalid:

```json
{
  "success": false,
  "valid": false,
  "error": "Invitation expired or invalid"
}
```

---

### 3. Accept Invitation

**Endpoint:** `POST /api/invite/accept`

**Description:** Accept a team invitation.

**Request:**
```json
{
  "token": "encrypted_token"
}
```

**Response:**
```json
{
  "success": true,
  "teamMember": {
    "id": "member_xxx",
    "userId": "user_xxx",
    "email": "teammate@example.com",
    "role": "MEMBER",
    "status": "ACCEPTED",
    "acceptedAt": "2024-11-02T10:00:00.000Z"
  },
  "message": "Successfully joined the team"
}
```

---

### 4. Decline Invitation

**Endpoint:** `POST /api/invite/decline`

**Description:** Decline a team invitation.

**Request:**
```json
{
  "token": "encrypted_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation declined"
}
```

---

### 5. List Invitations

**Endpoint:** `GET /api/invite/list`

**Description:** Get all invitations sent by the user.

**Query Parameters:**
- `status` (optional) - Filter by "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"

**Response:**
```json
{
  "success": true,
  "invitations": [
    {
      "id": "inv_xxx",
      "email": "teammate@example.com",
      "role": "MEMBER",
      "status": "PENDING",
      "invitedAt": "2024-11-02T10:00:00.000Z",
      "tokenExpiresAt": "2024-11-09T10:00:00.000Z"
    }
  ]
}
```

---

### 6. Revoke Invitation

**Endpoint:** `DELETE /api/invite/revoke/[id]`

**Description:** Revoke a pending invitation.

**Response:**
```json
{
  "success": true,
  "message": "Invitation revoked successfully"
}
```

---

## 🛡️ Admin APIs

**Note:** All admin APIs require admin role verification.

### 1. Get Admin Dashboard Stats

**Endpoint:** `GET /api/admin/stats`

**Description:** Get platform-wide statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 1250,
      "active": 890,
      "new_this_month": 45
    },
    "subscriptions": {
      "free": 850,
      "basic": 300,
      "pro": 100
    },
    "media": {
      "total": 15680,
      "videos": 8500,
      "images": 7180,
      "totalSize": 524288000
    },
    "revenue": {
      "thisMonth": 39960000,
      "lastMonth": 35970000,
      "growth": 11.1
    }
  }
}
```

---

### 2. List All Users

**Endpoint:** `GET /api/admin/users`

**Description:** Get paginated list of all users.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `plan` (optional) - Filter by plan name

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "userId": "user_xxx",
      "email": "user@example.com",
      "subscription": {
        "plan": "BASIC",
        "status": "ACTIVE",
        "endDate": "2024-12-01T00:00:00.000Z"
      },
      "usage": {
        "storageUsed": 15360,
        "uploadsCount": 45
      },
      "createdAt": "2024-10-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1250,
    "pages": 25,
    "currentPage": 1
  }
}
```

---

### 3. Get User Details

**Endpoint:** `GET /api/admin/users/[userId]`

**Description:** Get detailed information about a specific user.

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "user_xxx",
    "email": "user@example.com",
    "subscription": { /* ... */ },
    "usage": { /* ... */ },
    "media": {
      "count": 45,
      "totalSize": 15728640
    },
    "payments": [
      /* Payment history */
    ],
    "teamMembers": [
      /* Team members */
    ]
  }
}
```

---

### 4. Update User Subscription

**Endpoint:** `PATCH /api/admin/users/[userId]/subscription`

**Description:** Manually update a user's subscription (admin override).

**Request:**
```json
{
  "planId": "plan_pro",
  "endDate": "2024-12-31T23:59:59.000Z",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "plan": "PRO",
    "status": "ACTIVE",
    "endDate": "2024-12-31T23:59:59.000Z"
  }
}
```

---

### 5. Create System Notification

**Endpoint:** `POST /api/admin/notifications/broadcast`

**Description:** Send a notification to all users or specific user segments.

**Request:**
```json
{
  "type": "SYSTEM_ANNOUNCEMENT",
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Nov 5th",
  "target": "all" | "free" | "basic" | "pro",
  "actionUrl": "/status",
  "actionLabel": "View Status"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 1250,
  "message": "Broadcast notification sent"
}
```

---

### 6. Get System Logs

**Endpoint:** `GET /api/admin/logs`

**Description:** Get system activity logs.

**Query Parameters:**
- `type` - "payment" | "upload" | "error" | "security"
- `limit` (default: 100)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_xxx",
      "type": "payment",
      "action": "payment_success",
      "userId": "user_xxx",
      "metadata": { /* ... */ },
      "timestamp": "2024-11-02T10:00:00.000Z"
    }
  ]
}
```

---

## 🏥 Health Check

### Health Status

**Endpoint:** `GET /api/health`

**Description:** Check API and database health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-02T10:00:00.000Z",
  "services": {
    "database": "connected",
    "clerk": "operational",
    "cloudinary": "operational"
  },
  "version": "0.1.0"
}
```

---

## ⚠️ Error Handling

All API endpoints follow a consistent error response format:

### Error Response Structure

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    /* Additional error context */
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 403 | `LIMIT_EXCEEDED` | Usage limit exceeded |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict |
| 413 | `FILE_TOO_LARGE` | File size exceeds limit |
| 422 | `VALIDATION_ERROR` | Request validation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Internal server error |
| 503 | `SERVICE_UNAVAILABLE` | External service unavailable |

### Example Error Responses

**Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": {
    "message": "Authentication required"
  }
}
```

**Limit Exceeded:**
```json
{
  "success": false,
  "error": "Storage limit exceeded",
  "code": "LIMIT_EXCEEDED",
  "details": {
    "limit": 51200,
    "current": 51200,
    "required": 52428800,
    "suggestedPlan": "PRO"
  }
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fields": {
      "email": "Invalid email format",
      "role": "Must be one of: MEMBER, MANAGER, ADMIN"
    }
  }
}
```

---

## 🚦 Rate Limiting

### Current Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Upload | 20 requests | 10 minutes |
| API Requests | 100 requests | 1 minute |
| Webhooks | 500 requests | 1 minute |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1698926400
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "resetAt": "2024-11-02T10:15:00.000Z",
    "retryAfter": 120
  }
}
```

---

## 📝 Best Practices

### 1. Always Use Credentials

```typescript
fetch('/api/endpoint', {
  credentials: 'include', // Required for Clerk auth
});
```

### 2. Handle Errors Gracefully

```typescript
try {
  const response = await fetch('/api/media/upload/video', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  
  // Success
  console.log(data.media);
} catch (error) {
  console.error('Upload error:', error.message);
  // Show user-friendly error message
}
```

### 3. Check Limits Before Upload

```typescript
// Check if upload is allowed
const checkResponse = await fetch(
  `/api/subscription/limits?action=upload&size=${file.size}`,
  { credentials: 'include' }
);

const { allowed, message } = await checkResponse.json();

if (!allowed) {
  alert(message);
  return;
}

// Proceed with upload
```

### 4. Use Pagination

```typescript
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await fetch(
    `/api/media/list?page=${page}&limit=20`,
    { credentials: 'include' }
  );
  
  const { media, pagination } = await response.json();
  
  // Process media...
  
  hasMore = page < pagination.pages;
  page++;
}
```

### 5. Monitor Upload Progress

```typescript
const xhr = new XMLHttpRequest();

xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentage = (e.loaded / e.total) * 100;
    updateProgressBar(percentage);
  }
});

xhr.open('POST', '/api/media/upload/video');
xhr.withCredentials = true; // For Clerk auth
xhr.send(formData);
```

---

## 🔧 Testing

### Test Endpoints

Use these endpoints for testing (development mode only):

```bash
# Test payment completion
POST /api/payment/test-complete
{
  "paymentId": "pay_xxx"
}

# Test notification
POST /api/notifications/test
{
  "type": "USAGE_WARNING"
}
```

### Example with cURL

```bash
# Upload video
curl -X POST http://localhost:3000/api/media/upload/video \
  -H "Cookie: __session=xxx" \
  -F "file=@video.mp4" \
  -F "title=Test Video"

# Get media list
curl -X GET "http://localhost:3000/api/media/list?page=1&limit=10" \
  -H "Cookie: __session=xxx"
```

---

## 📞 Support

For API questions or issues:

- **GitHub Issues:** [github.com/alihazzem/Sahab-SaaS/issues](https://github.com/alihazzem/Sahab-SaaS/issues)
- **Email:** support@yourdomain.com
- **Documentation:** [Full README](./README.md)

---

## 📄 License

This API documentation is part of the Cloudinary SaaS Platform, licensed under the MIT License.

---

<div align="center">

**API Version:** 0.1.0  
**Last Updated:** November 2, 2024

Made with ❤️ by Ali Hazzem

</div>
