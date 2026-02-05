/*
  Warnings:

  - You are about to drop the column `orgId` on the `Platform` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `Platform` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Platform" DROP CONSTRAINT "Platform_orgId_fkey";

-- DropIndex
DROP INDEX "Platform_orgId_idx";

-- DropIndex
DROP INDEX "Platform_orgId_key_key";

-- DropIndex
DROP INDEX "Platform_orgId_name_key";

-- AlterTable
ALTER TABLE "Platform" DROP COLUMN "orgId";

-- CreateIndex
CREATE UNIQUE INDEX "Platform_key_key" ON "Platform"("key");
