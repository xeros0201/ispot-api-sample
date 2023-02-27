/*
  Warnings:

  - Added the required column `updated_date` to the `leagues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_date` to the `seasons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leagues" ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_user_id" UUID,
ADD COLUMN     "updated_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_user_id" UUID;

-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_user_id" UUID,
ADD COLUMN     "updated_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_user_id" UUID;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_created_user_id_fkey" FOREIGN KEY ("created_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_updated_user_id_fkey" FOREIGN KEY ("updated_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_created_user_id_fkey" FOREIGN KEY ("created_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_updated_user_id_fkey" FOREIGN KEY ("updated_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
