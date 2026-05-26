"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ClipboardList,
  Bell,
  User,
  LogOut,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

type NavigationItem = {
  title: string;
  href: string;
  icon: string;
};

interface DashboardSidebarProps {
  title: string;
  navigation: NavigationItem[];
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const iconMap = {
  dashboard: LayoutDashboard,
  users: Users,
  absensi: ClipboardCheck,
  tugas: ClipboardList,
  pengumuman: Bell,
  profile: User,
};

function SidebarNav({
  navigation,
  pathname,
  onNavigate,
}: {
  navigation: NavigationItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 px-3 py-3">
      {navigation.map((item) => {
        const Icon =
          iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
              pathname === item.href
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar({
  title,
  navigation,
  mobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      toast.success("Logout berhasil");

      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Gagal logout");
    }
  };

  return (
    <>
      {/* BACKDROP MOBILE */}
      <div
        className={cn(
          "fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />

      {/* SIDEBAR MOBILE */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[9999] flex w-[250px] max-w-[82vw] flex-col border-r border-border/40 bg-background/95 backdrop-blur-xl md:hidden",
          "transition-transform duration-300 ease-out",
          "shadow-[0_10px_40px_rgba(0,0,0,0.45)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-4">
          <div className="flex items-center gap-3">
            <BrandMark />

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight">
                {title}
              </h1>

              <p className="text-[11px] text-muted-foreground">
                Corporate PLN
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background/70 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav
            navigation={navigation}
            pathname={pathname}
            onNavigate={onCloseMobile}
          />
        </div>

        {/* FOOTER */}
        <div className="border-t border-border/30 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* DESKTOP */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border/40 bg-background/80 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen">
        {/* HEADER */}
        <div className="border-b border-border/30 px-5 py-5">
          <div className="flex items-center gap-3">
            <BrandMark />

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight">
                {title}
              </h1>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav navigation={navigation} pathname={pathname} />
        </div>

        {/* FOOTER */}
        <div className="border-t border-border/30 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}