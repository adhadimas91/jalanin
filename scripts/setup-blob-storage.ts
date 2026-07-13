import "dotenv/config";
import { list } from "@vercel/blob";

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN belum diset di environment.");
  }
  console.log("Menghubungkan ke Vercel Blobs...");
  const response = await list({ limit: 1 });
  console.log("Koneksi Vercel Blobs berhasil!");
  console.log(`Blob store siap digunakan.`);
}

main().catch((error) => {
  console.error("Koneksi Vercel Blobs GAGAL:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
