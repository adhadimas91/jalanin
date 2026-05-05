import { randomUUID } from "node:crypto";

const defaultBucket = "jalanin-itinerary-covers";

export const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function getStorageConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? defaultBucket;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment.",
    );
  }

  return {
    url,
    key: serviceRoleKey,
    bucket,
    hasServiceRoleKey: true,
  };
}

export function getSupabaseStorageStatus() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? defaultBucket,
    configured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && serviceRoleKey,
    ),
    hasServiceRoleKey: Boolean(serviceRoleKey),
  };
}

export async function ensureSupabaseStorageBucket() {
  const { url, key, bucket } = getStorageConfig();

  const existing = await fetch(`${url}/storage/v1/bucket/${bucket}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (existing.ok) {
    return bucket;
  }

  if (existing.status !== 404) {
    const text = await existing.text();
    throw new Error(`Gagal mengecek Supabase Storage bucket: ${text}`);
  }

  const response = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: 4 * 1024 * 1024,
      allowed_mime_types: Array.from(allowedImageTypes.keys()),
    }),
  });

  if (response.ok || response.status === 409) {
    return bucket;
  }

  const text = await response.text();
  throw new Error(`Gagal membuat Supabase Storage bucket: ${text}`);
}

export async function uploadImageToSupabaseStorage(input: {
  file: File;
  userId: string;
}) {
  const { url, key, bucket } = getStorageConfig();
  const extension = allowedImageTypes.get(input.file.type);

  if (!extension) {
    throw new Error("Format file harus JPG, PNG, atau WEBP.");
  }

  if (input.file.size > 4 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 4MB.");
  }

  const filePath = `itinerary-covers/${input.userId}/${randomUUID()}.${extension}`;
  const response = await fetch(
    `${url}/storage/v1/object/${bucket}/${filePath}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": input.file.type,
        "x-upsert": "false",
      },
      body: Buffer.from(await input.file.arrayBuffer()),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload Supabase Storage gagal: ${text}`);
  }

  return `${url}/storage/v1/object/public/${bucket}/${filePath}`;
}
