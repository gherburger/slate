/*
  Warnings:

  - A unique constraint covering the columns `[orgId,platformKey,date]` on the table `SpendEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `platformKey` to the `SpendEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpendEntry" ADD COLUMN     "platformKey" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "SpendEntry_orgId_platformKey_date_idx" ON "SpendEntry"("orgId", "platformKey", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SpendEntry_orgId_platformKey_date_key" ON "SpendEntry"("orgId", "platformKey", "date");
