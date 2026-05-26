import Link from "next/link";
import {
  CalendarCheck2,
  Users,
  CircleCheckBig,
  CircleDashed,
  ArrowUpRight,
} from "lucide-react";

import { getTLScope } from "@/lib/auth/get-tl-scope";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { tlNavigation } from "@/constants/navigation";

type ProfileRow = {
  id: string;
  nama: string;
  username: string;
  division: string | null;
};

type AttendanceRow = {
  id: string;
  user_id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
};

function formatTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (checkOutAt) return "Selesai";
  if (checkInAt) return "Sudah Check-In";
  return "Belum Absen";
}

function getStatusBadge(
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (checkOutAt) return "bg-emerald-500/10 text-emerald-600";
  if (checkInAt) return "bg-blue-500/10 text-blue-600";

  return "bg-amber-500/10 text-amber-600";
}

export default async function TLDashboardPage() {
  const { division } = await getTLScope();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data: participantsData } = await supabase
    .from("profiles")
    .select("id, nama, username, division")
    .eq("role", "peserta")
    .eq("division", division)
    .order("created_at", { ascending: false });

  const participants = (participantsData ?? []) as ProfileRow[];
  const participantIds = participants.map((item) => item.id);

  const { data: attendanceData } =
    participantIds.length > 0
      ? await supabase
          .from("absensi")
          .select("id, user_id, tanggal, check_in_at, check_out_at, status")
          .eq("tanggal", today)
          .in("user_id", participantIds)
      : { data: [] as AttendanceRow[] };

  const attendance = (attendanceData ?? []) as AttendanceRow[];

  const attendanceMap = new Map(
    attendance.map((item) => [item.user_id, item])
  );

  const totalParticipants = participants.length;
  const checkedInCount = attendance.filter((item) => item.check_in_at).length;
  const completedCount = attendance.filter(
    (item) => item.check_out_at
  ).length;

  const notCheckedInCount = totalParticipants - checkedInCount;

  const todayRows = participants.map((participant) => {
    const row = attendanceMap.get(participant.id) ?? null;

    return {
      ...participant,
      attendance: row,
      status: getStatusLabel(
        row?.check_in_at ?? null,
        row?.check_out_at ?? null
      ),
    };
  });

  const latestRows = todayRows.slice(0, 6);

  const notCheckedInRows = todayRows
    .filter((item) => !item.attendance?.check_in_at)
    .slice(0, 5);

  const stats = [
    {
      title: "Total Peserta",
      value: totalParticipants,
      note: `Divisi ${division}`,
      icon: Users,
      tone: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Sudah Check-In",
      value: checkedInCount,
      note: "Hari ini",
      icon: CalendarCheck2,
      tone: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Belum Absen",
      value: notCheckedInCount,
      note: "Perlu dipantau",
      icon: CircleDashed,
      tone: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Selesai Check-Out",
      value: completedCount,
      note: "Absensi lengkap",
      icon: CircleCheckBig,
      tone: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <DashboardLayout navigation={tlNavigation}>
<DashboardPageHeader
  title="Monitoring Divisi"
  description={`Pantau absensi dan aktivitas peserta magang divisi ${division} secara real-time.`}
/>
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {item.title}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight">
                      {item.value}
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.note}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Attendance Table */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  Absensi Hari Ini
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Monitoring peserta divisi {division}.
                </p>
              </div>

              <Link
                href="/tl/absensi"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                Lihat Detail
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-4 font-semibold">Nama</th>
                    <th className="px-4 py-4 font-semibold">Username</th>
                    <th className="px-4 py-4 font-semibold">Check-In</th>
                    <th className="px-4 py-4 font-semibold">Check-Out</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {latestRows.length > 0 ? (
                    latestRows.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border/20 transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-4 font-medium">
                          {item.nama}
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {item.username}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {formatTime(item.attendance?.check_in_at ?? null)}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {formatTime(item.attendance?.check_out_at ?? null)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                              item.attendance?.check_in_at ?? null,
                              item.attendance?.check_out_at ?? null
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Belum ada data absensi hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card */}
            <div className="space-y-3 p-4 md:hidden">
              {latestRows.length > 0 ? (
                latestRows.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.nama}</p>

                        <p className="text-xs text-muted-foreground">
                          {item.username}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getStatusBadge(
                          item.attendance?.check_in_at ?? null,
                          item.attendance?.check_out_at ?? null
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          Check-In
                        </p>

                        <p className="mt-1 font-medium">
                          {formatTime(item.attendance?.check_in_at ?? null)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          Check-Out
                        </p>

                        <p className="mt-1 font-medium">
                          {formatTime(item.attendance?.check_out_at ?? null)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                  Belum ada data absensi.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Belum Check-In */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">
                    Belum Check-In
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Peserta yang belum absensi hari ini.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <CircleDashed className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {notCheckedInRows.length > 0 ? (
                  notCheckedInRows.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.nama}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {item.username}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-600">
                        Pending
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-emerald-500/10 px-4 py-4 text-sm font-medium text-emerald-600">
                    Semua peserta sudah check-in.
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold">Ringkasan</h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Peserta aktif
                  </span>

                  <span className="font-semibold">
                    {totalParticipants}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Hadir hari ini
                  </span>

                  <span className="font-semibold">
                    {checkedInCount}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Belum absen
                  </span>

                  <span className="font-semibold">
                    {notCheckedInCount}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Check-out selesai
                  </span>

                  <span className="font-semibold">
                    {completedCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}