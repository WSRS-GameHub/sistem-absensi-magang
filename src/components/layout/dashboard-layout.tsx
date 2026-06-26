"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

import { useAuth } from "@/components/providers/auth-provider";

type NavigationItem = {
  title: string;
  href: string;
  icon: string;
};

interface DashboardLayoutProps {
  navigation: NavigationItem[];
  children: React.ReactNode;
}

function getActiveTitle(pathname: string, navigation: NavigationItem[]) {
  const exact = navigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return exact?.title ?? "Dashboard";
}

export function DashboardLayout({
  navigation,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  const pageTitle = useMemo(
    () => getActiveTitle(pathname, navigation),
    [pathname, navigation]
  );

  const badgeLabel =
    user?.role === "admin"
      ? "Administrator"
      : user?.role === "manager"
      ? "Manager"
      : user?.division
      ? `Divisi ${user.division}`
      : null;

  return (
    <div className="min-h-[100dvh] bg-[#0A1628] md:flex md:h-screen md:overflow-hidden">
      <DashboardSidebar
        title="SIATAMA"
        navigation={navigation}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={pageTitle}
          name={user?.nama ?? "User"}
          badgeLabel={badgeLabel}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="min-w-0 flex-1 bg-[#0A1628] px-2 pb-4 pt-3 sm:px-3 sm:pb-5 sm:pt-4 md:overflow-y-auto md:px-4 lg:px-5 xl:px-6">
          <div className="mx-auto w-full max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}