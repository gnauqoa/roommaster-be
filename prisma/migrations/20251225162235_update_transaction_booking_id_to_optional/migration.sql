/*
  Warnings:

  - Made the column `employeeId` on table `ServiceUsage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ServiceUsage" ALTER COLUMN "employeeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "serviceUsageId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_serviceUsageId_fkey" FOREIGN KEY ("serviceUsageId") REFERENCES "ServiceUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUsage" ADD CONSTRAINT "ServiceUsage_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
