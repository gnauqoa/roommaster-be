/*
  Warnings:

  - You are about to drop the column `pricePerNight` on the `RoomType` table. All the data in the column will be lost.
  - Added the required column `basePrice` to the `RoomType` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('HOLIDAY', 'SEASONAL', 'SPECIAL_EVENT');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterTable
ALTER TABLE "BookingRoom" ADD COLUMN     "pricingRuleId" TEXT,
ADD COLUMN     "pricingRuleSnapshot" JSONB;

-- AlterTable (Rename column to preserve data)
ALTER TABLE "RoomType" RENAME COLUMN "pricePerNight" TO "basePrice";

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'SPECIAL_EVENT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "roomTypeIds" TEXT[],
    "calendarEventId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "recurrenceRule" TEXT,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "adjustmentValue" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_startDate_endDate_idx" ON "CalendarEvent"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PricingRule_rank_key" ON "PricingRule"("rank");

-- CreateIndex
CREATE INDEX "PricingRule_rank_idx" ON "PricingRule"("rank");

-- AddForeignKey
ALTER TABLE "BookingRoom" ADD CONSTRAINT "BookingRoom_pricingRuleId_fkey" FOREIGN KEY ("pricingRuleId") REFERENCES "PricingRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
