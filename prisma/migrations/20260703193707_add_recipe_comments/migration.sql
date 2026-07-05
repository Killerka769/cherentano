-- AlterTable
ALTER TABLE "RecipeComment" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "RecipeComment" ADD CONSTRAINT "RecipeComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RecipeComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
