import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const adminTables = [
  "users",
  "itineraries",
  "days",
  "activities",
  "saves",
  "likes",
  "sessions",
  "affiliateWhitelistDomains",
] as const;

export type AdminTable = (typeof adminTables)[number];
export type AdminRecord = Record<string, unknown>;
export type AdminSnapshot = Record<AdminTable, AdminRecord[]>;

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, innerValue]) => [key, serializeValue(innerValue)]),
    );
  }

  return value;
}

function serializeRecord<T extends object>(record: T): AdminRecord {
  return serializeValue(record) as AdminRecord;
}

function stripMeta(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => !key.startsWith("_")),
  );
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readOptionalString(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function readInt(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function readOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function readBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return fallback;
}

function readDate(value: unknown, fallback?: Date) {
  if (!value && fallback) {
    return fallback;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? (fallback ?? new Date()) : date;
}

function readUserRole(value: unknown) {
  return String(value).toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

async function fetchUsers() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          trips: true,
          saves: true,
          likes: true,
          sessions: true,
        },
      },
    },
    take: 100,
  });
}

async function fetchItineraries() {
  return prisma.itinerary.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        select: {
          email: true,
          username: true,
          name: true,
        },
      },
      _count: {
        select: {
          days: true,
          saves: true,
          likes: true,
          copies: true,
        },
      },
    },
    take: 100,
  });
}

async function fetchDays() {
  return prisma.itineraryDay.findMany({
    orderBy: [
      {
        itineraryId: "asc",
      },
      {
        dayNumber: "asc",
      },
    ],
    include: {
      itinerary: {
        select: {
          title: true,
        },
      },
      _count: {
        select: {
          activities: true,
        },
      },
    },
    take: 150,
  });
}

async function fetchActivities() {
  return prisma.activity.findMany({
    orderBy: [
      {
        itineraryDayId: "asc",
      },
      {
        orderIndex: "asc",
      },
    ],
    include: {
      day: {
        select: {
          title: true,
          itineraryId: true,
        },
      },
    },
    take: 200,
  });
}

async function fetchSaves() {
  return prisma.savedItinerary.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      itinerary: {
        select: {
          title: true,
        },
      },
    },
    take: 150,
  });
}

async function fetchLikes() {
  return prisma.like.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      itinerary: {
        select: {
          title: true,
        },
      },
    },
    take: 150,
  });
}

async function fetchSessions() {
  return prisma.session.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    take: 150,
  });
}

async function fetchAffiliateWhitelistDomains() {
  return prisma.affiliateWhitelistDomain.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const [users, itineraries, days, activities, saves, likes, sessions, affiliateWhitelistDomains] = await Promise.all([
    fetchUsers(),
    fetchItineraries(),
    fetchDays(),
    fetchActivities(),
    fetchSaves(),
    fetchLikes(),
    fetchSessions(),
    fetchAffiliateWhitelistDomains(),
  ]);

  return {
    users: users.map((record) =>
      serializeRecord({
        ...record,
        _related: record._count,
      }),
    ),
    itineraries: itineraries.map((record) =>
      serializeRecord({
        ...record,
        _related: {
          author: record.author,
          counts: record._count,
        },
      }),
    ),
    days: days.map((record) =>
      serializeRecord({
        ...record,
        _related: {
          itinerary: record.itinerary,
          counts: record._count,
        },
      }),
    ),
    activities: activities.map((record) =>
      serializeRecord({
        ...record,
        _related: {
          day: record.day,
        },
      }),
    ),
    saves: saves.map((record) =>
      serializeRecord({
        ...record,
        _related: {
          user: record.user,
          itinerary: record.itinerary,
        },
      }),
    ),
    likes: likes.map((record) =>
      serializeRecord({
        ...record,
        _related: {
          user: record.user,
          itinerary: record.itinerary,
        },
      }),
    ),
    sessions: sessions.map((record) =>
      serializeRecord({
        ...record,
        _related: {
          user: record.user,
        },
      }),
    ),
    affiliateWhitelistDomains: affiliateWhitelistDomains.map((record) =>
      serializeRecord(record),
    ),
  };
}

export async function listAdminRecords(table: AdminTable) {
  const snapshot = await getAdminSnapshot();
  return snapshot[table];
}

export async function createAdminRecord(table: AdminTable, rawData: Record<string, unknown>) {
  const data = stripMeta(rawData);

  switch (table) {
    case "users":
      let passwordHash = readString(data.passwordHash);
      if (passwordHash && !passwordHash.includes(":")) {
        passwordHash = await hashPassword(passwordHash);
      }
      return prisma.user.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          email: readString(data.email),
          username: readOptionalString(data.username) ?? null,
          passwordHash,
          name: readOptionalString(data.name) ?? null,
          avatarUrl: readOptionalString(data.avatarUrl) ?? null,
          bio: readOptionalString(data.bio) ?? null,
          city: readOptionalString(data.city) ?? null,
          role: readUserRole(data.role),
          isPro: readBoolean(data.isPro, false),
          maxPrivate: readInt(data.maxPrivate, 2),
          maxPublic: readInt(data.maxPublic, 5),
          maxSaved: readInt(data.maxSaved, 5),
          maxAffiliate: readInt(data.maxAffiliate, 50),
        },
      });
    case "itineraries":
      return prisma.itinerary.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          title: readString(data.title),
          destination: readString(data.destination),
          description: readString(data.description),
          durationDays: readInt(data.durationDays, 1),
          estimatedBudget: readInt(data.estimatedBudget, 0),
          travelStyle: readString(data.travelStyle, "Budget trip"),
          coverImageUrl: readString(data.coverImageUrl, "/uploads/default-cover.svg"),
          notes: readString(data.notes),
          isPublished: readBoolean(data.isPublished, true),
          originalItineraryId: readOptionalString(data.originalItineraryId) ?? undefined,
          authorId: readString(data.authorId),
        },
      });
    case "days":
      return prisma.itineraryDay.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          itineraryId: readString(data.itineraryId),
          dayNumber: readInt(data.dayNumber, 1),
          title: readString(data.title),
        },
      });
    case "activities":
      return prisma.activity.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          itineraryDayId: readString(data.itineraryDayId),
          time: readString(data.time),
          title: readString(data.title),
          locationName: readString(data.locationName),
          formattedAddress: readString(data.formattedAddress),
          latitude: readOptionalNumber(data.latitude),
          longitude: readOptionalNumber(data.longitude),
          mapProvider: readString(data.mapProvider),
          mapPlaceId: readString(data.mapPlaceId),
          customLocation: readBoolean(data.customLocation, false),
          description: readString(data.description),
          estimatedCost: readInt(data.estimatedCost, 0),
          category: readString(data.category, "Activity"),
          orderIndex: readInt(data.orderIndex, 0),
        },
      });
    case "saves":
      return prisma.savedItinerary.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          userId: readString(data.userId),
          itineraryId: readString(data.itineraryId),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "likes":
      return prisma.like.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          userId: readString(data.userId),
          itineraryId: readString(data.itineraryId),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "sessions":
      return prisma.session.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          token: readString(data.token),
          userId: readString(data.userId),
          expiresAt: readDate(data.expiresAt, new Date()),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "affiliateWhitelistDomains":
      return prisma.affiliateWhitelistDomain.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          domainPattern: readString(data.domainPattern),
          isActive: readBoolean(data.isActive, true),
          description: readOptionalString(data.description) ?? undefined,
        },
      });
  }
}

export async function updateAdminRecord(
  table: AdminTable,
  id: string,
  rawData: Record<string, unknown>,
) {
  const data = stripMeta(rawData);

  switch (table) {
    case "users":
      let passwordHash = readString(data.passwordHash);
      if (passwordHash && !passwordHash.includes(":")) {
        passwordHash = await hashPassword(passwordHash);
      }
      return prisma.user.update({
        where: { id },
        data: {
          email: readString(data.email),
          username: readOptionalString(data.username) ?? null,
          passwordHash,
          name: readOptionalString(data.name) ?? null,
          avatarUrl: readOptionalString(data.avatarUrl) ?? null,
          bio: readOptionalString(data.bio) ?? null,
          city: readOptionalString(data.city) ?? null,
          role: readUserRole(data.role),
          isPro: readBoolean(data.isPro, false),
          maxPrivate: readInt(data.maxPrivate, 2),
          maxPublic: readInt(data.maxPublic, 5),
          maxSaved: readInt(data.maxSaved, 5),
          maxAffiliate: readInt(data.maxAffiliate, 50),
        },
      });
    case "itineraries":
      return prisma.itinerary.update({
        where: { id },
        data: {
          title: readString(data.title),
          destination: readString(data.destination),
          description: readString(data.description),
          durationDays: readInt(data.durationDays, 1),
          estimatedBudget: readInt(data.estimatedBudget, 0),
          travelStyle: readString(data.travelStyle, "Budget trip"),
          coverImageUrl: readString(data.coverImageUrl, "/uploads/default-cover.svg"),
          notes: readString(data.notes),
          isPublished: readBoolean(data.isPublished, true),
          originalItineraryId: readOptionalString(data.originalItineraryId) ?? undefined,
          authorId: readString(data.authorId),
        },
      });
    case "days":
      return prisma.itineraryDay.update({
        where: { id },
        data: {
          itineraryId: readString(data.itineraryId),
          dayNumber: readInt(data.dayNumber, 1),
          title: readString(data.title),
        },
      });
    case "activities":
      return prisma.activity.update({
        where: { id },
        data: {
          itineraryDayId: readString(data.itineraryDayId),
          time: readString(data.time),
          title: readString(data.title),
          locationName: readString(data.locationName),
          formattedAddress: readString(data.formattedAddress),
          latitude: readOptionalNumber(data.latitude),
          longitude: readOptionalNumber(data.longitude),
          mapProvider: readString(data.mapProvider),
          mapPlaceId: readString(data.mapPlaceId),
          customLocation: readBoolean(data.customLocation, false),
          description: readString(data.description),
          estimatedCost: readInt(data.estimatedCost, 0),
          category: readString(data.category, "Activity"),
          orderIndex: readInt(data.orderIndex, 0),
        },
      });
    case "saves":
      return prisma.savedItinerary.update({
        where: { id },
        data: {
          userId: readString(data.userId),
          itineraryId: readString(data.itineraryId),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "likes":
      return prisma.like.update({
        where: { id },
        data: {
          userId: readString(data.userId),
          itineraryId: readString(data.itineraryId),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "sessions":
      return prisma.session.update({
        where: { id },
        data: {
          token: readString(data.token),
          userId: readString(data.userId),
          expiresAt: readDate(data.expiresAt, new Date()),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "affiliateWhitelistDomains":
      return prisma.affiliateWhitelistDomain.update({
        where: { id },
        data: {
          domainPattern: readString(data.domainPattern),
          isActive: readBoolean(data.isActive, true),
          description: readOptionalString(data.description) ?? undefined,
        },
      });
  }
}

export async function deleteAdminRecord(table: AdminTable, id: string) {
  switch (table) {
    case "users":
      return prisma.user.delete({ where: { id } });
    case "itineraries":
      return prisma.itinerary.delete({ where: { id } });
    case "days":
      return prisma.itineraryDay.delete({ where: { id } });
    case "activities":
      return prisma.activity.delete({ where: { id } });
    case "saves":
      return prisma.savedItinerary.delete({ where: { id } });
    case "likes":
      return prisma.like.delete({ where: { id } });
    case "sessions":
      return prisma.session.delete({ where: { id } });
    case "affiliateWhitelistDomains":
      return prisma.affiliateWhitelistDomain.delete({ where: { id } });
  }
}
