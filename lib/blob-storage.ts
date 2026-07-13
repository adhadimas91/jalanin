import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

export const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function getBlobStorageStatus() {
  return {
    configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
}

export async function uploadImageToBlobStorage(input: {
  file: File;
  userId: string;
  folder?: "itinerary-covers" | "avatars";
}) {
  const extension = allowedImageTypes.get(input.file.type);

  if (!extension) {
    throw new Error("Format file harus JPG, PNG, atau WEBP.");
  }

  if (input.file.size > 4 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 4MB.");
  }

  const folder = input.folder ?? "itinerary-covers";
  const filePath = `${folder}/${input.userId}/${randomUUID()}.${extension}`;

  try {
    const blob = await put(filePath, input.file, {
      access: "private",
      addRandomSuffix: false,
    });

    return `/api/media?url=${encodeURIComponent(blob.url)}`;
  } catch (error) {
    throw new Error(`Upload Vercel Blob gagal: ${error instanceof Error ? error.message : String(error)}`);
  }
}
