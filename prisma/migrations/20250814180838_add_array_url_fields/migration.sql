/*
  Warnings:

  - The values [INFO,WARNING] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('BAR_CERTIFICATE', 'PRACTICING_CERTIFICATE', 'ID_DOCUMENT', 'CV_RESUME', 'LAW_DEGREE', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."NotificationType_new" AS ENUM ('APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'APPOINTMENT_REQUEST', 'APPOINTMENT_RESCHEDULED', 'LAWYER_VERIFICATION_PENDING', 'LAWYER_VERIFICATION_APPROVED', 'LAWYER_VERIFICATION_REJECTED', 'DOCUMENT_SUBMITTED', 'DOCUMENT_REVIEW_REQUIRED');
ALTER TABLE "public"."notifications" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."notifications" ALTER COLUMN "type" TYPE "public"."NotificationType_new" USING ("type"::text::"public"."NotificationType_new");
ALTER TYPE "public"."NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "public"."NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
ALTER TABLE "public"."notifications" ALTER COLUMN "type" SET DEFAULT 'APPOINTMENT_CONFIRMED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."lawyers" ADD COLUMN     "barCertificateUrl" TEXT[],
ADD COLUMN     "certificateNumber" TEXT,
ADD COLUMN     "certificateVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificateVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "cvResumeUrl" TEXT[],
ADD COLUMN     "idDocumentUrl" TEXT[],
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lawDegreeUrl" TEXT[],
ADD COLUMN     "otherDocumentUrl" TEXT[],
ADD COLUMN     "practicingCertificateUrl" TEXT[],
ADD COLUMN     "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "videoUrl" TEXT[];

-- AlterTable
ALTER TABLE "public"."notifications" ALTER COLUMN "type" SET DEFAULT 'APPOINTMENT_CONFIRMED';

-- CreateTable
CREATE TABLE "public"."lawyer_verifications" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "certificateVerified" BOOLEAN NOT NULL DEFAULT false,
    "certificateNumber" TEXT,
    "certificateName" TEXT,
    "certificateIssueDate" TIMESTAMP(3),
    "certificateMatchScore" DOUBLE PRECISION,
    "documentsSubmitted" "public"."DocumentType"[],
    "documentsVerified" "public"."DocumentType"[],
    "documentsRejected" "public"."DocumentType"[],
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "resubmissionCount" INTEGER NOT NULL DEFAULT 0,
    "lastResubmissionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyer_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_verifications_lawyerId_key" ON "public"."lawyer_verifications"("lawyerId");

-- AddForeignKey
ALTER TABLE "public"."lawyer_verifications" ADD CONSTRAINT "lawyer_verifications_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
