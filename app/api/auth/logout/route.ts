import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(request: Request) {
  await clearSession();

  const accept = request.headers.get("accept");
  if (accept && accept.includes("application/json")) {
    return NextResponse.json({ success: true, message: "Berhasil logout" });
  }

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export async function GET(request: Request) {
  await clearSession();

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
