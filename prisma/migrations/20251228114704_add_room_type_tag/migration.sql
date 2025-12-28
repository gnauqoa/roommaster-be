/*
  Warnings:

  - You are about to drop the column `amenities` on the `RoomType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "code" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "RoomType" DROP COLUMN "amenities",
ADD COLUMN     "totalBed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RoomTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypeTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "roomTagId" TEXT NOT NULL,

    CONSTRAINT "RoomTypeTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomTag_name_key" ON "RoomTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RoomTypeTag_name_key" ON "RoomTypeTag"("name");

-- AddForeignKey
ALTER TABLE "RoomTypeTag" ADD CONSTRAINT "RoomTypeTag_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomTypeTag" ADD CONSTRAINT "RoomTypeTag_roomTagId_fkey" FOREIGN KEY ("roomTagId") REFERENCES "RoomTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
