/*
  Warnings:

  - You are about to drop the column `role` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "role";

-- DropEnum
DROP TYPE "Role";
