-- DropForeignKey
ALTER TABLE "Matching" DROP CONSTRAINT "Matching_foundItemId_fkey";

-- DropForeignKey
ALTER TABLE "Matching" DROP CONSTRAINT "Matching_lostReportId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_foundItemId_fkey";

-- AlterTable
ALTER TABLE "FoundItem" ADD COLUMN     "aiGeneratedDescription" TEXT;

-- AlterTable
ALTER TABLE "Matching" ADD COLUMN     "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchingScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "lostReportId" INTEGER,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "FoundItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_lostReportId_fkey" FOREIGN KEY ("lostReportId") REFERENCES "LostReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matching" ADD CONSTRAINT "Matching_lostReportId_fkey" FOREIGN KEY ("lostReportId") REFERENCES "LostReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matching" ADD CONSTRAINT "Matching_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "FoundItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
