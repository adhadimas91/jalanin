import { DEFAULT_ACTIVITY_TYPE } from "@/lib/activity-types";

export type ActivityFormInput = {
  time?: unknown;
  title?: unknown;
  locationName?: unknown;
  formattedAddress?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  mapProvider?: unknown;
  mapPlaceId?: unknown;
  customLocation?: unknown;
  estimatedCost?: unknown;
  category?: unknown;
};

type DayFormInput = {
  title?: unknown;
  activities?: unknown;
};

export type ParsedActivityForm = {
  time: string;
  title: string;
  locationName: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
  mapProvider: string;
  mapPlaceId: string;
  customLocation: boolean;
  estimatedCost: number;
  category: string;
  orderIndex: number;
};

export type ParsedDayForm = {
  dayNumber: number;
  title: string;
  activities: ParsedActivityForm[];
};

function isParsedActivity(activity: ParsedActivityForm | null): activity is ParsedActivityForm {
  return activity !== null;
}

function isParsedDay(day: ParsedDayForm | null): day is ParsedDayForm {
  return day !== null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseActivityArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((activity: ActivityFormInput, index) => {
      const title = String(activity.title ?? "").trim();
      if (!title) return null;

      return {
        time: String(activity.time ?? "").trim() || `${9 + index}.00`,
        title,
        locationName: String(activity.locationName ?? "").trim(),
        formattedAddress: String(activity.formattedAddress ?? "").trim(),
        latitude: optionalNumber(activity.latitude),
        longitude: optionalNumber(activity.longitude),
        mapProvider: String(activity.mapProvider ?? "").trim(),
        mapPlaceId: String(activity.mapPlaceId ?? "").trim(),
        customLocation: Boolean(activity.customLocation),
        estimatedCost: Number(activity.estimatedCost ?? 0) || 0,
        category: String(activity.category ?? DEFAULT_ACTIVITY_TYPE).trim() || DEFAULT_ACTIVITY_TYPE,
        orderIndex: index,
      };
    })
    .filter(isParsedActivity);
}

export function parseActivitiesJson(value: FormDataEntryValue | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(String(value)) as ActivityFormInput[];
    return parseActivityArray(parsed);
  } catch {
    return [];
  }
}

export function parseDaysJson(value: FormDataEntryValue | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(String(value)) as DayFormInput[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((day, index) => {
        const activities = parseActivityArray(day.activities);
        if (!activities.length) return null;

        return {
          dayNumber: index + 1,
          title: String(day.title ?? "").trim() || `Hari ${index + 1}`,
          activities,
        };
      })
      .filter(isParsedDay);
  } catch {
    return [];
  }
}

export function parseActivitiesText(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [timePart, ...titleParts] = line.split("-");
      return {
        time: timePart?.trim() || `${9 + index}.00`,
        title: titleParts.join("-").trim() || line,
        locationName: "",
        formattedAddress: "",
        latitude: null,
        longitude: null,
        mapProvider: "",
        mapPlaceId: "",
        customLocation: false,
        estimatedCost: 0,
        category: index % 2 === 0 ? "Transport" : "Makan",
        orderIndex: index,
      };
    });
}

export function fallbackDay(activities: ParsedActivityForm[]): ParsedDayForm[] {
  return [
    {
      dayNumber: 1,
      title: "Hari 1 - Rute Pertama",
      activities,
    },
  ];
}

export function defaultActivity() {
  return {
    time: "09.00",
    title: "Tiba di destinasi",
    locationName: "",
    category: "Transport",
    orderIndex: 0,
  };
}
