/*
  Warnings:

  - The values [CHECKED_IN,CHECKED_OUT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `totalPaid` to the `ServiceUsage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATE_BOOKING', 'UPDATE_BOOKING', 'CREATE_BOOKING_ROOM', 'UPDATE_BOOKING_ROOM', 'CREATE_SERVICE_USAGE', 'UPDATE_SERVICE_USAGE', 'CREATE_TRANSACTION', 'UPDATE_TRANSACTION', 'CREATE_CUSTOMER', 'CHECKED_IN', 'CHECKED_OUT');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('DEPOSIT', 'ROOM_CHARGE', 'SERVICE_CHARGE', 'REFUND', 'ADJUSTMENT');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "ServiceUsage" ADD COLUMN     "totalPaid" DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "customerId" TEXT,
    "serviceUsageId" TEXT,
    "bookingRoomId" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_serviceUsageId_fkey" FOREIGN KEY ("serviceUsageId") REFERENCES "ServiceUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_bookingRoomId_fkey" FOREIGN KEY ("bookingRoomId") REFERENCES "BookingRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
