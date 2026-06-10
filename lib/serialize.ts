import type { getPublishedItineraries } from "./itineraries";

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
}) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    city: user.city,
    role: user.role ?? "USER",
    isPro: !!user.isPro,
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
      activities: day.activities.map((activity) => ({
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
        affiliateLinkId: activity.affiliateLinkId,
        affiliateLink: (activity as any).affiliateLink
          ? {
              actualUrl: (activity as any).affiliateLink.actualUrl,
              provider: (activity as any).affiliateLink.provider,
            }
          : null,
      })),
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
