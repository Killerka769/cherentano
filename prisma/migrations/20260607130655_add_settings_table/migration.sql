-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "workDays" JSONB NOT NULL DEFAULT '{"monday":{"open":"11:00","close":"23:00"},"tuesday":{"open":"11:00","close":"23:00"},"wednesday":{"open":"11:00","close":"23:00"},"thursday":{"open":"11:00","close":"23:00"},"friday":{"open":"11:00","close":"01:00"},"saturday":{"open":"11:00","close":"01:00"},"sunday":{"open":"11:00","close":"23:00"}}',
    "specialDays" JSONB NOT NULL DEFAULT '[]',
    "isSpecialDay" BOOLEAN NOT NULL DEFAULT false,
    "specialMessage" TEXT,
    "phone" TEXT NOT NULL DEFAULT '+7 (988) 293-89-07',
    "email" TEXT NOT NULL DEFAULT 'info@cherentano.ru',
    "address" TEXT NOT NULL DEFAULT 'Республика Дагестан, Махачкала, улица Агасиева, 5А',
    "instagram" TEXT,
    "telegram" TEXT,
    "whatsapp" TEXT,
    "deliveryMinSum" INTEGER NOT NULL DEFAULT 1000,
    "deliveryPrice" INTEGER NOT NULL DEFAULT 150,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
