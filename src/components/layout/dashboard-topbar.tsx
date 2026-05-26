"use client";

import { Menu } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";

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
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-md">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 lg:px-6 xl:px-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Buka menu"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-background transition-colors hover:bg-muted sm:h-10 sm:w-10 md:hidden"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
                {title}
              </h1>

              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                Hai, {name} 👋
              </p>

              {badgeLabel ? (
                <div className="mt-2 inline-flex max-w-full items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:px-3 sm:text-xs">
                  <span className="truncate">{badgeLabel}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}