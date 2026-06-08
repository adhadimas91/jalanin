import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAffiliateUrl, detectProvider } from "@/lib/affiliate-validator";

// GET: Ambil daftar link affiliate milik user yang sedang login
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const links = await prisma.affiliateLink.findMany({
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
    console.error("Gagal mengambil daftar affiliate links:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

// POST: Buat link affiliate baru
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
      return new NextResponse("Label dan URL affiliate wajib diisi.", { status: 400 });
    }

    // Validasi URL affiliate secara dinamis berdasarkan whitelist di DB
    const validation = await validateAffiliateUrl(actualUrl);
    if (!validation.isValid) {
      return new NextResponse(validation.error || "Tautan tidak valid.", { status: 400 });
    }

    const provider = detectProvider(actualUrl);

    const created = await prisma.affiliateLink.create({
      data: {
        userId: user.id,
        label,
        actualUrl,
        provider,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Gagal membuat affiliate link:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

// PUT: Perbarui link affiliate terpusat yang sudah ada
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
      return new NextResponse("ID, Label, dan URL affiliate wajib diisi.", { status: 400 });
    }

    // Pastikan link milik user yang login
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return new NextResponse("Tautan affiliate tidak ditemukan.", { status: 404 });
    }

    // Validasi URL affiliate secara dinamis
    const validation = await validateAffiliateUrl(actualUrl);
    if (!validation.isValid) {
      return new NextResponse(validation.error || "Tautan tidak valid.", { status: 400 });
    }

    const provider = detectProvider(actualUrl);

    const updated = await prisma.affiliateLink.update({
      where: { id },
      data: {
        label,
        actualUrl,
        provider,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Gagal mengupdate affiliate link:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

// DELETE: Hapus link affiliate terpusat
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
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return new NextResponse("Tautan affiliate tidak ditemukan.", { status: 404 });
    }

    await prisma.affiliateLink.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gagal menghapus affiliate link:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
