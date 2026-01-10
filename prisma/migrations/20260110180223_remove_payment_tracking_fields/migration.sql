/*
  Warnings:

  - You are about to drop the column `balance` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalDeposit` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalPaid` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `BookingRoom` table. All the data in the column will be lost.
  - You are about to drop the column `depositAmount` on the `BookingRoom` table. All the data in the column will be lost.
  - You are about to drop the column `totalPaid` on the `BookingRoom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "balance",
DROP COLUMN "totalDeposit",
DROP COLUMN "totalPaid";

-- AlterTable
ALTER TABLE "BookingRoom" DROP COLUMN "balance",
DROP COLUMN "depositAmount",
DROP COLUMN "totalPaid";
