"use client";

import Link, { type LinkProps } from "next/link";
import { trackEvent } from "@/lib/analytics";
import { useEffect, type ReactNode } from "react";

interface TrackedLinkProps extends LinkProps {
  eventName: string;
  eventParams?: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

export function TrackedLink({ eventName, eventParams, children, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={() => {
        trackEvent(eventName, eventParams);
      }}
    >
      {children}
    </Link>
  );
}

export function ProfileAnalytics({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
  useEffect(() => {
    trackEvent("view_profile", { username, is_own_profile: isOwnProfile });
  }, [username, isOwnProfile]);

  return null;
}
