import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImageToBlobStorage } from "@/lib/blob-storage";

function readNullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function readUsername(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    youtube: user.youtube,
    instagram: user.instagram,
    tiktok: user.tiktok,
  });
}

function respondError(request: Request, message: string, status: number) {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.redirect(
    new URL(`/settings/profile?error=${encodeURIComponent(message)}`, request.url),
    { status: 303 }
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const username = readUsername(formData.get("username"));
    const avatarFile = formData.get("avatarFile");
    let avatarUrl = String(formData.get("avatarUrl") ?? user.avatarUrl ?? "").trim() || null;

    if (!username) {
      return respondError(request, "Username wajib diisi.", 400);
    }

    const existingUsername = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingUsername) {
      return respondError(request, "Username sudah dipakai.", 409);
    }

    if (avatarFile instanceof File && avatarFile.size > 0) {
      try {
        avatarUrl = await uploadImageToBlobStorage({
          file: avatarFile,
          userId: user.id,
          folder: "avatars",
        });
      } catch (error) {
        return respondError(
          request,
          error instanceof Error ? error.message : "Upload avatar gagal.",
          400
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: readNullableText(formData.get("name")),
        username,
        city: readNullableText(formData.get("city")),
        bio: readNullableText(formData.get("bio")),
        youtube: readNullableText(formData.get("youtube")),
        instagram: readNullableText(formData.get("instagram")),
        tiktok: readNullableText(formData.get("tiktok")),
        avatarUrl,
      },
    });

    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("application/json")) {
      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.redirect(new URL(`/profile/${updatedUser.username ?? updatedUser.id}`, request.url), { status: 303 });
  } catch (error) {
    console.error("Gagal update profil:", error);
    return respondError(
      request,
      error instanceof Error ? error.message : "Gagal memperbarui profil.",
      500
    );
  }
}
