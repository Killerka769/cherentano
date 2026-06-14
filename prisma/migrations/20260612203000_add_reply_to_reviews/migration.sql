-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "reply" TEXT,
ADD COLUMN     "replyDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
