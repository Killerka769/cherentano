-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('PROMOTION', 'EVENT', 'RECOMMEND', 'HOT', 'NEW', 'SPECIAL');

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "type" "BannerType" NOT NULL DEFAULT 'PROMOTION';
