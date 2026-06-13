import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateMyLinkUrl, detectProvider } from "@/lib/mylink-validator";

// GET: Ambil daftar link mylink milik user yang sedang login
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const links = await prisma.myLink.findMany({
      where: {
        userId: user.id,
      },
      include: {
        activities: {
          where: {
            day: {
              itinerary: {
                authorId: user.id,
              },
            },
          },
          include: {
            day: {
              include: {
                itinerary: {
                  select: {
                    id: true,
                    title: true,
                    destination: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Gagal mengambil daftar mylinks:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

// POST: Buat link mylink baru
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const label = String(body.label ?? "").trim();
    const actualUrl = String(body.actualUrl ?? "").trim();

    if (!label || !actualUrl) {
      return new NextResponse("Label dan URL mylink wajib diisi.", { status: 400 });
    }

    // Validasi URL mylink secara dinamis berdasarkan whitelist di DB
    const validation = await validateMyLinkUrl(actualUrl);
    if (!validation.isValid) {
      return new NextResponse(validation.error || "Tautan tidak valid.", { status: 400 });
    }

    const provider = detectProvider(actualUrl);

    const myLinkCount = await prisma.myLink.count({
      where: {
        userId: user.id,
      },
    });

    if (myLinkCount >= user.maxMyLink) {
      return new NextResponse(`Batas maksimal tautan mylink adalah ${user.maxMyLink}.`, { status: 400 });
    }

    const created = await prisma.myLink.create({
      data: {
        userId: user.id,
        label,
        actualUrl,
        provider,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Gagal membuat mylink:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

// PUT: Perbarui link mylink terpusat yang sudah ada
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const label = String(body.label ?? "").trim();
    const actualUrl = String(body.actualUrl ?? "").trim();

    if (!id || !label || !actualUrl) {
      return new NextResponse("ID, Label, dan URL mylink wajib diisi.", { status: 400 });
    }

    // Pastikan link milik user yang login
    const existing = await prisma.myLink.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return new NextResponse("Tautan mylink tidak ditemukan.", { status: 404 });
    }

    // Validasi URL mylink secara dinamis
    const validation = await validateMyLinkUrl(actualUrl);
    if (!validation.isValid) {
      return new NextResponse(validation.error || "Tautan tidak valid.", { status: 400 });
    }

    const provider = detectProvider(actualUrl);

    const updated = await prisma.myLink.update({
      where: { id },
      data: {
        label,
        actualUrl,
        provider,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Gagal mengupdate mylink:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

// DELETE: Hapus link mylink terpusat
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID wajib diisi.", { status: 400 });
    }

    // Pastikan link milik user yang login
    const existing = await prisma.myLink.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return new NextResponse("Tautan mylink tidak ditemukan.", { status: 404 });
    }

    await prisma.myLink.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gagal menghapus mylink:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
