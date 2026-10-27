import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const sessionCookieName = "jalanin_session";
const sessionDays = 14;

function adminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

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

export const impersonatorCookieName = "jalanin_admin_impersonator";

export async function clearSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;
  const adminRawToken = cookieStore.get(impersonatorCookieName)?.value;

  if (rawToken) {
    await prisma.session.deleteMany({
      where: {
        token: hashToken(rawToken),
      },
    });
  }

  cookieStore.delete(sessionCookieName);
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  if (adminRawToken) {
    cookieStore.delete(impersonatorCookieName);
    cookieStore.set(impersonatorCookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });
  }
}

export async function getImpersonatorUser() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(impersonatorCookieName)?.value;

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

  if (!isAdminUser(session.user)) {
    return null;
  }

  return session.user;
}

export async function startImpersonation(targetUserId: string) {
  const currentAdmin = (await getImpersonatorUser()) ?? (await requireAdminUser());
  if (!currentAdmin) {
    throw new Error("Hanya admin yang dapat masuk sebagai akun kurasi.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("Akun user tidak ditemukan.");
  }

  if (targetUser.isClaimed) {
    throw new Error("Hanya akun dengan status Akun Kurasi (belum diklaim) yang dapat dimasuki.");
  }

  const cookieStore = await cookies();
  const existingImpersonator = cookieStore.get(impersonatorCookieName)?.value;
  const currentSessionToken = cookieStore.get(sessionCookieName)?.value;

  if (!existingImpersonator && currentSessionToken) {
    cookieStore.set(impersonatorCookieName, currentSessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000),
      path: "/",
    });
  }

  await createSession(targetUser.id);
  return targetUser;
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  const adminRawToken = cookieStore.get(impersonatorCookieName)?.value;
  const currentRawToken = cookieStore.get(sessionCookieName)?.value;

  if (currentRawToken) {
    try {
      await prisma.session.deleteMany({
        where: {
          token: hashToken(currentRawToken),
        },
      });
    } catch (error) {
      console.error("Gagal menghapus session impersonation:", error);
    }
  }

  if (adminRawToken) {
    cookieStore.set(sessionCookieName, adminRawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000),
      path: "/",
    });
  } else {
    cookieStore.delete(sessionCookieName);
  }

  cookieStore.delete(impersonatorCookieName);
  cookieStore.set(impersonatorCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });
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

  let user = session.user;

  if (user.isPro && user.proExpiresAt && user.proExpiresAt < new Date()) {
    try {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: false,
          proExpiresAt: null,
          maxPrivate: 2,
          maxPublic: 5,
          maxSaved: 5,
          maxMyLink: 50,
        },
      });
    } catch (error) {
      console.error("Gagal otomatis men-downgrade user:", error);
    }
  }

  return user;
}

export function isAdminUser(user: { email: string; role?: string | null } | null) {
  if (!user) {
    return false;
  }

  return user.role === "ADMIN" || adminEmails().has(user.email.toLowerCase());
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

export async function requireAdminUser() {
  const user = await requireCurrentUser();

  if (!isAdminUser(user)) {
    throw new Response("Forbidden", {
      status: 403,
    });
  }

  return user;
}
