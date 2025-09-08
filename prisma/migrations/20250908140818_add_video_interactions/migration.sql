-- CreateTable
CREATE TABLE "public"."video_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_likes_userId_lawyerId_videoUrl_key" ON "public"."video_likes"("userId", "lawyerId", "videoUrl");

-- AddForeignKey
ALTER TABLE "public"."video_likes" ADD CONSTRAINT "video_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_likes" ADD CONSTRAINT "video_likes_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_comments" ADD CONSTRAINT "video_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_comments" ADD CONSTRAINT "video_comments_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
