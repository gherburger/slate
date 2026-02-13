-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('EXTERNAL', 'INTERNAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'EXTERNAL';
