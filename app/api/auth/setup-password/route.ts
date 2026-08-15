import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

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

    const token = String(payload.token || "").trim();
    const password = String(payload.password || "").trim();
    const confirmPassword = String(payload.confirmPassword || "").trim();

    if (!token) {
      const msg = "Token verifikasi klaim tidak valid atau tidak disertakan.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 400 })
        : NextResponse.redirect(new URL(`/setup-password?error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    if (!password || password.length < 6) {
      const msg = "Kata sandi minimal 6 karakter.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 400 })
        : NextResponse.redirect(new URL(`/setup-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    if (password !== confirmPassword) {
      const msg = "Konfirmasi kata sandi tidak cocok.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 400 })
        : NextResponse.redirect(new URL(`/setup-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    // Find claim by token
    const claim = await prisma.accountClaim.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!claim) {
      const msg = "Tautan setup password tidak valid atau sudah pernah digunakan.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 404 })
        : NextResponse.redirect(new URL(`/setup-password?error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    if (claim.tokenExpiresAt && claim.tokenExpiresAt < new Date()) {
      const msg = "Tautan setup password telah kedaluwarsa. Silakan ajukan klaim ulang.";
      return isJson
        ? NextResponse.json({ error: msg }, { status: 410 })
        : NextResponse.redirect(new URL(`/setup-password?error=${encodeURIComponent(msg)}`, request.url), { status: 303 });
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update user details
    const updatedUser = await prisma.user.update({
      where: { id: claim.userId },
      data: {
        passwordHash,
        email: claim.claimantEmail,
        isClaimed: true,
        name: claim.user.name || claim.claimantName,
      },
    });

    // Invalidate the token
    await prisma.accountClaim.update({
      where: { id: claim.id },
      data: {
        token: null,
        tokenExpiresAt: null,
      },
    });

    // Automatically log the user in
    await createSession(updatedUser.id);

    const redirectPath = `/profile/${updatedUser.username || updatedUser.id}`;

    if (isJson) {
      return NextResponse.json({
        success: true,
        message: "Password berhasil disimpan! Selamat datang di Jalanin.",
        redirectUrl: redirectPath,
      });
    }

    return NextResponse.redirect(new URL(redirectPath, request.url), { status: 303 });
  } catch (error) {
    console.error("Error in setup password:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat menyimpan password baru." },
      { status: 500 },
    );
  }
}
