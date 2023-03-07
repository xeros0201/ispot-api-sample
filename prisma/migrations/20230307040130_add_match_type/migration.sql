-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('REGULAR', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "type" "MatchType" NOT NULL DEFAULT 'REGULAR';
