/*
  Warnings:

  - The `score_secondary` column on the `afl_results` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ResultPropertyType" AS ENUM ('MATCH', 'PLAYER');

-- AlterTable
ALTER TABLE "afl_results" ALTER COLUMN "score_primary" SET DEFAULT 0,
ALTER COLUMN "score_primary" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "score_secondary",
ADD COLUMN     "score_secondary" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "result_properties" (
    "id" SERIAL NOT NULL,
    "type" "ResultPropertyType" NOT NULL,
    "name" TEXT NOT NULL,
    "alias" TEXT,
    "sport_id" INTEGER NOT NULL,
    "parent_id" INTEGER,

    CONSTRAINT "result_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports_on_matches" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "result_property_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION[],

    CONSTRAINT "reports_on_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players_on_afl_results" (
    "id" SERIAL NOT NULL,
    "afl_result_id" INTEGER NOT NULL,
    "result_property_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "players_on_afl_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_on_matches_match_id_result_property_id_idx" ON "reports_on_matches"("match_id", "result_property_id");

-- CreateIndex
CREATE INDEX "players_on_afl_results_afl_result_id_result_property_id_pla_idx" ON "players_on_afl_results"("afl_result_id", "result_property_id", "player_id");

-- AddForeignKey
ALTER TABLE "result_properties" ADD CONSTRAINT "result_properties_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_properties" ADD CONSTRAINT "result_properties_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "result_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_on_matches" ADD CONSTRAINT "reports_on_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_on_matches" ADD CONSTRAINT "reports_on_matches_result_property_id_fkey" FOREIGN KEY ("result_property_id") REFERENCES "result_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_afl_results" ADD CONSTRAINT "players_on_afl_results_afl_result_id_fkey" FOREIGN KEY ("afl_result_id") REFERENCES "afl_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_afl_results" ADD CONSTRAINT "players_on_afl_results_result_property_id_fkey" FOREIGN KEY ("result_property_id") REFERENCES "result_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_afl_results" ADD CONSTRAINT "players_on_afl_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
