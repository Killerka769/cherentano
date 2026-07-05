/*
  Warnings:

  - The `status` column on the `HelpRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `mealTime` to the `HelpHistory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MealTime" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- AlterTable
ALTER TABLE "Beneficiary" ALTER COLUMN "urgency" SET DEFAULT 'Нормальный';

-- AlterTable
ALTER TABLE "HelpHistory" ADD COLUMN     "mealTime" TEXT NOT NULL,
ALTER COLUMN "items" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "HelpRequest" ADD COLUMN     "mealTime" TEXT NOT NULL DEFAULT 'LUNCH',
ALTER COLUMN "items" SET DEFAULT '[]',
ALTER COLUMN "total" SET DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
