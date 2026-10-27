import { NextResponse } from "next/server";
import { stopImpersonation } from "@/lib/auth";

export async function GET(request: Request) {
  await stopImpersonation();
  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}

export async function POST(request: Request) {
  await stopImpersonation();

  const accept = request.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ success: true, redirectUrl: "/admin" });
  }

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
