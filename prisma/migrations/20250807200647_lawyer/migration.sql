-- CreateTable
CREATE TABLE "public"."Lawyer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalSummary" TEXT,
    "firm" TEXT NOT NULL,
    "location" TEXT,
    "barAdmissionYear" TEXT,
    "experince" INTEGER,
    "practiceAreas" TEXT[],
    "education" TEXT,
    "barAssociation" TEXT,
    "website" TEXT,
    "specializations" TEXT[],
    "languages" TEXT[],

    CONSTRAINT "Lawyer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_userId_key" ON "public"."Lawyer"("userId");

-- AddForeignKey
ALTER TABLE "public"."Lawyer" ADD CONSTRAINT "Lawyer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
