/*
  Warnings:

  - The `score_secondary` column on the `afl_results` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "afl_results" ALTER COLUMN "score_primary" SET DEFAULT 0,
ALTER COLUMN "score_primary" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "score_secondary",
ADD COLUMN     "score_secondary" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "afl_result_criterias" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "index_in_csv" INTEGER NOT NULL,

    CONSTRAINT "afl_result_criterias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterias_on_afl_results" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "afl_result_id" INTEGER NOT NULL,
    "afl_result_criteria_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "criterias_on_afl_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "criterias_on_afl_results_player_id_afl_result_id_afl_result_idx" ON "criterias_on_afl_results"("player_id", "afl_result_id", "afl_result_criteria_id");

-- AddForeignKey
ALTER TABLE "criterias_on_afl_results" ADD CONSTRAINT "criterias_on_afl_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterias_on_afl_results" ADD CONSTRAINT "criterias_on_afl_results_afl_result_id_fkey" FOREIGN KEY ("afl_result_id") REFERENCES "afl_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterias_on_afl_results" ADD CONSTRAINT "criterias_on_afl_results_afl_result_criteria_id_fkey" FOREIGN KEY ("afl_result_criteria_id") REFERENCES "afl_result_criterias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
