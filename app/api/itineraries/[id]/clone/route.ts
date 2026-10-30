import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getItineraryById } from "@/lib/itineraries";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const source = await getItineraryById(id);

  if (!source) {
    return new NextResponse("Itinerary tidak ditemukan.", { status: 404 });
  }

  const clone = await prisma.itinerary.create({
    data: {
      title: `${source.title} (Versi Saya)`,
      destination: source.destination,
      description: source.description,
      durationDays: source.durationDays,
      estimatedBudget: source.estimatedBudget,
      travelStyle: source.travelStyle,
      coverImageUrl: "/uploads/default-cover.svg",
      notes: source.notes,
      originalItineraryId: source.id,
      authorId: user.id,
      days: {
        create: source.days.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          activities: {
            create: day.activities.map((activity) => {
              const linkIds = ((activity as any).activityMyLinks?.length
                ? (activity as any).activityMyLinks.map((aml: any) => aml.myLinkId)
                : activity.myLinkId ? [activity.myLinkId] : []) as string[];
              return {
                time: activity.time,
                title: activity.title,
                locationName: activity.locationName,
                formattedAddress: activity.formattedAddress,
                latitude: activity.latitude,
                longitude: activity.longitude,
                mapProvider: activity.mapProvider,
                mapPlaceId: activity.mapPlaceId,
                customLocation: activity.customLocation,
                description: activity.description,
                estimatedCost: activity.estimatedCost,
                category: activity.category,
                orderIndex: activity.orderIndex,
                myLinkId: linkIds[0] || null,
                activityMyLinks: {
                  create: linkIds.map((linkId: string, idx: number) => ({
                    myLinkId: linkId,
                    orderIndex: idx,
                  })),
                },
              };
            }),
          },
        })),
      },
    },
  });

  return NextResponse.json({ id: clone.id });
}
