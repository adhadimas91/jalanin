export type ParsedLocation = {
  success: boolean;
  name: string | null;
  lat: number | null;
  lng: number | null;
  finalUrl: string;
  error?: string;
};

const googleMapsUrlPattern =
  /(?:maps\.google\.|google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

const coordPairPattern = /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/;

export function extractGoogleMapsUrl(input: string): string | null {
  const urlRegex = /(https?:\/\/[^\s"'<>\(\)]+)/gi;
  const matches = input.match(urlRegex);
  if (!matches) return null;
  for (const url of matches) {
    if (googleMapsUrlPattern.test(url)) {
      return url.replace(/[.,!?;:]+$/, "");
    }
  }
  return null;
}

export function isGoogleMapsUrl(input: string) {
  return extractGoogleMapsUrl(input) !== null;
}

function isCoordPair(value: string) {
  return coordPairPattern.test(value.trim());
}

/** Place name or address from mobile/desktop short links (q=, query=, /place/). */
export function extractPlaceQueryFromGoogleMapsUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    for (const key of ["q", "query"] as const) {
      const value = parsed.searchParams.get(key);
      if (value && !isCoordPair(value)) {
        return decodeURIComponent(value.replace(/\+/g, " "));
      }
    }
  } catch {
    // ignore malformed URLs
  }

  const place = url.match(/\/place\/([^/@?]+)/);
  if (place) {
    return decodeURIComponent(place[1]).replace(/\+/g, " ");
  }

  return null;
}

function buildGeocodeCandidates(query: string): string[] {
  const trimmed = query.trim();
  const candidates: string[] = [trimmed];
  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length > 1) {
    const firstPart = parts[0];
    candidates.push(firstPart);

    // If firstPart has multiple words, let's create variations
    const words = firstPart.split(/\s+/);
    if (words.length > 1) {
      // First part without the last word (often a city/region name like "Depok")
      candidates.push(words.slice(0, -1).join(" "));

      // First part without the first word (often a category like "Taman", "Hotel", "Pantai")
      candidates.push(words.slice(1).join(" "));

      // First part without first and last words
      if (words.length > 2) {
        candidates.push(words.slice(1, -1).join(" "));
      }
    }

    // Try to get some regional context from the end of the address
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts.length > 2 ? parts[parts.length - 2] : null;

    // Clean up context by removing postal codes
    const cleanContext = (text: string) => {
      return text.replace(/\b\d{5}\b/g, "").replace(/\s+/g, " ").trim();
    };

    const contexts = [
      "Indonesia",
      secondLastPart ? cleanContext(secondLastPart) : null,
      lastPart ? cleanContext(lastPart) : null,
    ].filter((c): c is string => Boolean(c && c.length > 2));

    // Create base names to combine with contexts
    const baseNames = [
      firstPart,
      words.length > 1 ? words.slice(0, -1).join(" ") : null,
      words.length > 1 ? words.slice(1).join(" ") : null,
      words.length > 2 ? words.slice(1, -1).join(" ") : null,
    ].filter((b): b is string => Boolean(b && b.length > 2));

    for (const base of baseNames) {
      for (const ctx of contexts) {
        candidates.push(`${base}, ${ctx}`);
      }
    }
  }

  // Deduplicate and filter out candidates that are too short to be useful
  return [...new Set(candidates)].filter((c) => c.length > 3);
}

async function geocodeWithGeoapify(
  query: string,
): Promise<{ lat: number; lng: number; name: string } | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    results?: Array<{
      lat?: number;
      lon?: number;
      formatted?: string;
      name?: string;
    }>;
  };

  const hit = payload.results?.[0];
  if (typeof hit?.lat !== "number" || typeof hit?.lon !== "number") return null;

  return {
    lat: hit.lat,
    lng: hit.lon,
    name: hit.name || hit.formatted || query,
  };
}

async function geocodeWithNominatim(
  query: string,
): Promise<{ lat: number; lng: number; name: string } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { "User-Agent": "Jalanin/1.0 (travel itinerary app)" },
  });
  if (!response.ok) return null;

  const results = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    name?: string;
  }>;

  const hit = results[0];
  if (!hit?.lat || !hit?.lon) return null;

  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    name: hit.name || hit.display_name || query,
  };
}

async function geocodePlaceQuery(
  query: string,
): Promise<{ lat: number; lng: number; name: string } | null> {
  for (const candidate of buildGeocodeCandidates(query)) {
    const geoapify = await geocodeWithGeoapify(candidate);
    if (geoapify) return geoapify;

    const nominatim = await geocodeWithNominatim(candidate);
    if (nominatim) return nominatim;
  }

  return null;
}

/** Place pin only — !3d lat + !4d lng in protobuf data (not map camera !2d / static center). */
export function extractPlacePinCoords(url: string): { lat: number; lng: number } | null {
  const placePinPattern = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g;
  let placePin: { lat: number; lng: number } | null = null;
  for (const match of url.matchAll(placePinPattern)) {
    placePin = { lat: Number(match[1]), lng: Number(match[2]) };
  }
  return placePin;
}

/** Coords embedded in Google Maps URLs (pin, ll=, q=lat,lng). Skips viewport/camera hints. */
export function extractCoordsFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  const placePin = extractPlacePinCoords(url);
  if (placePin) return placePin;

  const llParam = url.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llParam) {
    return { lat: Number(llParam[1]), lng: Number(llParam[2]) };
  }

  const qParam = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qParam) {
    return { lat: Number(qParam[1]), lng: Number(qParam[2]) };
  }

  return null;
}

export async function parseGoogleMapsUrl(url: string): Promise<ParsedLocation> {
  const extracted = extractGoogleMapsUrl(url);

  if (!extracted) {
    return {
      success: false,
      name: null,
      lat: null,
      lng: null,
      finalUrl: url.trim(),
      error: "URL bukan link Google Maps yang valid.",
    };
  }

  const trimmed = extracted;

  try {
    const response = await fetch(trimmed, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const finalUrl = response.url;
    const body = await response.text();
    const placeFromPath = finalUrl.match(/\/place\/([^/]+)/);
    const placeNameFromPath = placeFromPath
      ? decodeURIComponent(placeFromPath[1]).replace(/\+/g, " ")
      : null;

    const placeQuery =
      extractPlaceQueryFromGoogleMapsUrl(finalUrl) ??
      extractPlaceQueryFromGoogleMapsUrl(trimmed);
    const isNamedPlace = Boolean(placeQuery && !isCoordPair(placeQuery));

    let coords: { lat: number; lng: number } | null = null;
    let name = placeNameFromPath;

    if (isNamedPlace && placeQuery) {
      const geocoded = await geocodePlaceQuery(placeQuery);
      if (geocoded) {
        coords = { lat: geocoded.lat, lng: geocoded.lng };
        const labelFromQuery = placeQuery.split(",")[0]?.trim();
        name = name ?? (labelFromQuery || geocoded.name);
      } else if (!name) {
        name = placeQuery;
      }
    }

    if (!coords) {
      coords =
        extractCoordsFromGoogleMapsUrl(finalUrl) ??
        extractCoordsFromGoogleMapsUrl(trimmed) ??
        extractPlacePinCoords(body);
    }

    const lat = coords?.lat ?? null;
    const lng = coords?.lng ?? null;

    if (lat === null || lng === null) {
      return {
        success: false,
        name,
        lat: null,
        lng: null,
        finalUrl,
        error: isNamedPlace
          ? "Koordinat tempat tidak ditemukan. Coba cari lokasi manual atau gunakan link Google Maps desktop."
          : "Koordinat tidak ditemukan di link Google Maps.",
      };
    }

    if (!name) {
      name =
        extractPlaceQueryFromGoogleMapsUrl(finalUrl) ??
        extractPlaceQueryFromGoogleMapsUrl(trimmed);
    }

    return {
      success: true,
      name,
      lat,
      lng,
      finalUrl,
    };
  } catch (error) {
    return {
      success: false,
      name: null,
      lat: null,
      lng: null,
      finalUrl: trimmed,
      error: error instanceof Error ? error.message : "Gagal membaca link Google Maps.",
    };
  }
}
