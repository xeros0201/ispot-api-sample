/*
  Warnings:

  - You are about to drop the `afl_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `players_on_afl_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "afl_results" DROP CONSTRAINT "afl_results_match_id_fkey";

-- DropForeignKey
ALTER TABLE "afl_results" DROP CONSTRAINT "afl_results_team_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_afl_results" DROP CONSTRAINT "players_on_afl_results_afl_result_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_afl_results" DROP CONSTRAINT "players_on_afl_results_player_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_afl_results" DROP CONSTRAINT "players_on_afl_results_result_property_id_fkey";

-- DropTable
DROP TABLE "afl_results";

-- DropTable
DROP TABLE "players_on_afl_results";

-- CreateTable
CREATE TABLE "team_reports" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "meta" JSONB,

    CONSTRAINT "team_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players_on_team_reports" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "team_report_id" INTEGER NOT NULL,
    "result_property_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "players_on_team_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "players_on_team_reports_player_id_team_report_id_result_pro_idx" ON "players_on_team_reports"("player_id", "team_report_id", "result_property_id");

-- AddForeignKey
ALTER TABLE "team_reports" ADD CONSTRAINT "team_reports_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_reports" ADD CONSTRAINT "team_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_team_reports" ADD CONSTRAINT "players_on_team_reports_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_team_reports" ADD CONSTRAINT "players_on_team_reports_team_report_id_fkey" FOREIGN KEY ("team_report_id") REFERENCES "team_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_team_reports" ADD CONSTRAINT "players_on_team_reports_result_property_id_fkey" FOREIGN KEY ("result_property_id") REFERENCES "result_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
