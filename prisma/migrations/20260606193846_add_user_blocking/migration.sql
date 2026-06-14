-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockReason" TEXT,
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedBy" TEXT,
ADD COLUMN     "blockedUntil" TIMESTAMP(3),
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;
