-- AlterEnum
ALTER TYPE "ServiceUsageStatus" ADD VALUE 'TRANSFERRED';

-- AlterTable
ALTER TABLE "ServiceUsage" ALTER COLUMN "totalPaid" SET DEFAULT 0;
