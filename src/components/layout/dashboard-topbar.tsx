"use client";

import { Menu } from "lucide-react";

interface DashboardTopbarProps {
  title: string;
  name: string;
  badgeLabel?: string | null;
  onMenuClick: () => void;
}

export function DashboardTopbar({
  title,
  name,
  badgeLabel,
  onMenuClick,
}: DashboardTopbarProps) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "#FFE600",
        borderBottom: "1px solid #e6d800",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
      }}
    >
      <div className="px-3 py-3 sm:px-4 md:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Buka menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5 md:hidden"
            >
              <Menu className="h-5 w-5" style={{ color: "#003B8E" }} />
            </button>

            <div className="min-w-0">
              <h1
                className="truncate text-xl font-bold tracking-tight sm:text-2xl"
                style={{ color: "#003B8E" }}
              >
                {title}
              </h1>
              <p className="mt-0.5 truncate text-sm" style={{ color: "#1a3a6b" }}>
                Hai,{" "}
                <span className="font-semibold">{name}</span>
              </p>
            </div>
          </div>

          {/* Right — Badge */}
          {badgeLabel && (
            <div
              className="hidden sm:flex items-center rounded-full px-4 py-1.5"
              style={{
                background: "#0072CE",
                boxShadow: "0 1px 6px rgba(0,114,206,0.3)",
              }}
            >
              <span className="text-sm font-semibold text-white tracking-wide">
                {badgeLabel}
              </span>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
