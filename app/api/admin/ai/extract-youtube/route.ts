import { NextResponse } from "next/server";
import { getCurrentUser, getImpersonatorUser, isAdminUser } from "@/lib/auth";
import {
  analyzeYouTubeStep2,
  enrichYouTubeStep3,
  extractItineraryFromYouTube,
  fetchYouTubeStep1,
  type YoutubeStep1Data,
  type YoutubeStep2Data,
} from "@/lib/youtube-ai";

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
    const step = body.step ? Number(body.step) : null;
    const targetUserId = body.curatedUserId ? String(body.curatedUserId).trim() : user.id;

    if (step === 1) {
      const videoUrl = String(body.url ?? "").trim();
      if (!videoUrl) {
        return NextResponse.json({ error: "URL video YouTube wajib diisi." }, { status: 400 });
      }
      const data = await fetchYouTubeStep1(videoUrl);
      return NextResponse.json({ success: true, step: 1, data });
    }

    if (step === 2) {
      const step1Data = body.step1Data as YoutubeStep1Data | undefined;
      if (!step1Data || !step1Data.videoId || !step1Data.cleanUrl) {
        return NextResponse.json({ error: "Data Step 1 tidak lengkap untuk analisis AI." }, { status: 400 });
      }
      const data = await analyzeYouTubeStep2(step1Data);
      return NextResponse.json({ success: true, step: 2, data });
    }

    if (step === 3) {
      const step1Data = body.step1Data as YoutubeStep1Data | undefined;
      const step2Data = body.step2Data as YoutubeStep2Data | undefined;
      if (!step1Data || !step2Data || !Array.isArray(step2Data.days)) {
        return NextResponse.json({ error: "Data Step 1 / Step 2 tidak lengkap untuk geocoding." }, { status: 400 });
      }
      const data = await enrichYouTubeStep3(step1Data, step2Data, targetUserId);
      return NextResponse.json({ success: true, step: 3, data });
    }

    // Backward-compatible full pipeline when `step` is not specified
    const videoUrl = String(body.url ?? "").trim();
    if (!videoUrl) {
      return NextResponse.json({ error: "URL video YouTube wajib diisi." }, { status: 400 });
    }

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
