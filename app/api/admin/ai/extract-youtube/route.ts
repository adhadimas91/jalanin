import { NextResponse } from "next/server";
import { getCurrentUser, getImpersonatorUser, isAdminUser } from "@/lib/auth";
import { extractItineraryFromYouTube } from "@/lib/youtube-ai";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sesi telah berakhir. Silakan login kembali." }, { status: 401 });
    }

    const impersonator = await getImpersonatorUser();
    const isAdmin = isAdminUser(user) || !!impersonator;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Akses ditolak. Fitur AI Ekstraksi YouTube saat ini dikhususkan untuk Kurator Admin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const videoUrl = String(body.url ?? "").trim();

    if (!videoUrl) {
      return NextResponse.json({ error: "URL video YouTube wajib diisi." }, { status: 400 });
    }

    const targetUserId = body.curatedUserId ? String(body.curatedUserId).trim() : user.id;

    const result = await extractItineraryFromYouTube(videoUrl, targetUserId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI YouTube Extract Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses video.",
      },
      { status: 500 }
    );
  }
}
