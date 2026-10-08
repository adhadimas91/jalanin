import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, getBaseUrl } from "@/lib/email";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    let email = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = String(body.email || "").trim().toLowerCase();
    } else {
      const formData = await request.formData();
      email = String(formData.get("email") || "").trim().toLowerCase();
    }

    if (!email) {
      return NextResponse.redirect(
        new URL(`/forgot-password?error=${encodeURIComponent("Email tidak boleh kosong.")}`, request.url),
        { status: 303 },
      );
    }

    // Always return success to prevent email enumeration
    const successUrl = new URL(`/forgot-password?success=1`, request.url);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Silently succeed — don't reveal whether email exists
      return NextResponse.redirect(successUrl, { status: 303 });
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Create a new token valid for 1 hour
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    return NextResponse.redirect(successUrl, { status: 303 });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.redirect(
      new URL(`/forgot-password?error=${encodeURIComponent("Terjadi kesalahan. Coba lagi.")}`, request.url),
      { status: 303 },
    );
  }
}
