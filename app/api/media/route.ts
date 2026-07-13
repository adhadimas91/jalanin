import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new NextResponse("Malformed url parameter", { status: 400 });
  }

  if (!parsedUrl.hostname.endsWith(".blob.vercel-storage.com")) {
    return new NextResponse("Invalid URL host", { status: 400 });
  }

  try {
    const blob = await get(url, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blob) {
      return new NextResponse("Media tidak ditemukan.", { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "Content-Disposition": blob.blob.contentDisposition,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Gagal memuat media",
      { status: 500 }
    );
  }
}
