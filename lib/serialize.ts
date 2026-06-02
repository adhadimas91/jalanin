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
        estimatedCost: activity.estimatedCost,
        category: activity.category,
        orderIndex: activity.orderIndex,
      })),
    })),
    savesCount: itinerary.saves.length,
    likesCount: itinerary.likes.length,
    copiesCount: itinerary.copies.length,
  };
}
