import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Ambil semua domain whitelist yang aktif
export async function GET() {
  try {
    const list = await prisma.myLinkWhitelistDomain.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(list);
  } catch (error) {
    console.error("Gagal mengambil domain whitelist mylink:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

// POST: Daftarkan domain pattern baru (Hanya Admin)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!isAdminUser(user)) {
    return new NextResponse("Forbidden - Hanya admin yang bisa mengelola whitelist.", { status: 403 });
  }

  try {
    const body = await request.json();
    const domainPattern = String(body.domainPattern ?? "").trim().toLowerCase();
    const description = String(body.description ?? "").trim();

    if (!domainPattern) {
      return new NextResponse("Domain pattern wajib diisi.", { status: 400 });
    }

    // Validasi format domain pattern dasar (misal tidak boleh ada http:// atau spasi)
    if (domainPattern.includes("/") || domainPattern.includes(" ")) {
      return new NextResponse("Domain pattern tidak valid. Gunakan format seperti '*.agoda.com' atau 'wa.me'.", { status: 400 });
    }

    const created = await prisma.myLinkWhitelistDomain.upsert({
      where: { domainPattern },
      update: {
        description,
        isActive: true,
      },
      create: {
        domainPattern,
        description,
        isActive: true,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Gagal membuat/mengupdate whitelist domain mylink:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
