import { NextResponse } from "next/server";
import { parseGoogleMapsUrl } from "@/lib/maps-parser";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string };
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json({ error: "URL wajib diisi." }, { status: 400 });
  }

  const result = await parseGoogleMapsUrl(url);

  if (!result.success) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
