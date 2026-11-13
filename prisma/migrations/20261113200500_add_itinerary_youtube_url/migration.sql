ALTER TABLE "Itinerary" ADD COLUMN "youtubeUrl" TEXT;

CREATE UNIQUE INDEX "Itinerary_youtubeUrl_key" ON "Itinerary"("youtubeUrl");

