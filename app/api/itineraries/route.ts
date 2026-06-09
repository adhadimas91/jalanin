import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getItineraryById } from "@/lib/itineraries";
import { prisma } from "@/lib/prisma";
import { serializeItinerary } from "@/lib/serialize";
import { uploadImageToSupabaseStorage } from "@/lib/supabase-storage";
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

  const structuredDays = parseDaysJson(formData.get("daysJson"));
  const structuredActivities = parseActivitiesJson(formData.get("activitiesJson"));
  const fallbackActivities = structuredActivities.length ? structuredActivities : parseActivitiesText(formData.get("activities"));
  const days = structuredDays.length ? structuredDays : fallbackDay(fallbackActivities);

  let coverImageUrl = String(formData.get("coverImageUrl") ?? "/uploads/default-cover.svg");
  const imageFile = formData.get("imageFile");

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      coverImageUrl = await uploadImageToSupabaseStorage({
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
      originalItineraryId,
      authorId: user.id,
      days: {
        create: days.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          activities: {
            create: day.activities.length
              ? day.activities
              : [
                  defaultActivity(),
                ],
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
