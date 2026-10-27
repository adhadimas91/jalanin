import { NextResponse } from "next/server";
import { startImpersonation } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    let targetUserId = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      targetUserId = String(body.userId ?? "");
    } else {
      const formData = await request.formData();
      targetUserId = String(formData.get("userId") ?? "");
    }

    if (!targetUserId) {
      return new NextResponse("userId is required", { status: 400 });
    }

    const targetUser = await startImpersonation(targetUserId);

    const accept = request.headers.get("accept") || "";
    if (accept.includes("text/html") || !contentType.includes("application/json")) {
      return NextResponse.redirect(new URL("/create", request.url), { status: 303 });
    }

    return NextResponse.json({
      success: true,
      redirectUrl: "/create",
      user: {
        id: targetUser.id,
        username: targetUser.username,
        name: targetUser.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal masuk sebagai akun kurasi.";
    const status = message.includes("Hanya admin") ? 403 : 400;

    const accept = request.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      return new NextResponse(message, { status });
    }

    return NextResponse.json({ error: message }, { status });
  }
}
