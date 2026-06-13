import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const action = String(body.action ?? "").trim();
    if (action !== "upgrade" && action !== "downgrade") {
      return new NextResponse("Aksi tidak valid.", { status: 400 });
    }

    const isPro = action === "upgrade";
    const limits = isPro
      ? {
          maxPrivate: 100,
          maxPublic: 100,
          maxSaved: 100,
          maxMyLink: 100,
        }
      : {
          maxPrivate: 2,
          maxPublic: 5,
          maxSaved: 5,
          maxMyLink: 50,
        };

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isPro,
        ...limits,
      },
    });

    return NextResponse.json({ ok: true, isPro: updated.isPro });
  } catch (error) {
    console.error("Gagal memperbarui langganan:", error);
    return new NextResponse("Gagal memperbarui langganan.", { status: 500 });
  }
}
