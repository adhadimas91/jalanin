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
          maxPrivate: 9999,
          maxPublic: 9999,
          maxSaved: 9999,
          maxAffiliate: 9999,
        }
      : {
          maxPrivate: 2,
          maxPublic: 5,
          maxSaved: 5,
          maxAffiliate: 50,
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
