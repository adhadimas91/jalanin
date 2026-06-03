export const ACTIVITY_TYPES = ["Transport", "Makan", "Tiket", "Stay", "Lainnya"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const DEFAULT_ACTIVITY_TYPE: ActivityType = "Lainnya";

export function isKnownActivityType(value: string): value is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}

export function activityIcon(category: string) {
  const value = category.toLowerCase();
  if (value.includes("makan") || value.includes("kuliner")) return "food";
  if (value.includes("transport") || value.includes("tiba")) return "car";
  if (value.includes("stay") || value.includes("hotel")) return "hotel";
  if (value.includes("tiket") || value.includes("ticket")) return "calendar";
  if (value.includes("flight")) return "plane";
  return "camera";
}

export function normalizeActivityType(category: string): ActivityType {
  if (isKnownActivityType(category)) return category;

  const value = category.toLowerCase();
  if (value.includes("transport") || value.includes("tiba") || value.includes("flight")) return "Transport";
  if (value.includes("makan") || value.includes("kuliner") || value.includes("food")) return "Makan";
  if (value.includes("tiket") || value.includes("ticket") || value.includes("culture") || value.includes("nature") || value.includes("walk")) {
    return "Tiket";
  }
  if (value.includes("stay") || value.includes("hotel")) return "Stay";
  return "Lainnya";
}

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  Transport: "var(--blue)",
  Makan: "var(--orange)",
  Tiket: "var(--pink)",
  Stay: "#6b9080",
  Lainnya: "#b0b0b0",
};

type ActivityCost = {
  category: string;
  estimatedCost: number;
};

type TripDay = {
  activities: ActivityCost[];
};

export type TripInsightLine = {
  type: ActivityType;
  total: number;
};

export function computeTripInsights(days: TripDay[]) {
  const totals = Object.fromEntries(ACTIVITY_TYPES.map((type) => [type, 0])) as Record<ActivityType, number>;

  for (const day of days) {
    for (const activity of day.activities) {
      const type = normalizeActivityType(activity.category);
      totals[type] += activity.estimatedCost || 0;
    }
  }

  const activityTotal = ACTIVITY_TYPES.reduce((sum, type) => sum + totals[type], 0);

  return {
    lines: ACTIVITY_TYPES.map((type) => ({ type, total: totals[type] })),
    activityTotal,
  };
}
