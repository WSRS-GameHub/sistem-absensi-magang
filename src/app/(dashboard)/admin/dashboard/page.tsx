import Link from "next/link";
import { type ComponentType } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarCheck2,
  ClipboardList,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { adminNavigation } from "@/constants/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createAdminClient } from "@/lib/supabase/admin";

type StatCardProps = {
  title: string;
  value: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  href: string;
};

function StatCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
  href,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="rounded-[20px] border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{value}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>

        <div className={`rounded-2xl p-2.5 ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    totalPesertaRes,
    absensiHariIniRes,
    tugasRes,
    pengumumanRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "peserta"),

    supabase
      .from("absensi")
      .select("id", { count: "exact", head: true })
      .eq("tanggal", today),

    supabase
      .from("tugas")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("pengumuman")
      .select("id", { count: "exact", head: true }),
  ]);

  const totalPeserta = totalPesertaRes.count ?? 0;
  const absensiHariIni = absensiHariIniRes.count ?? 0;
  const totalTugas = tugasRes.count ?? 0;
  const totalPengumuman = pengumumanRes.count ?? 0;

  const stats: StatCardProps[] = [
    {
      title: "Total Peserta",
      value: String(totalPeserta),
      note: "Data peserta aktif",
      icon: Users,
      tone: "bg-blue-500/10 text-blue-600",
      href: "/admin/users",
    },
    {
      title: "Absensi Hari Ini",
      value: String(absensiHariIni),
      note: "Rekap check-in",
      icon: CalendarCheck2,
      tone: "bg-emerald-500/10 text-emerald-600",
      href: "/admin/absensi",
    },
    {
      title: "Tugas",
      value: String(totalTugas),
      note: "Tugas yang terdata",
      icon: ClipboardList,
      tone: "bg-violet-500/10 text-violet-600",
      href: "/admin/tugas",
    },
    {
      title: "Pengumuman",
      value: String(totalPengumuman),
      note: "Informasi sistem",
      icon: BellRing,
      tone: "bg-amber-500/10 text-amber-600",
      href: "/admin/pengumuman",
    },
  ];

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Dashboard Admin
            </div>

            <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
              Ringkasan singkat untuk monitoring sistem.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Ringkas
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-tight sm:text-lg">
                  Akses Cepat
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Langsung buka halaman yang sering dipakai.
                </p>
              </div>

              <div className="rounded-2xl border bg-background p-2.5 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/users"
                className="inline-flex h-10 items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                <span>Kelola Users</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/admin/tugas"
                className="inline-flex h-10 items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                <span>Kelola Tugas</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/admin/absensi"
                className="inline-flex h-10 items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                <span>Lihat Absensi</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/admin/pengumuman"
                className="inline-flex h-10 items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                <span>Pengumuman</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold sm:text-lg">Status Sistem</h3>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3.5">
                <span className="text-sm text-muted-foreground">Auth</span>
                <span className="text-sm font-medium text-emerald-600">
                  Normal
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3.5">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-emerald-600">
                  Normal
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3.5">
                <span className="text-sm text-muted-foreground">Storage</span>
                <span className="text-sm font-medium text-amber-600">
                  Siap dipakai
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}