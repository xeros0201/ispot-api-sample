/*
  Warnings:

  - You are about to drop the `afl_result_criterias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `criterias_on_afl_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AFLResultPropertyType" AS ENUM ('PLAYER', 'MATCH');

-- DropForeignKey
ALTER TABLE "criterias_on_afl_results" DROP CONSTRAINT "criterias_on_afl_results_afl_result_criteria_id_fkey";

-- DropForeignKey
ALTER TABLE "criterias_on_afl_results" DROP CONSTRAINT "criterias_on_afl_results_afl_result_id_fkey";

-- DropForeignKey
ALTER TABLE "criterias_on_afl_results" DROP CONSTRAINT "criterias_on_afl_results_player_id_fkey";

-- DropTable
DROP TABLE "afl_result_criterias";

-- DropTable
DROP TABLE "criterias_on_afl_results";

-- CreateTable
CREATE TABLE "afl_result_properties" (
    "id" SERIAL NOT NULL,
    "type" "AFLResultPropertyType" NOT NULL,
    "name" TEXT NOT NULL,
    "alias" TEXT,
    "parent_id" INTEGER,

    CONSTRAINT "afl_result_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports_on_afl_results" (
    "id" SERIAL NOT NULL,
    "afl_result_id" INTEGER NOT NULL,
    "afl_result_property_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "reports_on_afl_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players_on_afl_results" (
    "id" SERIAL NOT NULL,
    "afl_result_id" INTEGER NOT NULL,
    "afl_result_property_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "players_on_afl_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_on_afl_results_afl_result_id_afl_result_property_id_idx" ON "reports_on_afl_results"("afl_result_id", "afl_result_property_id");

-- CreateIndex
CREATE INDEX "players_on_afl_results_afl_result_id_afl_result_property_id_idx" ON "players_on_afl_results"("afl_result_id", "afl_result_property_id", "player_id");

-- AddForeignKey
ALTER TABLE "afl_result_properties" ADD CONSTRAINT "afl_result_properties_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "afl_result_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_on_afl_results" ADD CONSTRAINT "reports_on_afl_results_afl_result_id_fkey" FOREIGN KEY ("afl_result_id") REFERENCES "afl_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_on_afl_results" ADD CONSTRAINT "reports_on_afl_results_afl_result_property_id_fkey" FOREIGN KEY ("afl_result_property_id") REFERENCES "afl_result_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_afl_results" ADD CONSTRAINT "players_on_afl_results_afl_result_id_fkey" FOREIGN KEY ("afl_result_id") REFERENCES "afl_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_afl_results" ADD CONSTRAINT "players_on_afl_results_afl_result_property_id_fkey" FOREIGN KEY ("afl_result_property_id") REFERENCES "afl_result_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_afl_results" ADD CONSTRAINT "players_on_afl_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
