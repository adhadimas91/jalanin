import { YoutubeTranscript } from "youtube-transcript";
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

export interface YouTubeCaptionTrack {
  baseUrl: string;
  languageCode: string;
  name?: string;
  kind?: string;
}

export interface YouTubeVideoDetails {
  title: string;
  authorName: string;
  thumbnailUrl: string;
  description: string;
  captionTracks?: YouTubeCaptionTrack[];
}

export function extractYouTubeVideoId(inputUrl: string): string | null {
  const trimmed = inputUrl.trim();
  if (!trimmed) return null;

  // Jika input langsung berupa 11 karakter YouTube Video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);

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

/**
 * Ekstrak JSON inline dari HTML YouTube (misal ytInitialPlayerResponse)
 */
function parseInlineJson(html: string, varName: string): any {
  const marker = `${varName} = `;
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const jsonStart = start + marker.length;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(jsonStart, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Mengambil metadata lengkap video YouTube dari oEmbed dan web scraping
 */
export async function fetchYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoDetails> {
  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let title = "";
  let authorName = "";
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let description = "";
  let captionTracks: YouTubeCaptionTrack[] = [];

  // 1. Coba oEmbed resmi
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
    const resp = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(4000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.title) title = data.title;
      if (data.author_name) authorName = data.author_name;
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
    }
  } catch {
    // Abaikan kegagalan oEmbed, lanjut ke scraping
  }

  // 2. Fetch halaman web YouTube untuk deskripsi lengkap & captionTracks
  try {
    const resp = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (resp.ok) {
      const html = await resp.text();
      const playerResponse = parseInlineJson(html, "ytInitialPlayerResponse");

      if (playerResponse?.videoDetails) {
        if (!title && playerResponse.videoDetails.title) {
          title = playerResponse.videoDetails.title;
        }
        if (!authorName && playerResponse.videoDetails.author) {
          authorName = playerResponse.videoDetails.author;
        }
        if (playerResponse.videoDetails.shortDescription) {
          description = playerResponse.videoDetails.shortDescription;
        }
      }

      const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) {
        captionTracks = tracks.map((t: any) => ({
          baseUrl: String(t.baseUrl || ""),
          languageCode: String(t.languageCode || ""),
          name: t.name?.simpleText || t.name?.runs?.[0]?.text,
          kind: t.kind,
        }));
      }

      // Fallback deskripsi dari meta tags jika shortDescription kosong
      if (!description) {
        const metaDescMatch = html.match(/<meta\s+(?:name="description"|property="og:description")\s+content="([^"]*)"/i);
        if (metaDescMatch?.[1]) {
          description = metaDescMatch[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
        }
      }

      if (!title) {
        const metaTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
        if (metaTitleMatch?.[1]) {
          title = metaTitleMatch[1];
        }
      }
    }
  } catch {
    // Abaikan kegagalan scraping web
  }

  return {
    title: title || "Travel Vlog",
    authorName: authorName || "Kreator",
    thumbnailUrl,
    description,
    captionTracks,
  };
}

/**
 * Backward compatibility untuk fetchYouTubeMetadata
 */
export async function fetchYouTubeMetadata(videoUrl: string): Promise<{
  title: string;
  authorName: string;
  thumbnailUrl: string;
  description?: string;
} | null> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) return null;
  const details = await fetchYouTubeVideoDetails(videoId);
  return {
    title: details.title,
    authorName: details.authorName,
    thumbnailUrl: details.thumbnailUrl,
    description: details.description,
  };
}

/**
 * Decode entitas HTML umum dalam teks transkrip
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parser tangguh untuk transkrip YouTube (mendukung format JSON3, SRV3 XML bebas urutan atribut, dan classic XML)
 */
function parseTranscriptData(rawText: string): Array<{ text: string; offset: number; duration?: number }> {
  const snippets: Array<{ text: string; offset: number; duration?: number }> = [];

  // Format 1: JSON3
  try {
    const json = typeof rawText === "string" ? JSON.parse(rawText) : rawText;
    if (json && Array.isArray(json.events)) {
      for (const ev of json.events) {
        if (!ev.segs || !Array.isArray(ev.segs)) continue;
        const text = decodeHtmlEntities(ev.segs.map((s: any) => s.utf8 || "").join(""));
        if (text) {
          snippets.push({
            text,
            offset: Number(ev.tStartMs) || 0,
            duration: Number(ev.dDurationMs) || 0,
          });
        }
      }
      if (snippets.length > 0) return snippets;
    }
  } catch {
    // Bukan JSON3, lanjut ke parsing XML
  }

  // Format 2: SRV3 XML (<p ...><s>...</s></p> atau <p ...>text</p>)
  // Urutan atribut t dan d bisa bebas (contoh: <p d="..." t="..."> atau <p w="1" t="...">)
  const pTagRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pTagRegex.exec(rawText)) !== null) {
    const attrs = match[1];
    const body = match[2];
    const tMatch = attrs.match(/\bt="(\d+)"/);
    const dMatch = attrs.match(/\bd="(\d+)"/);
    const offset = tMatch ? parseInt(tMatch[1], 10) : 0;
    const duration = dMatch ? parseInt(dMatch[1], 10) : 0;

    let text = "";
    const sRegex = /<s\b[^>]*>([^<]*)<\/s>/gi;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = sRegex.exec(body)) !== null) {
      text += sMatch[1];
    }
    if (!text) {
      text = body.replace(/<[^>]+>/g, "");
    }
    text = decodeHtmlEntities(text);
    if (text) {
      snippets.push({ text, offset, duration });
    }
  }
  if (snippets.length > 0) return snippets;

  // Format 3: Classic XML (<text start="..." dur="...">text</text>)
  const classicRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  while ((match = classicRegex.exec(rawText)) !== null) {
    const attrs = match[1];
    const body = match[2];
    const startMatch = attrs.match(/\bstart="([\d.]+)"/);
    const durMatch = attrs.match(/\bdur="([\d.]+)"/);
    const offset = startMatch ? parseFloat(startMatch[1]) * 1000 : 0;
    const duration = durMatch ? parseFloat(durMatch[1]) * 1000 : 0;
    const text = decodeHtmlEntities(body.replace(/<[^>]+>/g, ""));
    if (text) {
      snippets.push({ text, offset, duration });
    }
  }

  return snippets;
}

/**
 * Mengambil teks dari caption URL dengan variasi format (json3, srv3, default)
 */
async function fetchCaptionFromUrl(baseUrl: string): Promise<Array<{ text: string; offset: number }>> {
  try {
    const captionUrl = new URL(baseUrl);
    if (!captionUrl.hostname.endsWith(".youtube.com") && !captionUrl.hostname.endsWith(".googlevideo.com")) {
      return [];
    }
  } catch {
    return [];
  }

  const urlsToTry: string[] = [];
  if (!baseUrl.includes("fmt=")) {
    urlsToTry.push(`${baseUrl}&fmt=json3`);
    urlsToTry.push(`${baseUrl}&fmt=srv3`);
    urlsToTry.push(baseUrl);
  } else {
    urlsToTry.push(baseUrl);
    if (baseUrl.includes("fmt=srv3")) {
      urlsToTry.push(baseUrl.replace("fmt=srv3", "fmt=json3"));
    }
  }

  for (const url of urlsToTry) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!resp.ok) continue;
      const text = await resp.text();
      if (!text || text.trim().length === 0) continue;

      const snippets = parseTranscriptData(text);
      if (snippets.length > 0) {
        return snippets;
      }
    } catch {
      // coba format berikutnya
    }
  }

  return [];
}

/**
 * Mengambil transkrip YouTube dengan berbagai strategi fallback:
 * 1. InnerTube API (Android client)
 * 2. InnerTube API (Web client)
 * 3. Caption tracks dari web scraping
 * 4. Pustaka youtube-transcript bawaan
 */
async function fetchTranscriptWithFallbacks(
  videoId: string,
  extraCaptionTracks?: YouTubeCaptionTrack[]
): Promise<Array<{ text: string; offset: number }>> {
  // 1. Coba InnerTube Android API
  try {
    const resp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      },
      body: JSON.stringify({
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
        videoId,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (resp.ok) {
      const data = await resp.json();
      const tracks: any[] = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      if (Array.isArray(tracks) && tracks.length > 0) {
        // Prioritaskan bahasa Indonesia ('id', 'in'), lalu English, lalu track pertama
        const sortedTracks = [...tracks].sort((a, b) => {
          const aIsId = a.languageCode === "id" || a.languageCode === "in";
          const bIsId = b.languageCode === "id" || b.languageCode === "in";
          if (aIsId && !bIsId) return -1;
          if (!aIsId && bIsId) return 1;
          return 0;
        });

        for (const track of sortedTracks) {
          if (track.baseUrl) {
            const snippets = await fetchCaptionFromUrl(track.baseUrl);
            if (snippets.length > 0) return snippets;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[AI YouTube] InnerTube Android fetch failed:", err instanceof Error ? err.message : String(err));
  }

  // 2. Coba InnerTube Web API
  try {
    const resp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        context: { client: { clientName: "WEB", clientVersion: "2.20240105.01.00" } },
        videoId,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (resp.ok) {
      const data = await resp.json();
      const tracks: any[] = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      if (Array.isArray(tracks) && tracks.length > 0) {
        for (const track of tracks) {
          if (track.baseUrl) {
            const snippets = await fetchCaptionFromUrl(track.baseUrl);
            if (snippets.length > 0) return snippets;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[AI YouTube] InnerTube Web fetch failed:", err instanceof Error ? err.message : String(err));
  }

  // 3. Coba ekstra caption tracks dari scraping HTML
  if (Array.isArray(extraCaptionTracks) && extraCaptionTracks.length > 0) {
    for (const track of extraCaptionTracks) {
      if (track.baseUrl) {
        const snippets = await fetchCaptionFromUrl(track.baseUrl);
        if (snippets.length > 0) return snippets;
      }
    }
  }

  // 4. Coba modul youtube-transcript sebagai fallback terakhir
  try {
    const snippets = await YoutubeTranscript.fetchTranscript(videoId);
    if (snippets && snippets.length > 0) {
      return snippets.map((s) => ({
        text: decodeHtmlEntities(s.text),
        offset: s.offset,
      }));
    }
  } catch (err) {
    console.warn("[AI YouTube] youtube-transcript module fallback failed:", err instanceof Error ? err.message : String(err));
  }

  return [];
}

/**
 * Panggil Google Gemini API dengan fallback model dan dukungan multimodal YouTube
 */
async function callGeminiApi(
  prompt: string,
  options?: {
    videoUrl?: string;
  }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di file .env server.");
  }

  // Model prioritas fallback
  const models = [
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash",
  ];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const parts: any[] = [];
      if (options?.videoUrl) {
        parts.push({
          fileData: {
            fileUri: options.videoUrl,
            mimeType: "video/mp4",
          },
        });
      }
      parts.push({ text: prompt });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
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

/**
 * Prompt builder instruksi JSON itinerary untuk Gemini AI
 */
function buildItineraryPrompt(context: {
  title: string;
  authorName: string;
  cleanUrl: string;
  description?: string;
  transcript?: string;
  mode: "transcript" | "multimodal" | "description";
}): string {
  const { title, authorName, cleanUrl, description, transcript, mode } = context;

  let modeInstruction = "";
  if (mode === "transcript") {
    modeInstruction = `Tugasmu adalah menganalisis transkrip vlog perjalanan YouTube berikut dan mengekstrak itinerary perjalanan yang rapi, runtut kronologis, realistis, dan siap dimasukkan ke sistem.\n\nTranskrip Video:\n"""\n${transcript}\n"""`;
  } else if (mode === "multimodal") {
    modeInstruction = `Transkrip teks tidak tersedia. Tugasmu adalah menganalisis video vlog perjalanan YouTube terlampir secara langsung (melalui ucapan, narasi, petunjuk visual tempat, kafe, nama hotel, dan papan nama) dan mengekstrak itinerary perjalanan yang rapi, runtut kronologis, realistis, dan siap dimasukkan ke sistem.`;
  } else {
    modeInstruction = `Transkrip otomatis tidak tersedia. Tugasmu adalah menganalisis judul dan deskripsi lengkap dari video vlog perjalanan YouTube berikut untuk mengekstrak itinerary perjalanan yang rapi, runtut kronologis, realistis, dan siap dimasukkan ke sistem.`;
  }

  return `Kamu adalah kurator dan perencana perjalanan AI ahli untuk platform MyJalanin.
${modeInstruction}

Informasi Video:
- Judul Video: ${title || "Travel Vlog"}
- Kreator: ${authorName || "Kreator"}
- URL: ${cleanUrl}
${description ? `- Deskripsi Video:\n"""\n${description.slice(0, 2000)}\n"""` : ""}

Instruksi Pemrosesan:
1. Tentukan destinasi utama (contoh: "Yogyakarta", "Bali", "Bandung", dsb).
2. Hitung jumlah durasi hari secara akurat (misal: jika perjalanan 3 hari 2 malam, buat durationDays = 3). Durasi maksimal adalah 25 hari.
3. Tentukan travelStyle yang paling cocok: "Budget trip" | "Kuliner" | "Couple" | "Nature" | "City tour" | "Family".
4. Untuk setiap hari:
   - Buat judul tema hari yang menarik (misal: "Hari 1: Kuliner Legendaris & Suasana Malam").
   - Ekstrak aktivitas secara kronologis dari pagi ke malam.
   - Cantumkan jam estimasi ("08:00", "12:30", "16:00", dsb).
   - Ekstrak nama lokasi spesifik (contoh: "Gudeg Sagan", "Villa Gamaya", "Museum Sonobudoyo").
   - SERTAKAN KOORDINAT PETA (latitude & longitude): Untuk setiap lokasi/spot tempat wisata, kuliner, atau hotel, wajib berikan estimasi titik koordinat GPS latitude (angka desimal negatif untuk Indonesia selatan, misal -7.7xxx untuk Jogja, -6.9xxx untuk Bandung) dan longitude (misal 110.3xxx untuk Jogja, 107.6xxx untuk Bandung) yang akurat.
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
          "latitude": number,
          "longitude": number,
          "category": "string",
          "estimatedCost": number,
          "description": "string"
        }
      ]
    }
  ]
}
`;
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
  const videoDetails = await fetchYouTubeVideoDetails(videoId);

  // 1. Ambil transkrip YouTube dengan pipeline multi-fallback
  const transcriptSnippets = await fetchTranscriptWithFallbacks(videoId, videoDetails.captionTracks);

  let geminiRaw = "";

  if (transcriptSnippets.length > 0) {
    // Jalur Utama: Analisis transkrip teks lengkap
    const formattedTranscript = transcriptSnippets
      .map((item) => {
        const totalSeconds = Math.floor(item.offset / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        return `[${timeStr}] ${item.text}`;
      })
      .join("\n");

    const prompt = buildItineraryPrompt({
      title: videoDetails.title,
      authorName: videoDetails.authorName,
      cleanUrl,
      description: videoDetails.description,
      transcript: formattedTranscript,
      mode: "transcript",
    });

    geminiRaw = await callGeminiApi(prompt);
  } else {
    // Jalur Cadangan: Transkrip tidak tersedia langsung dari timedtext
    console.warn(`[AI YouTube] Transkrip otomatis tidak ditemukan untuk video ${videoId}. Menjalankan fallback multimodal / deskripsi.`);

    let fallbackCompleted = false;
    let lastFallbackErr: Error | null = null;

    // Cadangan A: Multimodal Gemini langsung ke video YouTube
    try {
      const multimodalPrompt = buildItineraryPrompt({
        title: videoDetails.title,
        authorName: videoDetails.authorName,
        cleanUrl,
        description: videoDetails.description,
        mode: "multimodal",
      });

      geminiRaw = await callGeminiApi(multimodalPrompt, { videoUrl: cleanUrl });
      fallbackCompleted = true;
    } catch (err) {
      lastFallbackErr = err instanceof Error ? err : new Error(String(err));
      console.warn("[AI YouTube] Fallback multimodal video gagal:", lastFallbackErr.message);
    }

    // Cadangan B: Analisis judul dan deskripsi lengkap video
    if (!fallbackCompleted) {
      if (!videoDetails.title && !videoDetails.description) {
        throw new Error(
          "Video ini tidak memiliki transkrip/caption otomatis yang dapat diakses oleh AI. Pastikan video bersifat publik dan memiliki subtitle atau pembicaraan yang jelas."
        );
      }

      try {
        const descriptionPrompt = buildItineraryPrompt({
          title: videoDetails.title,
          authorName: videoDetails.authorName,
          cleanUrl,
          description: videoDetails.description,
          mode: "description",
        });

        geminiRaw = await callGeminiApi(descriptionPrompt);
        fallbackCompleted = true;
      } catch (err) {
        throw (
          lastFallbackErr ||
          new Error("Gagal menganalisis video YouTube ini. Pastikan video bersifat publik dan memiliki transkrip atau deskripsi yang memadai.")
        );
      }
    }
  }

  // 2. Parsing JSON keluaran Gemini
  let parsed: any;
  try {
    const cleanedJson = geminiRaw!
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    parsed = JSON.parse(cleanedJson);
  } catch {
    const jsonMatch = geminiRaw!.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("Gemini raw output parse failure:", geminiRaw);
        throw new Error("Gagal mem-parsing keluaran AI menjadi data JSON yang valid.");
      }
    } else {
      console.error("Gemini raw output parse failure:", geminiRaw);
      throw new Error("Gagal mem-parsing keluaran AI menjadi data JSON yang valid.");
    }
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

          // Inisialisasi koordinat dari Gemini AI
          let lat: number | null = typeof act.latitude === "number" && !isNaN(act.latitude) ? act.latitude : null;
          let lng: number | null = typeof act.longitude === "number" && !isNaN(act.longitude) ? act.longitude : null;
          let formattedAddress = locationName;
          let mapProvider = lat !== null && lng !== null ? "ai-gemini" : "";
          let customLocation = lat === null || lng === null;

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
  let coverImageUrl = videoDetails.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // Jika thumbnail resolusi tinggi tersedia di YouTube, prioritaskan maxresdefault
  const maxResUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  try {
    const checkMax = await fetch(maxResUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    if (checkMax.ok) {
      coverImageUrl = maxResUrl;
    }
  } catch {
    // fallback tetap pakai coverImageUrl
  }

  // Jika userId tersedia dan Vercel Blob dikonfigurasi, simpan gambar ke storage lokal/blob
  if (userId && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const imgRes = await fetch(coverImageUrl, { signal: AbortSignal.timeout(6000) });
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
    title: String(parsed.title || videoDetails.title || "Itinerary Perjalanan").trim(),
    destination,
    durationDays: Math.min(Math.max(Number(parsed.durationDays) || enrichedDays.length || 1, 1), 25),
    travelStyle: String(parsed.travelStyle || "Budget trip").trim(),
    estimatedBudget: Math.max(0, Number(parsed.estimatedBudget) || 0),
    description: String(parsed.description || "").trim(),
    notes: String(parsed.notes || (videoDetails.authorName ? `Diadaptasi dari vlog perjalanan oleh ${videoDetails.authorName}` : "")).trim(),
    coverImageUrl,
    originalVideoUrl: cleanUrl,
    authorName: videoDetails.authorName,
    days: enrichedDays,
  };
}
