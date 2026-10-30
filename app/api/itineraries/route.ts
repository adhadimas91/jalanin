import { NextResponse } from "next/server";
import { getCurrentUser, getImpersonatorUser, isAdminUser } from "@/lib/auth";
import { getItineraryById } from "@/lib/itineraries";
import { prisma } from "@/lib/prisma";
import { serializeItinerary } from "@/lib/serialize";
import { uploadImageToBlobStorage } from "@/lib/blob-storage";
import { defaultActivity, fallbackDay, parseActivitiesJson, parseActivitiesText, parseDaysJson } from "@/lib/itinerary-form";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !destination || !description) {
    return new NextResponse("Judul, destinasi, dan deskripsi wajib diisi.", { status: 400 });
  }

  const isPublished = formData.get("isPublished") === "true";
  const impersonator = await getImpersonatorUser();
  const isAdminOrCurating = isAdminUser(user) || !user.isClaimed || !!impersonator;

  if (!isAdminOrCurating) {
    if (!isPublished) {
      const privateCount = await prisma.itinerary.count({
        where: {
          authorId: user.id,
          isPublished: false,
        },
      });
      if (privateCount >= user.maxPrivate) {
        return new NextResponse(`Batas maksimal itinerary privat adalah ${user.maxPrivate}. Silakan hapus atau ubah status itinerary privat Anda yang lain menjadi publik.`, { status: 400 });
      }
    } else {
      const publicCount = await prisma.itinerary.count({
        where: {
          authorId: user.id,
          isPublished: true,
        },
      });
      if (publicCount >= user.maxPublic) {
        return new NextResponse(`Batas maksimal itinerary publik adalah ${user.maxPublic}. Silakan hapus atau ubah status itinerary publik Anda yang lain menjadi privat.`, { status: 400 });
      }
    }
  }

  const structuredDays = parseDaysJson(formData.get("daysJson"));
  const structuredActivities = parseActivitiesJson(formData.get("activitiesJson"));
  const fallbackActivities = structuredActivities.length ? structuredActivities : parseActivitiesText(formData.get("activities"));
  const days = structuredDays.length ? structuredDays : fallbackActivities.length ? fallbackDay(fallbackActivities) : [];

  if (isPublished) {
    const hasDay1Activities = days.length > 0 && days[0].activities.length > 0;
    if (!hasDay1Activities) {
      return new NextResponse("Itinerary hanya bisa dipublish jika aktivitas hari pertama sudah dibuat.", { status: 400 });
    }
  }

  const durationDays = Number(formData.get("durationDays") ?? 1);
  if (durationDays > 25 || days.length > 25) {
    return new NextResponse("Batas maksimal durasi itinerary adalah 25 hari.", { status: 400 });
  }

  if (days.some((day) => day.activities.length > 10)) {
    return new NextResponse("Batas maksimal aktivitas per hari adalah 10 aktivitas.", { status: 400 });
  }

  let coverImageUrl = String(formData.get("coverImageUrl") ?? "/uploads/default-cover.svg");
  const imageFile = formData.get("imageFile");

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      coverImageUrl = await uploadImageToBlobStorage({
        file: imageFile,
        userId: user.id,
      });
    } catch (error) {
      return new NextResponse(error instanceof Error ? error.message : "Upload gagal.", {
        status: 400,
      });
    }
  }

  const originalItineraryId = formData.get("originalItineraryId") ? String(formData.get("originalItineraryId")) : null;

  const daysToCreate = days.length
    ? days
    : Array.from({ length: Math.min(Math.max(durationDays, 1), 25) }, (_, i) => ({
        dayNumber: i + 1,
        title: `Hari ${i + 1}`,
        activities: [],
      }));

  const created = await prisma.itinerary.create({
    data: {
      title,
      destination,
      description,
      durationDays: Number(formData.get("durationDays") ?? 1),
      estimatedBudget: Number(formData.get("estimatedBudget") ?? 0),
      travelStyle: String(formData.get("travelStyle") ?? "Budget trip"),
      coverImageUrl,
      notes: String(formData.get("notes") ?? ""),
      isPublished,
      originalItineraryId,
      authorId: user.id,
      days: {
        create: daysToCreate.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          activities: {
            create: day.activities.map((activity) => {
              const linkIds = activity.myLinkIds?.length
                ? activity.myLinkIds
                : activity.myLinkId
                  ? [activity.myLinkId]
                  : [];
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
                estimatedCost: activity.estimatedCost,
                category: activity.category,
                orderIndex: activity.orderIndex,
                myLinkId: linkIds[0] || null,
                activityMyLinks: {
                  create: linkIds.map((id, idx) => ({
                    myLinkId: id,
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

  const itinerary = await getItineraryById(created.id);

  if (!itinerary) {
    return new NextResponse("Itinerary gagal dimuat.", { status: 500 });
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(new URL(`/itinerary/${created.id}`, request.url), { status: 303 });
  }

  return NextResponse.json(serializeItinerary(itinerary));
}
