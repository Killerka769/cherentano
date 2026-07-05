-- AlterTable
ALTER TABLE "Discount" ADD COLUMN     "appliesToIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
