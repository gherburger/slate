-- Add GOOGLE_SHEETS provider
ALTER TYPE "IntegrationProvider" ADD VALUE 'GOOGLE_SHEETS';

-- Move connections from org-level to membership-level scope
ALTER TABLE "IntegrationConnection" ADD COLUMN "userId" TEXT;

-- Backfill legacy rows to one existing member per org (prefer ADMIN, then EDITOR, then VIEWER)
UPDATE "IntegrationConnection" AS ic
SET "userId" = (
  SELECT m."userId"
  FROM "Membership" m
  WHERE m."orgId" = ic."orgId"
  ORDER BY
    CASE m."role"
      WHEN 'ADMIN' THEN 1
      WHEN 'EDITOR' THEN 2
      ELSE 3
    END,
    m."createdAt" ASC
  LIMIT 1
)
WHERE ic."userId" IS NULL;

-- If an org has no memberships, drop orphaned legacy connections.
DELETE FROM "IntegrationConnection"
WHERE "userId" IS NULL;

DROP INDEX IF EXISTS "IntegrationConnection_orgId_provider_idx";
DROP INDEX IF EXISTS "IntegrationConnection_orgId_provider_key";

ALTER TABLE "IntegrationConnection"
ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "IntegrationConnection_orgId_userId_provider_idx"
ON "IntegrationConnection"("orgId", "userId", "provider");

CREATE UNIQUE INDEX "IntegrationConnection_orgId_userId_provider_key"
ON "IntegrationConnection"("orgId", "userId", "provider");

ALTER TABLE "IntegrationConnection"
ADD CONSTRAINT "IntegrationConnection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
