import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    let payload: Record<string, string> = {};

    const contentType = request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = String(value);
      });
    }

    const rawToken = String(payload.token || "").trim();
    const password = String(payload.password || "").trim();
    const confirmPassword = String(payload.confirmPassword || "").trim();

    const redirectBase = `/reset-password?token=${encodeURIComponent(rawToken)}`;

    if (!rawToken) {
      const msg = "Token tidak valid atau tidak disertakan.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 400 })
        : NextResponse.redirect(new URL(`/reset-password?error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    if (!password || password.length < 6) {
      const msg = "Password minimal 6 karakter.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 400 })
        : NextResponse.redirect(new URL(`${redirectBase}&error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    if (password !== confirmPassword) {
      const msg = "Konfirmasi password tidak cocok.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 400 })
        : NextResponse.redirect(new URL(`${redirectBase}&error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    const tokenHash = hashToken(rawToken);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      const msg = "Link reset password tidak valid atau sudah pernah digunakan.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 404 })
        : NextResponse.redirect(new URL(`/reset-password?error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    if (resetToken.usedAt) {
      const msg = "Link reset password ini sudah pernah digunakan. Silakan minta link baru.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 410 })
        : NextResponse.redirect(new URL(`/forgot-password?error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    if (resetToken.expiresAt < new Date()) {
      const msg = "Link reset password telah kedaluwarsa. Silakan minta link baru.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 410 })
        : NextResponse.redirect(new URL(`/forgot-password?error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    // Update password and mark token as used atomically
    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all existing sessions for security
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    // Create a fresh session
    await createSession(resetToken.userId);

    const redirectPath = `/profile/${resetToken.user.username || resetToken.user.id}`;

    if (isJson) {
      return NextResponse.json({
        success: true,
        message: "Password berhasil direset! Selamat datang kembali.",
        redirectUrl: redirectPath,
      });
    }

    return NextResponse.redirect(new URL(redirectPath, request.url), { status: 303 });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal. Coba lagi." },
      { status: 500 },
    );
  }
}
