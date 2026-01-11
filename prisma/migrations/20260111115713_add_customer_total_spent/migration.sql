-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'UPDATE_CUSTOMER_RANK';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "rankId" TEXT,
ADD COLUMN     "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CustomerRank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "minSpending" DECIMAL(10,2) NOT NULL,
    "maxSpending" DECIMAL(10,2),
    "benefits" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerRank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRank_name_key" ON "CustomerRank"("name");

-- CreateIndex
CREATE INDEX "CustomerRank_minSpending_idx" ON "CustomerRank"("minSpending");

-- CreateIndex
CREATE INDEX "Customer_rankId_idx" ON "Customer"("rankId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "CustomerRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
