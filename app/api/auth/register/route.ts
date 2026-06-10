import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { signUpWithSupabaseAuth } from "@/lib/supabase-auth";

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

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing) {
    return new NextResponse("Email sudah terdaftar.", { status: 409 });
  }

  const username = usernameFromEmail(email);
  let supabaseUserId: string;
  let hasSupabaseSession = false;

  try {
    const result = await signUpWithSupabaseAuth({
      email,
      password,
      name,
      username,
    });

    if (!result.user?.id) {
      return new NextResponse("Supabase Auth tidak mengembalikan user. Cek pengaturan email confirmation.", { status: 502 });
    }

    supabaseUserId = result.user.id;
    hasSupabaseSession = Boolean(result.session?.access_token);
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Register Supabase gagal.", { status: 502 });
  }

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name,
      username,
      passwordHash: await hashPassword(password),
      avatarUrl: null,
      bio: "Traveler Jalanin",
      city: "Indonesia",
    },
    create: {
      id: supabaseUserId,
      name,
      email,
      username,
      passwordHash: await hashPassword(password),
      avatarUrl: null,
      bio: "Traveler Jalanin",
      city: "Indonesia",
    },
  });

  if (!hasSupabaseSession) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  await createSession(user.id);

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
