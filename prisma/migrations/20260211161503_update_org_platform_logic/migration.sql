/*
  Warnings:

  - You are about to drop the column `scope` on the `Platform` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orgId,name]` on the table `Platform` will be added. If there are existing duplicate values, this will fail.
  - Made the column `orgId` on table `Platform` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Platform" DROP CONSTRAINT "Platform_orgId_fkey";

-- DropIndex
DROP INDEX "Platform_scope_provider_idx";

-- AlterTable
ALTER TABLE "Platform" DROP COLUMN "scope",
ALTER COLUMN "orgId" SET NOT NULL;

-- DropEnum
DROP TYPE "PlatformScope";

-- CreateIndex
CREATE INDEX "Platform_provider_idx" ON "Platform"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_orgId_name_key" ON "Platform"("orgId", "name");

-- AddForeignKey
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
