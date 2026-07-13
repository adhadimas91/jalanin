import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function usernameFromEmail(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return new NextResponse("Nama, email, dan password minimal 8 karakter wajib diisi.", { status: 400 });
  }

  const setting = await prisma.appSetting.findUnique({
    where: { key: "email_whitelist" },
  });
  const whitelistString = setting?.value || "gmail.com,outlook.com,yahoo.com,icloud.com";
  const allowedDomains = whitelistString.split(",").map((d: string) => d.trim().toLowerCase());

  const emailDomain = email.split("@")[1];
  if (!emailDomain || !allowedDomains.includes(emailDomain)) {
    return new NextResponse(
      `Domain email tidak diperbolehkan. Hanya domain berikut yang diizinkan: ${allowedDomains.join(", ")}`,
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing) {
    return new NextResponse("Email sudah terdaftar.", { status: 409 });
  }

  const username = usernameFromEmail(email);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      passwordHash: await hashPassword(password),
      avatarUrl: null,
      bio: "Traveler Jalanin",
      city: "Indonesia",
      isPro: false,
      proExpiresAt: null,
      maxPrivate: 2,
      maxPublic: 5,
      maxSaved: 5,
      maxMyLink: 50,
    },
  });

  await createSession(user.id);

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
