-- AlterTable
ALTER TABLE "guest_folios" ADD COLUMN     "stayDetailId" INTEGER;

-- AddForeignKey
ALTER TABLE "guest_folios" ADD CONSTRAINT "guest_folios_stayDetailId_fkey" FOREIGN KEY ("stayDetailId") REFERENCES "stay_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
