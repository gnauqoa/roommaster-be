/*
  Warnings:

  - You are about to drop the `BookingHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BookingHistory" DROP CONSTRAINT "BookingHistory_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingHistory" DROP CONSTRAINT "BookingHistory_employeeId_fkey";

-- DropTable
DROP TABLE "BookingHistory";
