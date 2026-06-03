export type ParsedLocation = {
  success: boolean;
  name: string | null;
  lat: number | null;
  lng: number | null;
  finalUrl: string;
  error?: string;
};

const googleMapsUrlPattern = /(?:maps\.google\.|google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

export function isGoogleMapsUrl(input: string) {
  return googleMapsUrlPattern.test(input.trim());
}

/** Place pin coords in data=… (!3d lat, !4d lng). @lat,lng is only map center. */
export function extractCoordsFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  const placePinPattern = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g;
  let placePin: { lat: number; lng: number } | null = null;
  for (const match of url.matchAll(placePinPattern)) {
    placePin = { lat: Number(match[1]), lng: Number(match[2]) };
  }
  if (placePin) return placePin;

  const llParam = url.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llParam) {
    return { lat: Number(llParam[1]), lng: Number(llParam[2]) };
  }

  const qParam = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qParam) {
    return { lat: Number(qParam[1]), lng: Number(qParam[2]) };
  }

  const viewport = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (viewport) {
    return { lat: Number(viewport[1]), lng: Number(viewport[2]) };
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
    const place = finalUrl.match(/\/place\/([^/]+)/);
    const coords = extractCoordsFromGoogleMapsUrl(finalUrl) ?? extractCoordsFromGoogleMapsUrl(trimmed);
    const lat = coords?.lat ?? null;
    const lng = coords?.lng ?? null;

    if (lat === null || lng === null) {
      return {
        success: false,
        name: place ? decodeURIComponent(place[1]).replace(/\+/g, " ") : null,
        lat: null,
        lng: null,
        finalUrl,
        error: "Koordinat tidak ditemukan di link Google Maps.",
      };
    }

    return {
      success: true,
      name: place ? decodeURIComponent(place[1]).replace(/\+/g, " ") : null,
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
