import { getCurrentUser } from "@/lib/auth";
import { getPublishedItineraries, getUserState } from "@/lib/itineraries";
import { JalaninApp } from "@/components/jalanin-app";
import { serializeItinerary, serializeUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [currentUser, itineraries] = await Promise.all([getCurrentUser(), getPublishedItineraries()]);
  const userState = await getUserState(currentUser?.id);

  return (
    <JalaninApp
      itineraries={itineraries.map(serializeItinerary)}
      currentUser={currentUser ? serializeUser(currentUser) : null}
      savedIds={userState.savedIds}
      likedIds={userState.likedIds}
    />
  );
}
