/*
  Warnings:

  - Added the required column `player_number` to the `players_on_matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "players_on_matches" ADD COLUMN     "player_number" INTEGER NOT NULL;
