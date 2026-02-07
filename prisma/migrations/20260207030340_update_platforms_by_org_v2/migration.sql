/*
  Warnings:

  - You are about to drop the column `platformKey` on the `SpendEntry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orgId,key]` on the table `Platform` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,platformId,date]` on the table `SpendEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlatformScope" AS ENUM ('GLOBAL', 'ORG');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('META', 'GOOGLE_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS', 'AMAZON_ADS');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'ERROR');

-- DropIndex
DROP INDEX "Platform_key_key";

-- DropIndex
DROP INDEX "SpendEntry_orgId_platformKey_date_idx";

-- DropIndex
DROP INDEX "SpendEntry_orgId_platformKey_date_key";

-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "orgId" TEXT,
ADD COLUMN     "provider" "IntegrationProvider",
ADD COLUMN     "scope" "PlatformScope" NOT NULL DEFAULT 'ORG',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SpendEntry" DROP COLUMN "platformKey";

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "externalAccountId" TEXT,
    "accessTokenCiphertext" TEXT,
    "refreshTokenCiphertext" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationConnection_orgId_provider_idx" ON "IntegrationConnection"("orgId", "provider");

-- CreateIndex
CREATE INDEX "IntegrationConnection_status_idx" ON "IntegrationConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_orgId_provider_key" ON "IntegrationConnection"("orgId", "provider");

-- CreateIndex
CREATE INDEX "Platform_orgId_idx" ON "Platform"("orgId");

-- CreateIndex
CREATE INDEX "Platform_scope_provider_idx" ON "Platform"("scope", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_orgId_key_key" ON "Platform"("orgId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SpendEntry_orgId_platformId_date_key" ON "SpendEntry"("orgId", "platformId", "date");

-- AddForeignKey
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
