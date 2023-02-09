/*
  Warnings:

  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `locationId` on table `Games` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_locationId_fkey";

-- AlterTable
ALTER TABLE "Games" ALTER COLUMN "locationId" SET NOT NULL;

-- DropTable
DROP TABLE "Location";

-- CreateTable
CREATE TABLE "Locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Locations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
