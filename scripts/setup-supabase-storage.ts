import "dotenv/config";
import { ensureSupabaseStorageBucket } from "../lib/supabase-storage";

async function main() {
  const bucket = await ensureSupabaseStorageBucket();
  console.log(`Supabase Storage bucket ready: ${bucket}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
