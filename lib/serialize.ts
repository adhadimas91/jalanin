import type { getPublishedItineraries } from "./itineraries";

const UNCLAIMED_EMAIL_DOMAIN = "@kurasi.jalanin.local";

export function serializeUser(user: {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  role?: string | null;
  isPro?: boolean | null;
  isClaimed?: boolean | null;
}) {
  const isPlaceholderEmail =
    typeof user.email === "string" &&
    user.email.toLowerCase().endsWith(UNCLAIMED_EMAIL_DOMAIN);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: isPlaceholderEmail ? "" : user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    city: user.city,
    role: user.role ?? "USER",
    isPro: !!user.isPro,
    isClaimed: user.isClaimed !== false,
  };
}

export function serializeItinerary(itinerary: Awaited<ReturnType<typeof getPublishedItineraries>>[number]) {
  return {
    id: itinerary.id,
    title: itinerary.title,
    destination: itinerary.destination,
    description: itinerary.description,
    durationDays: itinerary.durationDays,
    estimatedBudget: itinerary.estimatedBudget,
    travelStyle: itinerary.travelStyle,
    coverImageUrl: itinerary.coverImageUrl,
    notes: itinerary.notes,
    isPublished: itinerary.isPublished,
    author: serializeUser(itinerary.author),
    days: itinerary.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      activities: day.activities.map((activity) => {
        const myLinksList: Array<{
          id: string;
          label: string;
          provider: string;
          actualUrl: string;
        }> = [];

        if (Array.isArray((activity as any).activityMyLinks) && (activity as any).activityMyLinks.length > 0) {
          for (const aml of (activity as any).activityMyLinks) {
            if (aml.myLink) {
              myLinksList.push({
                id: aml.myLink.id,
                label: aml.myLink.label || "",
                provider: aml.myLink.provider || "Partner",
                actualUrl: aml.myLink.actualUrl,
              });
            }
          }
        } else if ((activity as any).myLink) {
          myLinksList.push({
            id: (activity as any).myLink.id || activity.myLinkId || "",
            label: (activity as any).myLink.label || "",
            provider: (activity as any).myLink.provider || "Partner",
            actualUrl: (activity as any).myLink.actualUrl,
          });
        }

        const firstLink = myLinksList[0] || null;

        return {
          id: activity.id,
          time: activity.time,
          title: activity.title,
          locationName: activity.locationName,
          formattedAddress: activity.formattedAddress,
          latitude: activity.latitude,
          longitude: activity.longitude,
          mapProvider: activity.mapProvider,
          mapPlaceId: activity.mapPlaceId,
          customLocation: activity.customLocation,
          estimatedCost: activity.estimatedCost,
          category: activity.category,
          orderIndex: activity.orderIndex,
          myLinkId: firstLink?.id || activity.myLinkId || null,
          myLink: firstLink
            ? {
                actualUrl: firstLink.actualUrl,
                provider: firstLink.provider,
                label: firstLink.label,
              }
            : null,
          myLinks: myLinksList,
          myLinkIds: myLinksList.map((l) => l.id),
        };
      }),
    })),
    savesCount: itinerary.saves.length,
    likesCount: itinerary.likes.length,
    copiesCount: itinerary.copies.length,
    originalItinerary: (itinerary as any).originalItinerary
      ? {
        id: (itinerary as any).originalItinerary.id,
        title: (itinerary as any).originalItinerary.title,
        author: {
          id: (itinerary as any).originalItinerary.author.id,
          name: (itinerary as any).originalItinerary.author.name,
          username: (itinerary as any).originalItinerary.author.username,
        },
      }
      : null,
  };
}
