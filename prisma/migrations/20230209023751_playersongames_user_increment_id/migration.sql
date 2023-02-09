/*
  Warnings:

  - The primary key for the `PlayersOnGames` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "PlayersOnGames" DROP CONSTRAINT "PlayersOnGames_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PlayersOnGames_pkey" PRIMARY KEY ("id");
