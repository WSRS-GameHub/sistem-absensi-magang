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
    <header className="sticky top-0 z-40 border-b border-[#E5BC2E] bg-[#FFD453] shadow-sm">
      <div className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Buka menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E5BC2E] bg-white shadow-sm transition-all duration-200 hover:bg-yellow-100 md:hidden"
            >
              <Menu className="h-4 w-4 text-[#0072CE]" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-none tracking-tight text-gray-900 md:text-xl">
                {title}
              </h1>

              <p className="mt-0.5 truncate text-xs text-gray-700">
                Hai, {name} 👋
              </p>

              {badgeLabel ? (
                <div className="mt-1 inline-flex max-w-full items-center rounded-full bg-[#0072CE] px-2 py-[2px] text-[10px] font-semibold text-white shadow-sm">
                  <span className="truncate">{badgeLabel}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-[#E5BC2E] bg-white p-0.5 shadow-sm">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}