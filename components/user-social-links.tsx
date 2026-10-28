"use client";

import { trackEvent } from "@/lib/analytics";
import { getUserSocialLinks, type FormattedSocialLink, type SocialPlatform } from "@/lib/social";

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "tiktok":
      return (
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.95-4.49V8.58a8.28 8.28 0 0 0 4.82 1.54V6.69z" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
  }
}

const platformStyles: Record<
  SocialPlatform,
  {
    color: string;
    background: string;
    border: string;
    hoverBorder: string;
    hoverBg: string;
  }
> = {
  instagram: {
    color: "#e1306c",
    background: "rgba(225, 48, 108, 0.08)",
    border: "rgba(225, 48, 108, 0.22)",
    hoverBorder: "rgba(225, 48, 108, 0.45)",
    hoverBg: "rgba(225, 48, 108, 0.14)",
  },
  tiktok: {
    color: "var(--text, #111)",
    background: "rgba(0, 0, 0, 0.05)",
    border: "rgba(0, 0, 0, 0.15)",
    hoverBorder: "rgba(0, 0, 0, 0.35)",
    hoverBg: "rgba(0, 0, 0, 0.09)",
  },
  youtube: {
    color: "#e50914",
    background: "rgba(229, 9, 20, 0.08)",
    border: "rgba(229, 9, 20, 0.22)",
    hoverBorder: "rgba(229, 9, 20, 0.45)",
    hoverBg: "rgba(229, 9, 20, 0.14)",
  },
};

interface UserSocialLinksProps {
  user: {
    username?: string | null;
    id?: string;
    youtube?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
  };
  className?: string;
}

export function UserSocialLinks({ user, className = "" }: UserSocialLinksProps) {
  const links = getUserSocialLinks(user);

  if (links.length === 0) {
    return null;
  }

  const handleLinkClick = (link: FormattedSocialLink) => {
    trackEvent("click_user_social_link", {
      platform: link.platform,
      handle: link.handle,
      target_user: user.username || user.id,
    });
  };

  return (
    <div
      className={`user-social-links ${className}`}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "10px",
        alignItems: "center",
      }}
    >
      {links.map((link) => {
        const style = platformStyles[link.platform];
        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleLinkClick(link)}
            title={`${link.label}: ${link.handle}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              color: style.color,
              backgroundColor: style.background,
              border: `1px solid ${style.border}`,
              transition: "all 0.2s ease",
              lineHeight: 1.2,
            }}
          >
            <SocialIcon platform={link.platform} />
            <span>{link.handle}</span>
          </a>
        );
      })}
    </div>
  );
}
