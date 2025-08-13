/*
  Warnings:

  - You are about to drop the column `userId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the `Lawyer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `clientId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lawyerId` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MeetingType" AS ENUM ('VIRTUAL', 'IN_PERSON', 'PHONE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('APPOINTMENT_REQUEST', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'INFO', 'WARNING');

-- AlterEnum
ALTER TYPE "public"."AppointmentStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "public"."Lawyer" DROP CONSTRAINT "Lawyer_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."appointments" DROP CONSTRAINT "appointments_userId_fkey";

-- AlterTable
ALTER TABLE "public"."appointments" DROP COLUMN "userId",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "lawyerId" TEXT NOT NULL,
ADD COLUMN     "meetingLink" TEXT,
ADD COLUMN     "meetingType" "public"."MeetingType" NOT NULL DEFAULT 'VIRTUAL',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "practiceArea" TEXT;

-- DropTable
DROP TABLE "public"."Lawyer";

-- CreateTable
CREATE TABLE "public"."lawyer_availability" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyer_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lawyers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalSummary" TEXT,
    "firm" TEXT NOT NULL,
    "location" TEXT,
    "barAdmissionYear" TEXT,
    "experience" INTEGER,
    "practiceAreas" TEXT[],
    "education" TEXT,
    "barAssociation" TEXT,
    "website" TEXT,
    "specializations" TEXT[],
    "languages" TEXT[],

    CONSTRAINT "lawyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."certificates" (
    "id" SERIAL NOT NULL,
    "nameOfLawyer" TEXT NOT NULL,
    "dateOfIssue" TIMESTAMP(3) NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_availability_lawyerId_dayOfWeek_key" ON "public"."lawyer_availability"("lawyerId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_userId_key" ON "public"."lawyers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNumber_key" ON "public"."certificates"("certificateNumber");

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lawyer_availability" ADD CONSTRAINT "lawyer_availability_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lawyers" ADD CONSTRAINT "lawyers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
