-- CreateTable
CREATE TABLE "public"."SharedMedia" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedMedia_shareToken_key" ON "public"."SharedMedia"("shareToken");

-- CreateIndex
CREATE INDEX "SharedMedia_shareToken_idx" ON "public"."SharedMedia"("shareToken");

-- CreateIndex
CREATE INDEX "SharedMedia_userId_idx" ON "public"."SharedMedia"("userId");

-- CreateIndex
CREATE INDEX "SharedMedia_mediaId_idx" ON "public"."SharedMedia"("mediaId");

-- AddForeignKey
ALTER TABLE "public"."SharedMedia" ADD CONSTRAINT "SharedMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
