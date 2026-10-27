import { YoutubeTranscript } from "youtube-transcript";
import { geocodePlaceQuery } from "@/lib/maps-parser";
import { uploadImageToBlobStorage } from "@/lib/blob-storage";

export interface ExtractedActivity {
  time: string;
  title: string;
  locationName: string;
  formattedAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapProvider?: string;
  mapPlaceId?: string;
  customLocation?: boolean;
  category: string;
  estimatedCost: number;
  description: string;
}

export interface ExtractedDay {
  dayNumber: number;
  title: string;
  activities: ExtractedActivity[];
}

export interface AiItineraryResult {
  title: string;
  destination: string;
  durationDays: number;
  travelStyle: string;
  estimatedBudget: number;
  description: string;
  notes: string;
  coverImageUrl: string;
  originalVideoUrl: string;
  authorName?: string;
  days: ExtractedDay[];
}

export function extractYouTubeVideoId(inputUrl: string): string | null {
  try {
    const trimmed = inputUrl.trim();
    const url = new URL(trimmed);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\//, "").split("/")[0] || null;
    }

    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2] || null;
    }

    if (url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }

    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  } catch {
    const match = inputUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  }
}

export async function fetchYouTubeMetadata(videoUrl: string): Promise<{
  title: string;
  authorName: string;
  thumbnailUrl: string;
} | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const resp = await fetch(oembedUrl);
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      title: data.title || "",
      authorName: data.author_name || "",
      thumbnailUrl: data.thumbnail_url || "",
    };
  } catch {
    return null;
  }
}

async function callGeminiApi(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di file .env server.");
  }

  // Model prioritas fallback
  const models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      const resJson = await response.json();
      if (resJson.candidates && resJson.candidates[0]?.content?.parts?.[0]?.text) {
        return resJson.candidates[0].content.parts[0].text;
      }

      if (resJson.error) {
        lastError = new Error(`Gemini [${model}]: ${resJson.error.message}`);
        continue;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Gagal mendapatkan respons dari Gemini AI.");
}

export async function extractItineraryFromYouTube(
  url: string,
  userId?: string
): Promise<AiItineraryResult> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Format URL YouTube tidak valid. Mohon masukkan link YouTube yang benar.");
  }

  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const metadata = await fetchYouTubeMetadata(cleanUrl);

  // 1. Ambil transkrip YouTube
  let transcriptSnippets: Array<{ text: string; offset: number }> = [];
  try {
    transcriptSnippets = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err) {
    // Jika gagal fetch transcript (misal tidak ada caption), log dan error informatif
    throw new Error("Video ini tidak memiliki transkrip/caption otomatis yang dapat diakses oleh AI. Pastikan video memiliki subtitle atau pembicaraan yang jelas.");
  }

  if (!transcriptSnippets || transcriptSnippets.length === 0) {
    throw new Error("Transkrip video kosong atau tidak dapat diuraikan.");
  }

  // Format transkrip dengan timestamp [MM:SS]
  const formattedTranscript = transcriptSnippets
    .map((item) => {
      const totalSeconds = Math.floor(item.offset / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      return `[${timeStr}] ${item.text}`;
    })
    .join("\n");

  // 2. Prompting ke Gemini AI
  const prompt = `Kamu adalah kurator dan perencana perjalanan AI ahli untuk platform MyJalanin.
Tugasmu adalah menganalisis transkrip vlog perjalanan YouTube berikut dan mengekstrak itinerary perjalanan yang rapi, runtut kronologis, realistis, dan siap dimasukkan ke sistem.

Informasi Video:
- Judul Video: ${metadata?.title || "Travel Vlog"}
- Kreator: ${metadata?.authorName || "Kreator"}
- URL: ${cleanUrl}

Transkrip Video:
"""
${formattedTranscript}
"""

Instruksi Pemrosesan:
1. Tentukan destinasi utama (contoh: "Yogyakarta", "Bali", "Bandung", dsb).
2. Hitung jumlah durasi hari secara akurat berdasarkan transkrip (misal: jika ada Hari 1 dan Hari 2, buat durationDays = 2). Durasi maksimal adalah 25 hari.
3. Tentukan travelStyle yang paling cocok: "Budget trip" | "Kuliner" | "Couple" | "Nature" | "City tour" | "Family".
4. Untuk setiap hari:
   - Buat judul tema hari yang menarik (misal: "Hari 1: Kuliner Legendaris & Suasana Malam Malioboro").
   - Ekstrak aktivitas secara kronologis dari pagi ke malam.
   - Cantumkan jam estimasi ("08:00", "12:30", "16:00", dsb).
   - Ekstrak nama lokasi spesifik (contoh: "Gudeg Sagan", "Villa Gamaya", "Museum Sonobudoyo").
   - Kategori aktivitas: "Kuliner" | "Wisata" | "Akomodasi" | "Transportasi" | "Activity".
   - Estimasi biaya dalam IDR (angka bulat). Jika tidak disebutkan secara eksplisit, berikan estimasi wajar atau 0.
   - Deskripsi singkat aktivitas.
5. Hitung estimasi budget total perjalanan (estimatedBudget).

WAJIB output HANYA JSON murni (valid JSON) sesuai struktur berikut tanpa format lain:
{
  "title": "string",
  "destination": "string",
  "durationDays": number,
  "travelStyle": "Budget trip" | "Kuliner" | "Couple" | "Nature" | "City tour" | "Family",
  "estimatedBudget": number,
  "description": "string (2-3 kalimat)",
  "notes": "string (tips penting dari perjalanan ini)",
  "days": [
    {
      "dayNumber": number,
      "title": "string",
      "activities": [
        {
          "time": "string (HH:mm)",
          "title": "string",
          "locationName": "string",
          "category": "string",
          "estimatedCost": number,
          "description": "string"
        }
      ]
    }
  ]
}
`;

  const geminiRaw = await callGeminiApi(prompt);
  let parsed: any;
  try {
    const cleanedJson = geminiRaw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    parsed = JSON.parse(cleanedJson);
  } catch (err) {
    console.error("Gemini raw output parse failure:", geminiRaw);
    throw new Error("Gagal mem-parsing keluaran AI menjadi data JSON yang valid.");
  }

async function quickGeocode(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (apiKey) {
    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/search");
      url.searchParams.set("text", query);
      url.searchParams.set("limit", "1");
      url.searchParams.set("format", "json");
      url.searchParams.set("apiKey", apiKey);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const payload = (await res.json()) as { results?: Array<{ lat?: number; lon?: number; formatted?: string; name?: string }> };
        const hit = payload.results?.[0];
        if (typeof hit?.lat === "number" && typeof hit?.lon === "number") {
          return { lat: hit.lat, lng: hit.lon, name: hit.formatted || hit.name || query };
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback ke nominatim dengan timeout singkat
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Jalanin/1.0 (travel itinerary app)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const hits = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string; name?: string }>;
      if (hits[0]?.lat && hits[0]?.lon) {
        return { lat: Number(hits[0].lat), lng: Number(hits[0].lon), name: hits[0].display_name || query };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

  // 3. Auto-Geocoding untuk setiap lokasi aktivitas
  const destination = String(parsed.destination || "Indonesia").trim();
  const rawDays = Array.isArray(parsed.days) ? parsed.days : [];

  const enrichedDays: ExtractedDay[] = await Promise.all(
    rawDays.map(async (day: any, dayIdx: number) => {
      const rawActivities = Array.isArray(day.activities) ? day.activities : [];

      const activities: ExtractedActivity[] = await Promise.all(
        rawActivities.map(async (act: any, actIdx: number) => {
          const locationName = String(act.locationName || "").trim();
          let lat: number | null = null;
          let lng: number | null = null;
          let formattedAddress = locationName;
          let mapProvider = "";
          let customLocation = true;

          if (locationName) {
            try {
              const query = `${locationName}, ${destination}`;
              const geo = await quickGeocode(query);
              if (geo) {
                lat = geo.lat;
                lng = geo.lng;
                formattedAddress = geo.name || locationName;
                mapProvider = process.env.GEOAPIFY_API_KEY ? "geoapify" : "nominatim";
                customLocation = false;
              }
            } catch {
              // Geocoding non-blocking
            }
          }

          return {
            time: String(act.time || `${8 + actIdx}:00`).trim(),
            title: String(act.title || locationName || "Kunjungan").trim(),
            locationName,
            formattedAddress,
            latitude: lat,
            longitude: lng,
            mapProvider,
            customLocation,
            category: String(act.category || "Wisata").trim(),
            estimatedCost: Math.max(0, Number(act.estimatedCost) || 0),
            description: String(act.description || "").trim(),
          };
        })
      );

      return {
        dayNumber: Number(day.dayNumber) || dayIdx + 1,
        title: String(day.title || `Hari ${dayIdx + 1}`).trim(),
        activities,
      };
    })
  );

  // 4. Handle cover image thumbnail
  let coverImageUrl = metadata?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  
  // Jika thumbnail resolusi tinggi tersedia di YouTube, prioritaskan maxresdefault
  const maxResUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  try {
    const checkMax = await fetch(maxResUrl, { method: "HEAD" });
    if (checkMax.ok) {
      coverImageUrl = maxResUrl;
    }
  } catch {
    // fallback tetap pakai coverImageUrl
  }

  // Jika userId tersedia dan Vercel Blob dikonfigurasi, simpan gambar ke storage lokal/blob
  if (userId && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const imgRes = await fetch(coverImageUrl);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        const file = new File([buffer], `yt-cover-${videoId}.jpg`, { type: "image/jpeg" });
        const uploaded = await uploadImageToBlobStorage({ file, userId });
        if (uploaded) {
          coverImageUrl = uploaded;
        }
      }
    } catch {
      // Fallback ke direct YouTube thumbnail URL jika upload gagal
    }
  }

  return {
    title: String(parsed.title || metadata?.title || "Itinerary Perjalanan").trim(),
    destination,
    durationDays: Math.min(Math.max(Number(parsed.durationDays) || enrichedDays.length || 1, 1), 25),
    travelStyle: String(parsed.travelStyle || "Budget trip").trim(),
    estimatedBudget: Math.max(0, Number(parsed.estimatedBudget) || 0),
    description: String(parsed.description || "").trim(),
    notes: String(parsed.notes || (metadata?.authorName ? `Diadaptasi dari vlog perjalanan oleh ${metadata.authorName}` : "")).trim(),
    coverImageUrl,
    originalVideoUrl: cleanUrl,
    authorName: metadata?.authorName,
    days: enrichedDays,
  };
}
