import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendClaimApprovedEmail, sendClaimRejectedEmail, getBaseUrl } from "@/lib/email";
import { detectProvider } from "@/lib/mylink-validator";

export const adminTables = [
  "users",
  "accountClaims",
  "itineraries",
  "days",
  "activities",
  "myLinks",
  "saves",
  "likes",
  "sessions",
  "myLinkWhitelistDomains",
  "appSettings",
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

export class AdminValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "AdminValidationError";
  }
}

export function formatAdminError(error: unknown): { message: string; status: number } {
  if (error instanceof AdminValidationError) {
    return { message: error.message, status: error.status };
  }

  if (error && typeof error === "object" && "code" in error) {
    const prismaErr = error as {
      code?: string;
      meta?: Record<string, unknown>;
      message?: string;
    };

    if (prismaErr.code === "P2002") {
      const rawTarget = prismaErr.meta?.target;
      const target = Array.isArray(rawTarget)
        ? rawTarget.join(", ")
        : typeof rawTarget === "string"
          ? rawTarget
          : "";
      return {
        message: `Data duplikat: nilai pada field unik${target ? ` (${target})` : ""} sudah digunakan.`,
        status: 409,
      };
    }

    if (prismaErr.code === "P2003") {
      const rawField = prismaErr.meta?.field_name ?? prismaErr.meta?.constraint;
      const field = typeof rawField === "string" ? rawField : "";
      return {
        message: `ID relasi tidak ditemukan atau tidak valid${field ? ` (${field})` : ""}. Pastikan ID referensi benar.`,
        status: 400,
      };
    }

    if (prismaErr.code === "P2025") {
      return {
        message: "Record tidak ditemukan di database.",
        status: 404,
      };
    }
  }

  return {
    message:
      error instanceof Error && error.message.trim()
        ? error.message
        : "Terjadi kesalahan pada server saat memproses data admin.",
    status: 500,
  };
}

function stripMeta(input: Record<string, unknown>) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AdminValidationError("Data record harus berupa objek JSON yang valid.");
  }

  return Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) => !key.startsWith("_") && (value === null || typeof value !== "object"),
    ),
  );
}

function readRequiredString(value: unknown, fieldLabel: string) {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) {
    throw new AdminValidationError(`Field "${fieldLabel}" wajib diisi.`);
  }
  return str;
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

function readOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function readUserRole(value: unknown) {
  return String(value).toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

function readAccountClaimStatus(value: unknown): "PENDING" | "APPROVED" | "REJECTED" {
  const val = String(value).toUpperCase();
  if (val === "APPROVED" || val === "REJECTED") {
    return val;
  }
  return "PENDING";
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
          claims: true,
        },
      },
    },
    take: 100,
  });
}

async function fetchAccountClaims() {
  return prisma.accountClaim.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatarUrl: true,
          isClaimed: true,
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
          id: true,
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
          id: true,
          title: true,
          authorId: true,
          author: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
            },
          },
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
          id: true,
          title: true,
          dayNumber: true,
          itineraryId: true,
          itinerary: {
            select: {
              id: true,
              title: true,
              authorId: true,
              author: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      myLink: {
        select: {
          id: true,
          label: true,
          provider: true,
          actualUrl: true,
          userId: true,
        },
      },
    },
    take: 500,
  });
}

async function fetchMyLinks() {
  return prisma.myLink.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
        },
      },
      activities: {
        select: {
          id: true,
          title: true,
          time: true,
          locationName: true,
          category: true,
          estimatedCost: true,
          itineraryDayId: true,
          day: {
            select: {
              id: true,
              dayNumber: true,
              title: true,
              itineraryId: true,
              itinerary: {
                select: {
                  id: true,
                  title: true,
                  destination: true,
                  authorId: true,
                  author: {
                    select: {
                      id: true,
                      email: true,
                      username: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          activities: true,
        },
      },
    },
    take: 500,
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

async function fetchMyLinkWhitelistDomains() {
  return prisma.myLinkWhitelistDomain.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

function serializeUsers(users: Awaited<ReturnType<typeof fetchUsers>>) {
  return users.map(({ _count, ...record }) =>
    serializeRecord({
      ...record,
      _related: _count,
    }),
  );
}

function serializeAccountClaims(accountClaims: Awaited<ReturnType<typeof fetchAccountClaims>>) {
  return accountClaims.map(({ user, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        user,
      },
    }),
  );
}

function serializeItineraries(itineraries: Awaited<ReturnType<typeof fetchItineraries>>) {
  return itineraries.map(({ author, _count, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        author,
        counts: _count,
      },
    }),
  );
}

function serializeDays(days: Awaited<ReturnType<typeof fetchDays>>) {
  return days.map(({ itinerary, _count, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        itinerary,
        counts: _count,
      },
    }),
  );
}

function serializeActivities(activities: Awaited<ReturnType<typeof fetchActivities>>) {
  return activities.map(({ day, myLink, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        day,
        myLink,
      },
    }),
  );
}

function serializeMyLinks(myLinks: Awaited<ReturnType<typeof fetchMyLinks>>) {
  return myLinks.map(({ user, activities: linkedActivities, _count, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        user,
        activities: linkedActivities,
        counts: _count,
      },
    }),
  );
}

function serializeSaves(saves: Awaited<ReturnType<typeof fetchSaves>>) {
  return saves.map(({ user, itinerary, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        user,
        itinerary,
      },
    }),
  );
}

function serializeLikes(likes: Awaited<ReturnType<typeof fetchLikes>>) {
  return likes.map(({ user, itinerary, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        user,
        itinerary,
      },
    }),
  );
}

function serializeSessions(sessions: Awaited<ReturnType<typeof fetchSessions>>) {
  return sessions.map(({ user, ...record }) =>
    serializeRecord({
      ...record,
      _related: {
        user,
      },
    }),
  );
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const [
    users,
    accountClaims,
    itineraries,
    days,
    activities,
    myLinks,
    saves,
    likes,
    sessions,
    myLinkWhitelistDomains,
    appSettings,
  ] = await Promise.all([
    fetchUsers(),
    fetchAccountClaims(),
    fetchItineraries(),
    fetchDays(),
    fetchActivities(),
    fetchMyLinks(),
    fetchSaves(),
    fetchLikes(),
    fetchSessions(),
    fetchMyLinkWhitelistDomains(),
    prisma.appSetting.findMany({ orderBy: { key: "asc" } }),
  ]);

  return {
    users: serializeUsers(users),
    accountClaims: serializeAccountClaims(accountClaims),
    itineraries: serializeItineraries(itineraries),
    days: serializeDays(days),
    activities: serializeActivities(activities),
    myLinks: serializeMyLinks(myLinks),
    saves: serializeSaves(saves),
    likes: serializeLikes(likes),
    sessions: serializeSessions(sessions),
    myLinkWhitelistDomains: myLinkWhitelistDomains.map((record) =>
      serializeRecord(record),
    ),
    appSettings: appSettings.map((record) =>
      serializeRecord(record),
    ),
  };
}

export async function listAdminRecords(table: AdminTable): Promise<AdminRecord[]> {
  switch (table) {
    case "users":
      return serializeUsers(await fetchUsers());
    case "accountClaims":
      return serializeAccountClaims(await fetchAccountClaims());
    case "itineraries":
      return serializeItineraries(await fetchItineraries());
    case "days":
      return serializeDays(await fetchDays());
    case "activities":
      return serializeActivities(await fetchActivities());
    case "myLinks":
      return serializeMyLinks(await fetchMyLinks());
    case "saves":
      return serializeSaves(await fetchSaves());
    case "likes":
      return serializeLikes(await fetchLikes());
    case "sessions":
      return serializeSessions(await fetchSessions());
    case "myLinkWhitelistDomains":
      return (await fetchMyLinkWhitelistDomains()).map((record) => serializeRecord(record));
    case "appSettings":
      return (await prisma.appSetting.findMany({ orderBy: { key: "asc" } })).map((record) =>
        serializeRecord(record),
      );
  }
}

export async function createAdminRecord(table: AdminTable, rawData: Record<string, unknown>) {
  const data = stripMeta(rawData);

  switch (table) {
    case "users": {
      const email = readRequiredString(data.email, "email");
      let passwordHash = readString(data.passwordHash);
      if (passwordHash && !passwordHash.includes(":")) {
        passwordHash = await hashPassword(passwordHash);
      }
      return prisma.user.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          email,
          username: readOptionalString(data.username) ?? null,
          passwordHash,
          name: readOptionalString(data.name) ?? null,
          avatarUrl: readOptionalString(data.avatarUrl) ?? null,
          bio: readOptionalString(data.bio) ?? null,
          city: readOptionalString(data.city) ?? null,
          youtube: readOptionalString(data.youtube) ?? null,
          instagram: readOptionalString(data.instagram) ?? null,
          tiktok: readOptionalString(data.tiktok) ?? null,
          role: readUserRole(data.role),
          isPro: readBoolean(data.isPro, false),
          proExpiresAt: readOptionalDate(data.proExpiresAt),
          isClaimed: readBoolean(data.isClaimed, true),
          maxPrivate: readInt(data.maxPrivate, 2),
          maxPublic: readInt(data.maxPublic, 5),
          maxSaved: readInt(data.maxSaved, 5),
          maxMyLink: readInt(data.maxMyLink, 50),
        },
      });
    }
    case "accountClaims":
      return prisma.accountClaim.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          userId: readRequiredString(data.userId, "userId"),
          claimantName: readRequiredString(data.claimantName, "claimantName"),
          claimantEmail: readRequiredString(data.claimantEmail, "claimantEmail"),
          socialHandle: readString(data.socialHandle),
          proofNotes: readString(data.proofNotes),
          status: readAccountClaimStatus(data.status),
          adminNotes: readOptionalString(data.adminNotes),
          token: readOptionalString(data.token),
          tokenExpiresAt: readOptionalDate(data.tokenExpiresAt),
        },
      });
    case "itineraries":
      return prisma.itinerary.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          title: readRequiredString(data.title, "title"),
          destination: readRequiredString(data.destination, "destination"),
          description: readString(data.description),
          durationDays: readInt(data.durationDays, 1),
          estimatedBudget: readInt(data.estimatedBudget, 0),
          travelStyle: readString(data.travelStyle, "Budget trip"),
          coverImageUrl: readString(data.coverImageUrl, "/uploads/default-cover.svg"),
          notes: readString(data.notes),
          isPublished: readBoolean(data.isPublished, true),
          originalItineraryId: readOptionalString(data.originalItineraryId) ?? undefined,
          authorId: readRequiredString(data.authorId, "authorId"),
        },
      });
    case "days":
      return prisma.itineraryDay.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          itineraryId: readRequiredString(data.itineraryId, "itineraryId"),
          dayNumber: readInt(data.dayNumber, 1),
          title: readRequiredString(data.title, "title"),
        },
      });
    case "activities":
      return prisma.activity.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          itineraryDayId: readRequiredString(data.itineraryDayId, "itineraryDayId"),
          time: readString(data.time),
          title: readRequiredString(data.title, "title"),
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
          myLinkId: readOptionalString(data.myLinkId),
          orderIndex: readInt(data.orderIndex, 0),
        },
      });
    case "myLinks": {
      const actualUrl = readRequiredString(data.actualUrl, "actualUrl");
      const provider = readString(data.provider) || detectProvider(actualUrl);
      return prisma.myLink.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          userId: readRequiredString(data.userId, "userId"),
          label: readRequiredString(data.label, "label"),
          provider,
          actualUrl,
        },
      });
    }
    case "saves":
      return prisma.savedItinerary.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          userId: readRequiredString(data.userId, "userId"),
          itineraryId: readRequiredString(data.itineraryId, "itineraryId"),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "likes":
      return prisma.like.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          userId: readRequiredString(data.userId, "userId"),
          itineraryId: readRequiredString(data.itineraryId, "itineraryId"),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "sessions":
      return prisma.session.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          token: readRequiredString(data.token, "token"),
          userId: readRequiredString(data.userId, "userId"),
          expiresAt: readDate(data.expiresAt, new Date()),
          createdAt: readDate(data.createdAt, new Date()),
        },
      });
    case "myLinkWhitelistDomains":
      return prisma.myLinkWhitelistDomain.create({
        data: {
          id: readOptionalString(data.id) ?? undefined,
          domainPattern: readRequiredString(data.domainPattern, "domainPattern"),
          isActive: readBoolean(data.isActive, true),
          description: readOptionalString(data.description) ?? undefined,
        },
      });
    case "appSettings":
      return prisma.appSetting.create({
        data: {
          key: readRequiredString(data.key, "key"),
          value: readString(data.value),
        },
      });
  }
}

export async function updateAdminRecord(
  table: AdminTable,
  id: string,
  rawData: Record<string, unknown>,
) {
  if (!id || !id.trim()) {
    throw new AdminValidationError("ID record yang akan diperbarui tidak valid.");
  }

  const data = stripMeta(rawData);

  switch (table) {
    case "users": {
      let passwordHash = readString(data.passwordHash);
      if (passwordHash && !passwordHash.includes(":")) {
        passwordHash = await hashPassword(passwordHash);
      }
      return prisma.user.update({
        where: { id },
        data: {
          ...("email" in data ? { email: readRequiredString(data.email, "email") } : {}),
          ...("username" in data ? { username: readOptionalString(data.username) ?? null } : {}),
          ...(passwordHash ? { passwordHash } : {}),
          ...("name" in data ? { name: readOptionalString(data.name) ?? null } : {}),
          ...("avatarUrl" in data ? { avatarUrl: readOptionalString(data.avatarUrl) ?? null } : {}),
          ...("bio" in data ? { bio: readOptionalString(data.bio) ?? null } : {}),
          ...("city" in data ? { city: readOptionalString(data.city) ?? null } : {}),
          ...("youtube" in data ? { youtube: readOptionalString(data.youtube) ?? null } : {}),
          ...("instagram" in data ? { instagram: readOptionalString(data.instagram) ?? null } : {}),
          ...("tiktok" in data ? { tiktok: readOptionalString(data.tiktok) ?? null } : {}),
          ...("role" in data ? { role: readUserRole(data.role) } : {}),
          ...("isPro" in data ? { isPro: readBoolean(data.isPro, false) } : {}),
          ...("proExpiresAt" in data ? { proExpiresAt: readOptionalDate(data.proExpiresAt) } : {}),
          ...("isClaimed" in data ? { isClaimed: readBoolean(data.isClaimed, true) } : {}),
          ...("maxPrivate" in data ? { maxPrivate: readInt(data.maxPrivate, 2) } : {}),
          ...("maxPublic" in data ? { maxPublic: readInt(data.maxPublic, 5) } : {}),
          ...("maxSaved" in data ? { maxSaved: readInt(data.maxSaved, 5) } : {}),
          ...("maxMyLink" in data ? { maxMyLink: readInt(data.maxMyLink, 50) } : {}),
        },
      });
    }
    case "accountClaims":
      return prisma.accountClaim.update({
        where: { id },
        data: {
          ...("userId" in data ? { userId: readRequiredString(data.userId, "userId") } : {}),
          ...("claimantName" in data
            ? { claimantName: readRequiredString(data.claimantName, "claimantName") }
            : {}),
          ...("claimantEmail" in data
            ? { claimantEmail: readRequiredString(data.claimantEmail, "claimantEmail") }
            : {}),
          ...("socialHandle" in data ? { socialHandle: readString(data.socialHandle) } : {}),
          ...("proofNotes" in data ? { proofNotes: readString(data.proofNotes) } : {}),
          ...("status" in data ? { status: readAccountClaimStatus(data.status) } : {}),
          ...("adminNotes" in data ? { adminNotes: readOptionalString(data.adminNotes) } : {}),
          ...("token" in data ? { token: readOptionalString(data.token) } : {}),
          ...("tokenExpiresAt" in data
            ? { tokenExpiresAt: readOptionalDate(data.tokenExpiresAt) }
            : {}),
        },
      });
    case "itineraries":
      return prisma.itinerary.update({
        where: { id },
        data: {
          ...("title" in data ? { title: readRequiredString(data.title, "title") } : {}),
          ...("destination" in data
            ? { destination: readRequiredString(data.destination, "destination") }
            : {}),
          ...("description" in data ? { description: readString(data.description) } : {}),
          ...("durationDays" in data ? { durationDays: readInt(data.durationDays, 1) } : {}),
          ...("estimatedBudget" in data
            ? { estimatedBudget: readInt(data.estimatedBudget, 0) }
            : {}),
          ...("travelStyle" in data
            ? { travelStyle: readString(data.travelStyle, "Budget trip") }
            : {}),
          ...("coverImageUrl" in data
            ? { coverImageUrl: readString(data.coverImageUrl, "/uploads/default-cover.svg") }
            : {}),
          ...("notes" in data ? { notes: readString(data.notes) } : {}),
          ...("isPublished" in data ? { isPublished: readBoolean(data.isPublished, true) } : {}),
          ...("originalItineraryId" in data
            ? { originalItineraryId: readOptionalString(data.originalItineraryId) }
            : {}),
          ...("authorId" in data ? { authorId: readRequiredString(data.authorId, "authorId") } : {}),
        },
      });
    case "days":
      return prisma.itineraryDay.update({
        where: { id },
        data: {
          ...("itineraryId" in data
            ? { itineraryId: readRequiredString(data.itineraryId, "itineraryId") }
            : {}),
          ...("dayNumber" in data ? { dayNumber: readInt(data.dayNumber, 1) } : {}),
          ...("title" in data ? { title: readRequiredString(data.title, "title") } : {}),
        },
      });
    case "activities":
      return prisma.activity.update({
        where: { id },
        data: {
          ...("itineraryDayId" in data
            ? { itineraryDayId: readRequiredString(data.itineraryDayId, "itineraryDayId") }
            : {}),
          ...("time" in data ? { time: readString(data.time) } : {}),
          ...("title" in data ? { title: readRequiredString(data.title, "title") } : {}),
          ...("locationName" in data ? { locationName: readString(data.locationName) } : {}),
          ...("formattedAddress" in data
            ? { formattedAddress: readString(data.formattedAddress) }
            : {}),
          ...("latitude" in data ? { latitude: readOptionalNumber(data.latitude) } : {}),
          ...("longitude" in data ? { longitude: readOptionalNumber(data.longitude) } : {}),
          ...("mapProvider" in data ? { mapProvider: readString(data.mapProvider) } : {}),
          ...("mapPlaceId" in data ? { mapPlaceId: readString(data.mapPlaceId) } : {}),
          ...("customLocation" in data
            ? { customLocation: readBoolean(data.customLocation, false) }
            : {}),
          ...("description" in data ? { description: readString(data.description) } : {}),
          ...("estimatedCost" in data ? { estimatedCost: readInt(data.estimatedCost, 0) } : {}),
          ...("category" in data ? { category: readString(data.category, "Activity") } : {}),
          ...("myLinkId" in data ? { myLinkId: readOptionalString(data.myLinkId) } : {}),
          ...("orderIndex" in data ? { orderIndex: readInt(data.orderIndex, 0) } : {}),
        },
      });
    case "myLinks": {
      const actualUrl =
        "actualUrl" in data ? readRequiredString(data.actualUrl, "actualUrl") : undefined;
      const rawProvider = "provider" in data ? readString(data.provider) : undefined;
      const provider =
        rawProvider || (actualUrl !== undefined ? detectProvider(actualUrl) : undefined);
      return prisma.myLink.update({
        where: { id },
        data: {
          ...("userId" in data ? { userId: readRequiredString(data.userId, "userId") } : {}),
          ...("label" in data ? { label: readRequiredString(data.label, "label") } : {}),
          ...(provider !== undefined ? { provider } : {}),
          ...(actualUrl !== undefined ? { actualUrl } : {}),
        },
      });
    }
    case "saves":
      return prisma.savedItinerary.update({
        where: { id },
        data: {
          ...("userId" in data ? { userId: readRequiredString(data.userId, "userId") } : {}),
          ...("itineraryId" in data
            ? { itineraryId: readRequiredString(data.itineraryId, "itineraryId") }
            : {}),
          ...("createdAt" in data ? { createdAt: readDate(data.createdAt, new Date()) } : {}),
        },
      });
    case "likes":
      return prisma.like.update({
        where: { id },
        data: {
          ...("userId" in data ? { userId: readRequiredString(data.userId, "userId") } : {}),
          ...("itineraryId" in data
            ? { itineraryId: readRequiredString(data.itineraryId, "itineraryId") }
            : {}),
          ...("createdAt" in data ? { createdAt: readDate(data.createdAt, new Date()) } : {}),
        },
      });
    case "sessions":
      return prisma.session.update({
        where: { id },
        data: {
          ...("token" in data ? { token: readRequiredString(data.token, "token") } : {}),
          ...("userId" in data ? { userId: readRequiredString(data.userId, "userId") } : {}),
          ...("expiresAt" in data ? { expiresAt: readDate(data.expiresAt, new Date()) } : {}),
          ...("createdAt" in data ? { createdAt: readDate(data.createdAt, new Date()) } : {}),
        },
      });
    case "myLinkWhitelistDomains":
      return prisma.myLinkWhitelistDomain.update({
        where: { id },
        data: {
          ...("domainPattern" in data
            ? { domainPattern: readRequiredString(data.domainPattern, "domainPattern") }
            : {}),
          ...("isActive" in data ? { isActive: readBoolean(data.isActive, true) } : {}),
          ...("description" in data ? { description: readOptionalString(data.description) } : {}),
        },
      });
    case "appSettings":
      return prisma.appSetting.update({
        where: { key: id },
        data: {
          ...("value" in data ? { value: readString(data.value) } : {}),
        },
      });
  }
}

export async function deleteAdminRecord(table: AdminTable, id: string) {
  switch (table) {
    case "users":
      return prisma.user.delete({ where: { id } });
    case "accountClaims":
      return prisma.accountClaim.delete({ where: { id } });
    case "itineraries":
      return prisma.itinerary.delete({ where: { id } });
    case "days":
      return prisma.itineraryDay.delete({ where: { id } });
    case "activities":
      return prisma.activity.delete({ where: { id } });
    case "myLinks":
      return prisma.myLink.delete({ where: { id } });
    case "saves":
      return prisma.savedItinerary.delete({ where: { id } });
    case "likes":
      return prisma.like.delete({ where: { id } });
    case "sessions":
      return prisma.session.delete({ where: { id } });
    case "myLinkWhitelistDomains":
      return prisma.myLinkWhitelistDomain.delete({ where: { id } });
    case "appSettings":
      return prisma.appSetting.delete({ where: { key: id } });
  }
}

export async function bulkDeleteAdminRecords(table: AdminTable, ids: string[]) {
  if (!ids.length) return { count: 0 };

  switch (table) {
    case "users":
      return prisma.user.deleteMany({ where: { id: { in: ids } } });
    case "accountClaims":
      return prisma.accountClaim.deleteMany({ where: { id: { in: ids } } });
    case "itineraries":
      return prisma.itinerary.deleteMany({ where: { id: { in: ids } } });
    case "days":
      return prisma.itineraryDay.deleteMany({ where: { id: { in: ids } } });
    case "activities":
      return prisma.activity.deleteMany({ where: { id: { in: ids } } });
    case "myLinks":
      return prisma.myLink.deleteMany({ where: { id: { in: ids } } });
    case "saves":
      return prisma.savedItinerary.deleteMany({ where: { id: { in: ids } } });
    case "likes":
      return prisma.like.deleteMany({ where: { id: { in: ids } } });
    case "sessions":
      return prisma.session.deleteMany({ where: { id: { in: ids } } });
    case "myLinkWhitelistDomains":
      return prisma.myLinkWhitelistDomain.deleteMany({ where: { id: { in: ids } } });
    case "appSettings":
      return prisma.appSetting.deleteMany({ where: { key: { in: ids } } });
  }
}

export async function bulkCreateAdminRecords(
  table: AdminTable,
  items: Record<string, unknown>[],
) {
  const created = [];
  for (const item of items) {
    const res = await createAdminRecord(table, item);
    created.push(res);
  }
  return { count: created.length, records: created };
}

export async function bulkUpdateAdminRecords(
  table: AdminTable,
  ids: string[],
  patch: Record<string, unknown>,
) {
  if (!ids.length) return { count: 0 };

  if (table === "activities") {
    const data: Record<string, unknown> = {};
    if ("myLinkId" in patch) {
      data.myLinkId = readOptionalString(patch.myLinkId);
    }
    if ("category" in patch && patch.category) {
      data.category = readString(patch.category);
    }
    if ("itineraryDayId" in patch && patch.itineraryDayId) {
      data.itineraryDayId = readString(patch.itineraryDayId);
    }
    return prisma.activity.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  if (table === "myLinks") {
    const data: Record<string, unknown> = {};
    if ("provider" in patch && patch.provider) {
      data.provider = readString(patch.provider);
    }
    if ("userId" in patch && patch.userId) {
      data.userId = readString(patch.userId);
    }
    if ("label" in patch && patch.label) {
      data.label = readString(patch.label);
    }
    if ("actualUrl" in patch && patch.actualUrl) {
      const actualUrl = readString(patch.actualUrl);
      data.actualUrl = actualUrl;
      if (!data.provider) {
        data.provider = detectProvider(actualUrl);
      }
    }
    return prisma.myLink.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  let updatedCount = 0;
  for (const id of ids) {
    const existingList = await listAdminRecords(table);
    const existing = existingList.find((r) => String(r.id ?? r.key ?? "") === id);
    if (existing) {
      await updateAdminRecord(table, id, { ...existing, ...patch });
      updatedCount += 1;
    }
  }
  return { count: updatedCount };
}

export async function bulkSetActivitiesMyLink(
  activityIds: string[],
  myLinkId: string | null,
) {
  if (!activityIds.length) return { count: 0 };
  return prisma.activity.updateMany({
    where: { id: { in: activityIds } },
    data: { myLinkId: myLinkId || null },
  });
}

export async function bulkUnlinkMyLinksFromActivities(myLinkIds: string[]) {
  if (!myLinkIds.length) return { count: 0 };
  return prisma.activity.updateMany({
    where: { myLinkId: { in: myLinkIds } },
    data: { myLinkId: null },
  });
}

export async function approveAccountClaim(claimId: string, adminNotes?: string) {
  const claim = await prisma.accountClaim.findUnique({
    where: { id: claimId },
    include: { user: true },
  });

  if (!claim) {
    throw new Error("Data permohonan klaim tidak ditemukan");
  }

  // Generate random token for password setup (valid 48 hours)
  const token = randomBytes(32).toString("hex");
  const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const updatedClaim = await prisma.accountClaim.update({
    where: { id: claimId },
    data: {
      status: "APPROVED",
      adminNotes: adminNotes ?? claim.adminNotes,
      token,
      tokenExpiresAt,
    },
  });

  const baseUrl = getBaseUrl();
  const setupUrl = `${baseUrl}/setup-password?token=${token}`;

  await sendClaimApprovedEmail({
    to: claim.claimantEmail,
    claimantName: claim.claimantName,
    username: claim.user.username || claim.user.name || claim.userId,
    setupUrl,
    expiresInHours: 48,
  });

  return {
    claim: updatedClaim,
    setupUrl,
    token,
  };
}

export async function rejectAccountClaim(claimId: string, adminNotes?: string) {
  const claim = await prisma.accountClaim.findUnique({
    where: { id: claimId },
    include: { user: true },
  });

  if (!claim) {
    throw new Error("Data permohonan klaim tidak ditemukan");
  }

  const updatedClaim = await prisma.accountClaim.update({
    where: { id: claimId },
    data: {
      status: "REJECTED",
      adminNotes: adminNotes ?? claim.adminNotes,
    },
  });

  await sendClaimRejectedEmail({
    to: claim.claimantEmail,
    claimantName: claim.claimantName,
    username: claim.user.username || claim.user.name || claim.userId,
    reason: adminNotes,
  });

  return updatedClaim;
}

