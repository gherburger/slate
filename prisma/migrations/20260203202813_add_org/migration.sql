/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Org` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `Org` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Org" ADD COLUMN     "externalId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Org_externalId_key" ON "Org"("externalId");
