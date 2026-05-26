"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  href: string;
  unreadCount?: number;
}

export function NotificationBell({
  href,
  unreadCount = 0,
}: NotificationBellProps) {
  return (
    <Link
      href={href}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Pemberitahuan"
    >
      <Bell className="h-4 w-4" />

      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}