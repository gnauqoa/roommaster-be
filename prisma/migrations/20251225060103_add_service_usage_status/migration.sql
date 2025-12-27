-- CreateEnum
CREATE TYPE "ServiceUsageStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ServiceUsage" ADD COLUMN     "status" "ServiceUsageStatus" NOT NULL DEFAULT 'PENDING';
