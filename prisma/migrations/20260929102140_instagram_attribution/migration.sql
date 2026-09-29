-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TELEGRAM', 'GOOGLE', 'YANDEX', 'YOUTUBE', 'DIRECT', 'REFERRAL', 'OTHER');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "channel" "Channel" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "landingPage" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "referrerHost" TEXT,
    "landingPath" TEXT NOT NULL,
    "locale" TEXT,
    "device" TEXT NOT NULL,
    "inApp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Visit_sessionId_key" ON "Visit"("sessionId");

-- CreateIndex
CREATE INDEX "Visit_channel_createdAt_idx" ON "Visit"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_utmCampaign_idx" ON "Visit"("utmCampaign");

-- CreateIndex
CREATE INDEX "Lead_channel_createdAt_idx" ON "Lead"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_utmCampaign_idx" ON "Lead"("utmCampaign");
