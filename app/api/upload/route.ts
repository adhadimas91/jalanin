import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return new NextResponse("File tidak ditemukan.", { status: 400 });
  }

  const extension = allowedTypes.get(file.type);

  if (!extension) {
    return new NextResponse("Format file harus JPG, PNG, WEBP, atau SVG.", { status: 400 });
  }

  if (file.size > 4 * 1024 * 1024) {
    return new NextResponse("Ukuran file maksimal 4MB.", { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
