-- AlterTable
ALTER TABLE "public"."messages" ADD COLUMN     "messageType" TEXT NOT NULL DEFAULT 'message',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
