-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "coverImageUrl" TEXT NOT NULL DEFAULT '/uploads/default-cover.svg',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "durationDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "estimatedBudget" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "originalItineraryId" TEXT,
ADD COLUMN     "travelStyle" TEXT NOT NULL DEFAULT 'Budget trip',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "passwordHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "itineraryDayId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "locationName" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "estimatedCost" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'Activity',
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItinerary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItineraryDay_itineraryId_idx" ON "ItineraryDay"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_itineraryId_dayNumber_key" ON "ItineraryDay"("itineraryId", "dayNumber");

-- CreateIndex
CREATE INDEX "Activity_itineraryDayId_orderIndex_idx" ON "Activity"("itineraryDayId", "orderIndex");

-- CreateIndex
CREATE INDEX "SavedItinerary_itineraryId_idx" ON "SavedItinerary"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedItinerary_userId_itineraryId_key" ON "SavedItinerary"("userId", "itineraryId");

-- CreateIndex
CREATE INDEX "Like_itineraryId_idx" ON "Like"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_itineraryId_key" ON "Like"("userId", "itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Itinerary_destination_idx" ON "Itinerary"("destination");

-- CreateIndex
CREATE INDEX "Itinerary_travelStyle_idx" ON "Itinerary"("travelStyle");

-- CreateIndex
CREATE INDEX "Itinerary_isPublished_createdAt_idx" ON "Itinerary"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_originalItineraryId_fkey" FOREIGN KEY ("originalItineraryId") REFERENCES "Itinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_itineraryDayId_fkey" FOREIGN KEY ("itineraryDayId") REFERENCES "ItineraryDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItinerary" ADD CONSTRAINT "SavedItinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItinerary" ADD CONSTRAINT "SavedItinerary_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
