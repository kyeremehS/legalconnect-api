/*
  Warnings:

  - You are about to drop the column `experince` on the `Lawyer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Lawyer" DROP COLUMN "experince",
ADD COLUMN     "experience" INTEGER;
