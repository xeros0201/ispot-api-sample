/*
  Warnings:

  - Added the required column `updated_date` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_user_id" UUID,
ADD COLUMN     "updated_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_user_id" UUID;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_created_user_id_fkey" FOREIGN KEY ("created_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_updated_user_id_fkey" FOREIGN KEY ("updated_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
