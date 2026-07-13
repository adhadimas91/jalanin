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
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const username = readUsername(formData.get("username"));
  const avatarFile = formData.get("avatarFile");
  let avatarUrl = String(formData.get("avatarUrl") ?? user.avatarUrl ?? "").trim() || null;

  if (!username) {
    return new NextResponse("Username wajib diisi.", { status: 400 });
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
    return new NextResponse("Username sudah dipakai.", { status: 409 });
  }

  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      avatarUrl = await uploadImageToBlobStorage({
        file: avatarFile,
        userId: user.id,
        folder: "avatars",
      });
    } catch (error) {
      return new NextResponse(error instanceof Error ? error.message : "Upload avatar gagal.", {
        status: 400,
      });
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
      avatarUrl,
    },
  });

  return NextResponse.redirect(new URL(`/profile/${updatedUser.username ?? updatedUser.id}`, request.url), { status: 303 });
}
