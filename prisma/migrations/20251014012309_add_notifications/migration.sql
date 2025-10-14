-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('TEAM_INVITATION', 'USAGE_WARNING', 'USAGE_CRITICAL', 'USAGE_EXCEEDED', 'UPLOAD_SUCCESS', 'UPLOAD_FAILED', 'PLAN_UPGRADE_SUGGESTION', 'TEAM_MEMBER_JOINED', 'TEAM_MEMBER_LEFT', 'SUBSCRIPTION_EXPIRING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SYSTEM_ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");
