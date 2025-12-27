/*
  Warnings:

  - You are about to drop the column `bookingRoomId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `serviceUsageId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_bookingRoomId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_serviceUsageId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "bookingRoomId",
DROP COLUMN "serviceUsageId";
