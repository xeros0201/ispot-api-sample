/*
  Warnings:

  - You are about to drop the `reports_on_afl_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reports_on_afl_results" DROP CONSTRAINT "reports_on_afl_results_afl_result_id_fkey";

-- DropForeignKey
ALTER TABLE "reports_on_afl_results" DROP CONSTRAINT "reports_on_afl_results_afl_result_property_id_fkey";

-- DropTable
DROP TABLE "reports_on_afl_results";

-- CreateTable
CREATE TABLE "reports_on_matches" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "afl_result_property_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION[],

    CONSTRAINT "reports_on_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_on_matches_match_id_afl_result_property_id_idx" ON "reports_on_matches"("match_id", "afl_result_property_id");

-- AddForeignKey
ALTER TABLE "reports_on_matches" ADD CONSTRAINT "reports_on_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_on_matches" ADD CONSTRAINT "reports_on_matches_afl_result_property_id_fkey" FOREIGN KEY ("afl_result_property_id") REFERENCES "afl_result_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
