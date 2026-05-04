import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;

  await prisma.like.upsert({
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

  await prisma.like.deleteMany({
    where: {
      userId: user.id,
      itineraryId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
