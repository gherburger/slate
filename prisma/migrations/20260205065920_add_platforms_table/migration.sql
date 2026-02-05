/*
  Warnings:

  - You are about to drop the column `platform` on the `SpendEntry` table. All the data in the column will be lost.
  - Added the required column `platformId` to the `SpendEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SpendEntry_orgId_platform_date_idx";

-- AlterTable
ALTER TABLE "SpendEntry" DROP COLUMN "platform",
ADD COLUMN     "platformId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Platform_orgId_idx" ON "Platform"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_orgId_name_key" ON "Platform"("orgId", "name");

-- CreateIndex
CREATE INDEX "SpendEntry_orgId_platformId_date_idx" ON "SpendEntry"("orgId", "platformId", "date");

-- AddForeignKey
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendEntry" ADD CONSTRAINT "SpendEntry_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
