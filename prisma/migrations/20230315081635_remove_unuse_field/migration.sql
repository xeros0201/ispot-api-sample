/*
  Warnings:

  - You are about to drop the column `team_id` on the `matches` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_team_id_fkey";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "team_id";
