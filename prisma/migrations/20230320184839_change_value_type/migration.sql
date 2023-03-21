/*
  Warnings:

  - The `value` column on the `reports_on_afl_results` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "players_on_afl_results" ALTER COLUMN "value" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "reports_on_afl_results" DROP COLUMN "value",
ADD COLUMN     "value" DOUBLE PRECISION[];
