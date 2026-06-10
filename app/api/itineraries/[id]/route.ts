import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { defaultActivity, fallbackDay, parseActivitiesJson, parseActivitiesText, parseDaysJson } from "@/lib/itinerary-form";
import { getItineraryById } from "@/lib/itineraries";
import { prisma } from "@/lib/prisma";
import { serializeItinerary } from "@/lib/serialize";
import { uploadImageToSupabaseStorage } from "@/lib/supabase-storage";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.itinerary.findUnique({
    where: { id },
    select: { authorId: true, coverImageUrl: true, isPublished: true },
  });

  if (!existing) {
    return new NextResponse("Itinerary tidak ditemukan.", { status: 404 });
  }

  if (existing.authorId !== user.id && !isAdminUser(user)) {
    return new NextResponse("Kamu tidak punya akses untuk edit itinerary ini.", { status: 403 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !destination || !description) {
    return new NextResponse("Judul, destinasi, dan deskripsi wajib diisi.", { status: 400 });
  }

  const isPublished = formData.get("isPublished") === null ? existing.isPublished : formData.get("isPublished") === "true";

  if (existing.isPublished && !isPublished) {
    const privateCount = await prisma.itinerary.count({
      where: {
        authorId: user.id,
        isPublished: false,
      },
    });
    if (privateCount >= 2) {
      return new NextResponse("Batas maksimal itinerary privat adalah 2. Silakan hapus atau ubah status itinerary privat Anda yang lain menjadi publik.", { status: 400 });
    }
  } else if (!existing.isPublished && isPublished) {
    const publicCount = await prisma.itinerary.count({
      where: {
        authorId: user.id,
        isPublished: true,
      },
    });
    if (publicCount >= 5) {
      return new NextResponse("Batas maksimal itinerary publik adalah 5. Silakan hapus atau ubah status itinerary publik Anda yang lain menjadi privat.", { status: 400 });
    }
  }

  const structuredDays = parseDaysJson(formData.get("daysJson"));
  const structuredActivities = parseActivitiesJson(formData.get("activitiesJson"));
  const fallbackActivities = structuredActivities.length ? structuredActivities : parseActivitiesText(formData.get("activities"));
  const days = structuredDays.length ? structuredDays : fallbackDay(fallbackActivities);

  const durationDays = Number(formData.get("durationDays") ?? 1);
  const finalDurationDays = Math.max(durationDays, days.length || 1);
  if (finalDurationDays > 5 || days.length > 5) {
    return new NextResponse("Batas maksimal durasi itinerary adalah 5 hari.", { status: 400 });
  }

  if (days.some((day) => day.activities.length > 10)) {
    return new NextResponse("Batas maksimal aktivitas per hari adalah 10 aktivitas.", { status: 400 });
  }

  let coverImageUrl = String(formData.get("coverImageUrl") ?? existing.coverImageUrl);
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

  await prisma.$transaction([
    prisma.itineraryDay.deleteMany({
      where: {
        itineraryId: id,
      },
    }),
    prisma.itinerary.update({
      where: { id },
      data: {
        title,
        destination,
        description,
        durationDays: Math.max(Number(formData.get("durationDays") ?? 1), days.length || 1),
        estimatedBudget: Number(formData.get("estimatedBudget") ?? 0),
        travelStyle: String(formData.get("travelStyle") ?? "Budget trip"),
        coverImageUrl,
        notes: String(formData.get("notes") ?? ""),
        isPublished,
        days: {
          create: days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            activities: {
              create: day.activities.length ? day.activities : [defaultActivity()],
            },
          })),
        },
      },
    }),
  ]);

  const itinerary = await getItineraryById(id);

  if (!itinerary) {
    return new NextResponse("Itinerary gagal dimuat.", { status: 500 });
  }

  return NextResponse.json(serializeItinerary(itinerary));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.itinerary.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!existing) {
    return new NextResponse("Itinerary tidak ditemukan.", { status: 404 });
  }

  if (existing.authorId !== user.id && !isAdminUser(user)) {
    return new NextResponse("Kamu tidak punya akses untuk hapus itinerary ini.", { status: 403 });
  }

  await prisma.itinerary.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
