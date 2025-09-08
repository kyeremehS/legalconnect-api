-- CreateTable
CREATE TABLE "public"."video_views" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "lawyerId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,

    CONSTRAINT "video_views_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."video_views" ADD CONSTRAINT "video_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_views" ADD CONSTRAINT "video_views_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
