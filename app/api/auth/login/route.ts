import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return new NextResponse("Email atau password salah.", { status: 401 });
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    return new NextResponse("Email atau password salah.", { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
