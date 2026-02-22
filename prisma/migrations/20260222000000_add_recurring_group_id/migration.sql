-- AlterTable
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "recurringGroupId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Class_recurringGroupId_idx" ON "Class"("recurringGroupId");
