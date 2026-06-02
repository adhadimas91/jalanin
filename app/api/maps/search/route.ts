import { NextResponse } from "next/server";

type GeoapifyFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    formatted?: string;
    lat?: number;
    lon?: number;
    city?: string;
    country?: string;
  };
};

export async function GET(request: Request) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: [] });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url, {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return new NextResponse("Location search failed.", { status: response.status });
  }

  const payload = (await response.json()) as { features?: GeoapifyFeature[] };
  const results = (payload.features ?? [])
    .map((feature) => {
      const props = feature.properties;
      if (typeof props?.lat !== "number" || typeof props.lon !== "number") return null;

      return {
        placeId: props.place_id ?? "",
        name: props.name || props.formatted || "Lokasi",
        formattedAddress: props.formatted ?? "",
        latitude: props.lat,
        longitude: props.lon,
        provider: "geoapify",
      };
    })
    .filter(Boolean);

  return NextResponse.json({ results });
}
