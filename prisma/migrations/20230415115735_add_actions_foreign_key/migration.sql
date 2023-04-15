-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_away_team_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_home_team_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_location_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_season_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_matches" DROP CONSTRAINT "players_on_matches_match_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_matches" DROP CONSTRAINT "players_on_matches_player_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_matches" DROP CONSTRAINT "players_on_matches_team_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_team_reports" DROP CONSTRAINT "players_on_team_reports_player_id_fkey";

-- DropForeignKey
ALTER TABLE "players_on_team_reports" DROP CONSTRAINT "players_on_team_reports_result_property_id_fkey";

-- DropForeignKey
ALTER TABLE "reports_on_matches" DROP CONSTRAINT "reports_on_matches_match_id_fkey";

-- DropForeignKey
ALTER TABLE "reports_on_matches" DROP CONSTRAINT "reports_on_matches_result_property_id_fkey";

-- DropForeignKey
ALTER TABLE "team_reports" DROP CONSTRAINT "team_reports_match_id_fkey";

-- DropForeignKey
ALTER TABLE "team_reports" DROP CONSTRAINT "team_reports_team_id_fkey";

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_reports" ADD CONSTRAINT "team_reports_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_reports" ADD CONSTRAINT "team_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_matches" ADD CONSTRAINT "players_on_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_matches" ADD CONSTRAINT "players_on_matches_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_matches" ADD CONSTRAINT "players_on_matches_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_on_matches" ADD CONSTRAINT "reports_on_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_on_matches" ADD CONSTRAINT "reports_on_matches_result_property_id_fkey" FOREIGN KEY ("result_property_id") REFERENCES "result_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_team_reports" ADD CONSTRAINT "players_on_team_reports_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_on_team_reports" ADD CONSTRAINT "players_on_team_reports_result_property_id_fkey" FOREIGN KEY ("result_property_id") REFERENCES "result_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
