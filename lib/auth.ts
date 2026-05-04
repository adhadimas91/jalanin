import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const sessionCookieName = "jalanin_session";
const sessionDays = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const token = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;

  if (rawToken) {
    await prisma.session.deleteMany({
      where: {
        token: hashToken(rawToken),
      },
    });
  }

  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      token: hashToken(rawToken),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Response("Unauthorized", {
      status: 401,
    });
  }

  return user;
}
