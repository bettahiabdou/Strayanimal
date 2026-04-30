-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "communeName" TEXT NOT NULL,
    "serviceTitle" TEXT NOT NULL,
    "publicHotline" TEXT NOT NULL,
    "internalHotline" TEXT,
    "publicEmail" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "openingHours" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
