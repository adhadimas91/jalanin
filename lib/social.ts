export type SocialPlatform = "youtube" | "instagram" | "tiktok";

export interface FormattedSocialLink {
  platform: SocialPlatform;
  url: string;
  handle: string;
  label: string;
}

export function formatSocialLink(
  platform: SocialPlatform,
  rawInput?: string | null
): FormattedSocialLink | null {
  if (!rawInput) return null;
  const input = rawInput.trim();
  if (!input) return null;

  switch (platform) {
    case "instagram": {
      if (input.startsWith("http://") || input.startsWith("https://")) {
        try {
          const parsed = new URL(input);
          const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");
          const handle = pathname ? `@${pathname}` : "@instagram";
          return {
            platform,
            url: input,
            handle,
            label: "Instagram",
          };
        } catch {
          return { platform, url: input, handle: input, label: "Instagram" };
        }
      }
      const cleanHandle = input.replace(/^@/, "").trim();
      return {
        platform,
        url: `https://instagram.com/${cleanHandle}`,
        handle: `@${cleanHandle}`,
        label: "Instagram",
      };
    }
    case "tiktok": {
      if (input.startsWith("http://") || input.startsWith("https://")) {
        try {
          const parsed = new URL(input);
          const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");
          const handle = pathname
            ? pathname.startsWith("@")
              ? pathname
              : `@${pathname}`
            : "@tiktok";
          return {
            platform,
            url: input,
            handle,
            label: "TikTok",
          };
        } catch {
          return { platform, url: input, handle: input, label: "TikTok" };
        }
      }
      const cleanHandle = input.replace(/^@/, "").trim();
      return {
        platform,
        url: `https://www.tiktok.com/@${cleanHandle}`,
        handle: `@${cleanHandle}`,
        label: "TikTok",
      };
    }
    case "youtube": {
      if (input.startsWith("http://") || input.startsWith("https://")) {
        try {
          const parsed = new URL(input);
          const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");
          let handle = "YouTube";
          if (pathname.startsWith("@")) {
            handle = pathname;
          } else if (pathname.startsWith("c/") || pathname.startsWith("user/")) {
            handle = `@${pathname.split("/")[1] || "youtube"}`;
          }
          return {
            platform,
            url: input,
            handle,
            label: "YouTube",
          };
        } catch {
          return { platform, url: input, handle: input, label: "YouTube" };
        }
      }
      const cleanHandle = input.trim();
      const handleWithAt = cleanHandle.startsWith("@") ? cleanHandle : `@${cleanHandle}`;
      return {
        platform,
        url: `https://www.youtube.com/${handleWithAt}`,
        handle: handleWithAt,
        label: "YouTube",
      };
    }
    default:
      return null;
  }
}

export function extractYoutubeHandleFromUrl(rawInput?: string | null): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/@([^/?#\s]+)/i
  );
  return match?.[1] ?? null;
}

export function normalizeYoutubeIdentifier(rawInput?: string | null): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const handle = extractYoutubeHandleFromUrl(trimmed);
  if (handle) {
    return `@${handle.toLowerCase()}`;
  }

  if (!trimmed.includes("/") && !trimmed.includes("://")) {
    return `@${trimmed.replace(/^@/, "").toLowerCase()}`;
  }

  return trimmed.toLowerCase().replace(/\/+$/, "");
}

export interface UserIdentityRecord {
  id?: string | null;
  email?: string | null;
  username?: string | null;
  youtube?: string | null;
  name?: string | null;
}

export function findDuplicateUserConflicts(
  candidate: UserIdentityRecord,
  existingUsers: UserIdentityRecord[],
  excludeUserId?: string | null
): string[] {
  const conflicts: string[] = [];
  const candidateEmail = candidate.email?.trim().toLowerCase() || null;
  const candidateUsername = candidate.username?.trim().toLowerCase() || null;
  const candidateYoutube = normalizeYoutubeIdentifier(candidate.youtube);
  const isPlaceholderEmail = (email: string) => email.endsWith("@kurasi.jalanin.local");

  for (const existing of existingUsers) {
    if (excludeUserId && existing.id === excludeUserId) {
      continue;
    }

    const existingLabel =
      existing.name || existing.username || existing.email || existing.id || "user lain";

    const existingEmail = existing.email?.trim().toLowerCase() || null;
    if (
      candidateEmail &&
      !isPlaceholderEmail(candidateEmail) &&
      existingEmail &&
      candidateEmail === existingEmail
    ) {
      conflicts.push(
        `Email "${candidate.email?.trim()}" sudah terdaftar pada user "${existingLabel}".`
      );
    }

    const existingUsername = existing.username?.trim().toLowerCase() || null;
    if (candidateUsername && existingUsername && candidateUsername === existingUsername) {
      conflicts.push(
        `Username "${candidate.username?.trim()}" sudah terdaftar pada user "${existingLabel}".`
      );
    }

    const existingYoutube = normalizeYoutubeIdentifier(existing.youtube);
    if (candidateYoutube && existingYoutube && candidateYoutube === existingYoutube) {
      conflicts.push(
        `YouTube "${candidate.youtube?.trim()}" sudah terdaftar pada user "${existingLabel}".`
      );
    }
  }

  return Array.from(new Set(conflicts));
}

export function getUserSocialLinks(user: {
  youtube?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
}): FormattedSocialLink[] {
  const links: FormattedSocialLink[] = [];

  const ig = formatSocialLink("instagram", user.instagram);
  if (ig) links.push(ig);

  const tt = formatSocialLink("tiktok", user.tiktok);
  if (tt) links.push(tt);

  const yt = formatSocialLink("youtube", user.youtube);
  if (yt) links.push(yt);

  return links;
}
