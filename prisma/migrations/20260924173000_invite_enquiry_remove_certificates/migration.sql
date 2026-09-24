-- Remove Excel/certificate verification system; add enquiry + invitation onboarding

-- Drop certificate artefacts
ALTER TABLE "lawyer_verifications" DROP COLUMN IF EXISTS "certificateVerified";
ALTER TABLE "lawyer_verifications" DROP COLUMN IF EXISTS "certificateNumber";
ALTER TABLE "lawyer_verifications" DROP COLUMN IF EXISTS "certificateName";
ALTER TABLE "lawyer_verifications" DROP COLUMN IF EXISTS "certificateIssueDate";
ALTER TABLE "lawyer_verifications" DROP COLUMN IF EXISTS "certificateMatchScore";
ALTER TABLE "lawyers" DROP COLUMN IF EXISTS "certificateNumber";
ALTER TABLE "lawyers" DROP COLUMN IF EXISTS "certificateVerified";
ALTER TABLE "lawyers" DROP COLUMN IF EXISTS "certificateVerifiedAt";
DROP TABLE IF EXISTS "certificates";

-- Create enums
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'NEEDS_INFO', 'INVITED', 'REJECTED');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "lawyer_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyer_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "firm" TEXT,
    "location" TEXT,
    "practiceAreas" TEXT[] NOT NULL DEFAULT '{}',
    "barNumber" TEXT,
    "barAdmissionYear" TEXT,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "refToken" TEXT NOT NULL,
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "invitationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_invitations_tokenHash_key" ON "lawyer_invitations"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_refToken_key" ON "enquiries"("refToken");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_invitationId_key" ON "enquiries"("invitationId");

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "lawyer_invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
