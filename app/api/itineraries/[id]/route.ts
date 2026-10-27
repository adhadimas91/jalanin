import { NextResponse } from "next/server";
import { getCurrentUser, getImpersonatorUser, isAdminUser } from "@/lib/auth";
import { defaultActivity, fallbackDay, parseActivitiesJson, parseActivitiesText, parseDaysJson } from "@/lib/itinerary-form";
import { getItineraryById } from "@/lib/itineraries";
import { prisma } from "@/lib/prisma";
import { serializeItinerary } from "@/lib/serialize";
import { uploadImageToBlobStorage } from "@/lib/blob-storage";

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
  const impersonator = await getImpersonatorUser();
  const isAdminOrCurating = isAdminUser(user) || !user.isClaimed || !!impersonator;

  if (!isAdminOrCurating) {
    if (existing.isPublished && !isPublished) {
      const privateCount = await prisma.itinerary.count({
        where: {
          authorId: user.id,
          isPublished: false,
        },
      });
      if (privateCount >= user.maxPrivate) {
        return new NextResponse(`Batas maksimal itinerary privat adalah ${user.maxPrivate}. Silakan hapus atau ubah status itinerary privat Anda yang lain menjadi publik.`, { status: 400 });
      }
    } else if (!existing.isPublished && isPublished) {
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
  const days = structuredDays.length ? structuredDays : fallbackDay(fallbackActivities);

  if (isPublished) {
    const hasDay1Activities = days.length > 0 && days[0].activities.length > 0;
    if (!hasDay1Activities) {
      return new NextResponse("Itinerary hanya bisa dipublish jika aktivitas hari pertama sudah dibuat.", { status: 400 });
    }
  }

  const durationDays = Number(formData.get("durationDays") ?? 1);
  const finalDurationDays = Math.max(durationDays, days.length || 1);
  if (finalDurationDays > 25 || days.length > 25) {
    return new NextResponse("Batas maksimal durasi itinerary adalah 25 hari.", { status: 400 });
  }

  if (days.some((day) => day.activities.length > 10)) {
    return new NextResponse("Batas maksimal aktivitas per hari adalah 10 aktivitas.", { status: 400 });
  }

  let coverImageUrl = String(formData.get("coverImageUrl") ?? existing.coverImageUrl);
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    include: {
      days: {
        include: {
          activities: true,
        },
        orderBy: { dayNumber: "asc" },
      },
    },
  });

  if (!itinerary) {
    return new NextResponse("Itinerary tidak ditemukan.", { status: 404 });
  }

  const impersonator = await getImpersonatorUser();
  const isAdminOrCurating = isAdminUser(user) || !user.isClaimed || !!impersonator;

  if (itinerary.authorId !== user.id && !isAdminOrCurating) {
    return new NextResponse("Kamu tidak punya akses untuk mengubah itinerary ini.", { status: 403 });
  }

  let body: { isPublished?: boolean } = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    body = { isPublished: formData.get("isPublished") === "true" };
  }

  const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : true;

  if (isPublished) {
    const hasDay1Activities = itinerary.days.length > 0 && itinerary.days[0].activities.length > 0;
    if (!hasDay1Activities) {
      return new NextResponse("Itinerary hanya bisa dipublish jika aktivitas hari pertama sudah dibuat.", { status: 400 });
    }
  }

  if (!isAdminOrCurating) {
    if (itinerary.isPublished && !isPublished) {
      const privateCount = await prisma.itinerary.count({
        where: { authorId: user.id, isPublished: false },
      });
      if (privateCount >= user.maxPrivate) {
        return new NextResponse(`Batas maksimal itinerary privat adalah ${user.maxPrivate}. Silakan hapus atau ubah status itinerary privat Anda yang lain menjadi publik.`, { status: 400 });
      }
    } else if (!itinerary.isPublished && isPublished) {
      const publicCount = await prisma.itinerary.count({
        where: { authorId: user.id, isPublished: true },
      });
      if (publicCount >= user.maxPublic) {
        return new NextResponse(`Batas maksimal itinerary publik adalah ${user.maxPublic}. Silakan hapus atau ubah status itinerary publik Anda yang lain menjadi privat.`, { status: 400 });
      }
    }
  }

  const updated = await prisma.itinerary.update({
    where: { id },
    data: { isPublished },
  });

  return NextResponse.json({ success: true, isPublished: updated.isPublished });
}
