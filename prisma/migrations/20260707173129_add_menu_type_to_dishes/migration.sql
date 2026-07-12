-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('DELIVERY', 'PICKUP', 'BOTH');

-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "menuType" "MenuType" NOT NULL DEFAULT 'BOTH';
