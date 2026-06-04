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

export function isGoogleMapsUrl(input: string) {
  return googleMapsUrlPattern.test(input.trim());
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
  const candidates = [trimmed];
  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length > 1) {
    const name = parts[0];
    const cityMatch = trimmed.match(/,\s*([^,]+?)\s+City\b/i);
    const city = cityMatch?.[1]?.trim();
    if (city) {
      candidates.push(`${name}, ${city}, Indonesia`);
      candidates.push(`${name} ${city} Indonesia`);
    }
  }

  return [...new Set(candidates)];
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
  const trimmed = url.trim();

  if (!isGoogleMapsUrl(trimmed)) {
    return {
      success: false,
      name: null,
      lat: null,
      lng: null,
      finalUrl: trimmed,
      error: "URL bukan link Google Maps yang valid.",
    };
  }

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
