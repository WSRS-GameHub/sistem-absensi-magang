import Link from "next/link";
import { type ComponentType } from "react";
import {
  ArrowUpRight,
  Activity,
  BellRing,
  CalendarCheck2,
  ClipboardList,
  LayoutGrid,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { adminNavigation } from "@/constants/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createAdminClient } from "@/lib/supabase/admin";

/* ─── Token colours ─────────────────────────────────────────── */
const B = "#0072CE";
const B_DARK = "#005BAA";
const B_LIGHT = "#E6F3FF";
const B_MID = "#CCE4F7";
const Y = "#FFE600";
const Y_DARK = "#CDB800";
const Y_TEXT = "#5C4A00";

/* ─── Stat card ─────────────────────────────────────────────── */
type Accent = "blue" | "green" | "purple" | "yellow";

type StatCardProps = {
  title: string;
  value: string;
  note: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  accent: Accent;
  href: string;
};

const accentMap: Record<
  Accent,
  { bar: string; iconBg: string; iconColor: string }
> = {
  blue:   { bar: B,        iconBg: "#E6F1FB", iconColor: B },
  green:  { bar: "#10B981", iconBg: "#ECFDF5", iconColor: "#059669" },
  purple: { bar: "#8B5CF6", iconBg: "#F3EEFE", iconColor: "#7C3AED" },
  yellow: { bar: Y_DARK,   iconBg: "#FFFBE6", iconColor: "#A16207" },
};

function StatCard({ title, value, note, icon: Icon, accent, href }: StatCardProps) {
  const { bar, iconBg, iconColor } = accentMap[accent];
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[20px] bg-white border border-transparent hover:border-[#CCE4F7] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* left accent bar */}
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-l-[4px]"
        style={{ background: bar }}
      />
      <div className="pl-2">
        <div className="flex items-start justify-between">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#5A6B7A" }}
          >
            {title}
          </p>
          <span
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
            style={{ background: iconBg }}
          >
            <Icon size={16} color={iconColor} />
          </span>
        </div>
        <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#1A1A2E]">
          {value}
        </h2>
        <p className="mt-0.5 text-[11px]" style={{ color: "#8FA0AF" }}>
          {note}
        </p>
      </div>
    </Link>
  );
}

/* ─── Quick link ─────────────────────────────────────────────── */
function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-[10px] border border-[#CCE4F7] bg-[#E6F3FF] px-[14px] py-2 text-[13px] font-medium text-[#1A1A2E] transition-colors hover:bg-[#0072CE] hover:border-[#0072CE] hover:text-white"
    >
      <span>{label}</span>
      <ArrowUpRight
        size={14}
        className="text-[#0072CE] group-hover:text-[#FFE600] transition-colors"
      />
    </Link>
  );
}

/* ─── Status row ─────────────────────────────────────────────── */
function StatusRow({
  label,
  status,
  ok,
}: {
  label: string;
  status: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-[10px] bg-[#F7FAFD] px-4 py-2.5">
      <span className="flex items-center gap-2 text-[13px] text-[#5A6B7A]">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: ok ? "#10B981" : "#D97706" }}
        />
        {label}
      </span>
      <span
        className="text-[13px] font-semibold"
        style={{ color: ok ? "#059669" : "#D97706" }}
      >
        {status}
      </span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [totalPesertaRes, absensiHariIniRes, tugasRes, pengumumanRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "peserta"),
      supabase
        .from("absensi")
        .select("id", { count: "exact", head: true })
        .eq("tanggal", today),
      supabase.from("tugas").select("id", { count: "exact", head: true }),
      supabase
        .from("pengumuman")
        .select("id", { count: "exact", head: true }),
    ]);

  const stats: StatCardProps[] = [
    {
      title: "Total Peserta",
      value: String(totalPesertaRes.count ?? 0),
      note: "Data peserta aktif",
      icon: Users,
      accent: "blue",
      href: "/admin/users",
    },
    {
      title: "Absensi Hari Ini",
      value: String(absensiHariIniRes.count ?? 0),
      note: "Rekap check-in",
      icon: CalendarCheck2,
      accent: "green",
      href: "/admin/absensi",
    },
    {
      title: "Tugas",
      value: String(tugasRes.count ?? 0),
      note: "Tugas yang terdata",
      icon: ClipboardList,
      accent: "purple",
      href: "/admin/tugas",
    },
    {
      title: "Pengumuman",
      value: String(pengumumanRes.count ?? 0),
      note: "Informasi sistem",
      icon: BellRing,
      accent: "yellow",
      href: "/admin/pengumuman",
    },
  ];

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4 p-1">

        {/* ── Hero banner ── */}
        <section
          className="flex items-center justify-between rounded-[20px] p-5"
          style={{ background: B }}
        >
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ background: Y, color: Y_TEXT }}
            >
              Dashboard Admin
            </span>
            <h1 className="mt-2 text-[22px] font-semibold text-white tracking-tight">
              Selamat datang kembali 👋
            </h1>
            <p className="mt-1 text-[13px] text-white/70">
              Pastikan peserta, absensi, tugas, dan pengumuman terkelola dengan baik
            </p>
          </div>
          <div
            className="flex items-center justify-center rounded-[14px] p-3.5"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <LayoutGrid size={28} color={Y} />
          </div>
        </section>

        {/* ── Stat cards ── */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </section>

        {/* ── Bottom row ── */}
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">

          {/* Quick access */}
          <section className="rounded-[20px] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ background: B_LIGHT, color: B }}
                >
                  Akses Cepat
                </span>
                <p className="mt-0.5 text-[12px] text-[#5A6B7A]">
                  Langsung buka halaman yang sering dipakai.
                </p>
              </div>
              <div
                className="flex items-center justify-center rounded-[10px] p-2"
                style={{ background: B_LIGHT }}
              >
                <LayoutGrid size={18} color={B} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <QuickLink href="/admin/users"      label="Kelola Users" />
              <QuickLink href="/admin/tugas"      label="Kelola Tugas" />
              <QuickLink href="/admin/absensi"    label="Lihat Absensi" />
              <QuickLink href="/admin/pengumuman" label="Pengumuman" />
            </div>
          </section>

          {/* System status */}
          <section className="rounded-[20px] bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} color={B} />
              <h3 className="text-[15px] font-semibold text-[#1A1A2E]">
                Status Sistem
              </h3>
            </div>
            <div className="space-y-2">
              <StatusRow label="Auth"     status="Normal"      ok />
              <StatusRow label="Database" status="Normal"      ok />
              <StatusRow label="Storage"  status="Siap dipakai" ok={false} />
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}
