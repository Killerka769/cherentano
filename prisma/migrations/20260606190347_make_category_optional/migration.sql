-- DropForeignKey
ALTER TABLE "Dish" DROP CONSTRAINT "Dish_categoryId_fkey";

-- AlterTable
ALTER TABLE "Dish" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
