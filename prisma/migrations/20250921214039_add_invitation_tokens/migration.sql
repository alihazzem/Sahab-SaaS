/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."TeamMember" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_inviteToken_key" ON "public"."TeamMember"("inviteToken");

-- CreateIndex
CREATE INDEX "TeamMember_inviteToken_idx" ON "public"."TeamMember"("inviteToken");
