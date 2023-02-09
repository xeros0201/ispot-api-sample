/*
  Warnings:

  - You are about to drop the column `awayScore` on the `Games` table. All the data in the column will be lost.
  - You are about to drop the column `homeScore` on the `Games` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Games" DROP COLUMN "awayScore",
DROP COLUMN "homeScore";

-- CreateTable
CREATE TABLE "PlayersOnGames" (
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "PlayersOnGames_pkey" PRIMARY KEY ("gameId","playerId","teamId")
);

-- AddForeignKey
ALTER TABLE "PlayersOnGames" ADD CONSTRAINT "PlayersOnGames_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersOnGames" ADD CONSTRAINT "PlayersOnGames_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersOnGames" ADD CONSTRAINT "PlayersOnGames_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
