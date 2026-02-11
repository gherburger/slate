-- CreateTable
CREATE TABLE "EditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "editDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousAmountCents" INTEGER NOT NULL,
    "newAmountCents" INTEGER NOT NULL,

    CONSTRAINT "EditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditLog_orgId_platformId_idx" ON "EditLog"("orgId", "platformId");

-- CreateIndex
CREATE INDEX "EditLog_userId_idx" ON "EditLog"("userId");

-- AddForeignKey
ALTER TABLE "EditLog" ADD CONSTRAINT "EditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditLog" ADD CONSTRAINT "EditLog_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditLog" ADD CONSTRAINT "EditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
