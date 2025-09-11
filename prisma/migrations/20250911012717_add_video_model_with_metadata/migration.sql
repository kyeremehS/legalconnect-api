/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `video_comments` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `video_likes` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `video_views` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,videoId]` on the table `video_likes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `videoId` to the `video_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoId` to the `video_likes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoId` to the `video_views` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."VideoStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROCESSING', 'FAILED');

-- CreateTable: Create the videos table first
CREATE TABLE "public"."videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "language" TEXT NOT NULL DEFAULT 'English',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "duration" TEXT DEFAULT '0:00',
    "thumbnail" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."VideoStatus" NOT NULL DEFAULT 'ACTIVE',
    "lawyerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for videos table
ALTER TABLE "public"."videos" ADD CONSTRAINT "videos_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 1: Create Video records from existing videoUrl data in lawyers table
-- Insert videos from lawyer videoUrl arrays
INSERT INTO "public"."videos" ("id", "title", "description", "category", "language", "tags", "url", "key", "lawyerId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() as "id",
    'Legal Video Content' as "title",
    'Educational video content from ' || COALESCE(l."firm", 'Legal Professional') as "description",
    'General' as "category",
    'English' as "language",
    ARRAY[]::TEXT[] as "tags",
    video_url as "url",
    video_url as "key", -- Using URL as key for now
    l."id" as "lawyerId",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM "public"."lawyers" l
CROSS JOIN LATERAL unnest(l."videoUrl") AS video_url
WHERE l."videoUrl" IS NOT NULL AND array_length(l."videoUrl", 1) > 0;

-- Step 2: Add videoId columns to interaction tables (nullable first)
ALTER TABLE "public"."video_comments" ADD COLUMN "videoId" TEXT;
ALTER TABLE "public"."video_likes" ADD COLUMN "videoId" TEXT;
ALTER TABLE "public"."video_views" ADD COLUMN "videoId" TEXT;

-- Step 3: Populate videoId from videoUrl by matching with videos table
UPDATE "public"."video_comments" 
SET "videoId" = v."id"
FROM "public"."videos" v
WHERE "public"."video_comments"."videoUrl" = v."url";

UPDATE "public"."video_likes" 
SET "videoId" = v."id"
FROM "public"."videos" v
WHERE "public"."video_likes"."videoUrl" = v."url";

UPDATE "public"."video_views" 
SET "videoId" = v."id"
FROM "public"."videos" v
WHERE "public"."video_views"."videoUrl" = v."url";

-- Step 4: Make videoId columns NOT NULL after population
ALTER TABLE "public"."video_comments" ALTER COLUMN "videoId" SET NOT NULL;
ALTER TABLE "public"."video_likes" ALTER COLUMN "videoId" SET NOT NULL;
ALTER TABLE "public"."video_views" ALTER COLUMN "videoId" SET NOT NULL;

-- Step 5: Drop old index and create new ones
DROP INDEX IF EXISTS "public"."video_likes_userId_lawyerId_videoUrl_key";

-- Step 6: Drop videoUrl columns
ALTER TABLE "public"."video_comments" DROP COLUMN "videoUrl";
ALTER TABLE "public"."video_likes" DROP COLUMN "videoUrl";
ALTER TABLE "public"."video_views" DROP COLUMN "videoUrl";

-- Step 7: Create new indexes and foreign keys
CREATE UNIQUE INDEX "video_likes_userId_videoId_key" ON "public"."video_likes"("userId", "videoId");

-- Add foreign keys
ALTER TABLE "public"."video_likes" ADD CONSTRAINT "video_likes_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."video_comments" ADD CONSTRAINT "video_comments_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."video_views" ADD CONSTRAINT "video_views_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
