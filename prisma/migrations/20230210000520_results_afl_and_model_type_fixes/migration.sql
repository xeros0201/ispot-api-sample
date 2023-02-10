/*
  Warnings:

  - You are about to drop the `Games` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlayersOnGames` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GamesToPlayers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_awayTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_homeTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_teamsId_fkey";

-- DropForeignKey
ALTER TABLE "PlayersOnGames" DROP CONSTRAINT "PlayersOnGames_gameId_fkey";

-- DropForeignKey
ALTER TABLE "PlayersOnGames" DROP CONSTRAINT "PlayersOnGames_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayersOnGames" DROP CONSTRAINT "PlayersOnGames_teamId_fkey";

-- DropForeignKey
ALTER TABLE "_GamesToPlayers" DROP CONSTRAINT "_GamesToPlayers_A_fkey";

-- DropForeignKey
ALTER TABLE "_GamesToPlayers" DROP CONSTRAINT "_GamesToPlayers_B_fkey";

-- DropTable
DROP TABLE "Games";

-- DropTable
DROP TABLE "PlayersOnGames";

-- DropTable
DROP TABLE "_GamesToPlayers";

-- CreateTable
CREATE TABLE "Matches" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "teamsId" INTEGER,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "Matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayersOnMatches" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "PlayersOnMatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultsAfl" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,

    CONSTRAINT "ResultsAfl_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_teamsId_fkey" FOREIGN KEY ("teamsId") REFERENCES "Teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersOnMatches" ADD CONSTRAINT "PlayersOnMatches_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersOnMatches" ADD CONSTRAINT "PlayersOnMatches_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersOnMatches" ADD CONSTRAINT "PlayersOnMatches_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultsAfl" ADD CONSTRAINT "ResultsAfl_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
