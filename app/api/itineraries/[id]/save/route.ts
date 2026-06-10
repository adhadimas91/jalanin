import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;

  const existingSave = await prisma.savedItinerary.findUnique({
    where: {
      userId_itineraryId: {
        userId: user.id,
        itineraryId: id,
      },
    },
  });

  if (!existingSave) {
    const savedCount = await prisma.savedItinerary.count({
      where: {
        userId: user.id,
      },
    });
    if (savedCount >= user.maxSaved) {
      return new NextResponse(`Batas maksimal rute tersimpan adalah ${user.maxSaved}. Silakan hapus rute tersimpan Anda yang lain terlebih dahulu.`, { status: 400 });
    }
  }

  await prisma.savedItinerary.upsert({
    where: {
      userId_itineraryId: {
        userId: user.id,
        itineraryId: id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      itineraryId: id,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;

  await prisma.savedItinerary.deleteMany({
    where: {
      userId: user.id,
      itineraryId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
