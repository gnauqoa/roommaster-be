-- CreateTable
CREATE TABLE "PaymentImage" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentImage_bookingId_idx" ON "PaymentImage"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentImage_sortOrder_idx" ON "PaymentImage"("sortOrder");

-- AddForeignKey
ALTER TABLE "PaymentImage" ADD CONSTRAINT "PaymentImage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
