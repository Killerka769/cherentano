-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "endTime" TEXT;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "purpose" TEXT;
