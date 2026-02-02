-- DropForeignKey
ALTER TABLE "SpendEntry" DROP CONSTRAINT "SpendEntry_createdByUserId_fkey";

-- AlterTable
ALTER TABLE "SpendEntry" ALTER COLUMN "createdByUserId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "SpendAudit_actorUserId_createdAt_idx" ON "SpendAudit"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "SpendEntry" ADD CONSTRAINT "SpendEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendAudit" ADD CONSTRAINT "SpendAudit_spendEntryId_fkey" FOREIGN KEY ("spendEntryId") REFERENCES "SpendEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
