/*
  Warnings:

  - A unique constraint covering the columns `[orgId,key]` on the table `Platform` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `Platform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Platform_orgId_key_key" ON "Platform"("orgId", "key");
