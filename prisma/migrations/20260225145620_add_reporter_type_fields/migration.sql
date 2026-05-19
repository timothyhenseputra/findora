-- AlterTable
ALTER TABLE "LostReport" ADD COLUMN     "nonStudentId" TEXT,
ADD COLUMN     "reporterType" TEXT NOT NULL DEFAULT 'Mahasiswa',
ALTER COLUMN "nim" DROP NOT NULL;
