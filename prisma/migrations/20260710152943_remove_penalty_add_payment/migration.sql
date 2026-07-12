/*
  Warnings:

  - You are about to drop the column `penaltyAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `penaltyPaid` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `bookingPenalty` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `penaltyCount` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "penaltyAmount",
DROP COLUMN "penaltyPaid",
ADD COLUMN     "paidAmount" DOUBLE PRECISION,
ADD COLUMN     "paymentData" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bookingPenalty",
DROP COLUMN "penaltyCount";
