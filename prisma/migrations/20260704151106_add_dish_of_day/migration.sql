-- CreateTable
CREATE TABLE "DishOfDay" (
    "id" SERIAL NOT NULL,
    "dishId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DishOfDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DishOfDay_date_dishId_key" ON "DishOfDay"("date", "dishId");

-- AddForeignKey
ALTER TABLE "DishOfDay" ADD CONSTRAINT "DishOfDay_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
