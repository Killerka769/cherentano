-- CreateTable
CREATE TABLE "AddressHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" INTEGER,

    CONSTRAINT "AddressHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AddressHistory" ADD CONSTRAINT "AddressHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
