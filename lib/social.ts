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
