/*
  Warnings:

  - You are about to drop the column `score_primary` on the `afl_results` table. All the data in the column will be lost.
  - You are about to drop the column `score_secondary` on the `afl_results` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "afl_results" DROP COLUMN "score_primary",
DROP COLUMN "score_secondary",
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_behind" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_goal" INTEGER NOT NULL DEFAULT 0;
