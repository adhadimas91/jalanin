import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { signInWithSupabaseAuth } from "@/lib/supabase-auth";

function usernameFromEmail(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let supabaseUser:
    | {
        id: string;
        email?: string;
        user_metadata?: {
          name?: string;
          username?: string;
        };
      }
    | null
    | undefined;
  let supabaseError = "";

  try {
    const result = await signInWithSupabaseAuth({ email, password });
    supabaseUser = result.user;
  } catch (error) {
    supabaseError = error instanceof Error ? error.message : "";
    supabaseUser = undefined;
  }

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (supabaseUser?.id) {
    user =
      user ??
      (await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email,
          username: supabaseUser.user_metadata?.username ?? usernameFromEmail(email),
          name: supabaseUser.user_metadata?.name ?? usernameFromEmail(email),
          passwordHash: await hashPassword(password),
          avatarUrl: null,
          bio: "Traveler Jalanin",
          city: "Indonesia",
        },
      }));

    await createSession(user.id);

    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  if (supabaseError.toLowerCase().includes("email not confirmed")) {
    return new NextResponse("Email belum dikonfirmasi. Cek inbox dari Supabase, lalu login lagi.", { status: 401 });
  }

  if (!user) {
    return new NextResponse("Email atau password salah.", { status: 401 });
  }

  const validLocalPassword = await verifyPassword(password, user.passwordHash);

  if (!validLocalPassword) {
    return new NextResponse("Email atau password salah.", { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
