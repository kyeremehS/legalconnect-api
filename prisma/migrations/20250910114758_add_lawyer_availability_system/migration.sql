/*
  Warnings:

  - You are about to drop the column `isActive` on the `lawyer_availability` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."appointments" DROP CONSTRAINT "appointments_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."lawyer_availability" DROP CONSTRAINT "lawyer_availability_lawyerId_fkey";

-- AlterTable
ALTER TABLE "public"."appointments" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."lawyer_availability" DROP COLUMN "isActive",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."lawyers" ADD COLUMN     "defaultAvailability" JSONB,
ADD COLUMN     "isAvailableForBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'GMT';

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lawyer_availability" ADD CONSTRAINT "lawyer_availability_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
