import {
  CalendarCheck2,
  Clock3,
  Filter,
} from "lucide-react";

import { getTLScope } from "@/lib/auth/get-tl-scope";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { tlNavigation } from "@/constants/navigation";

type AttendanceRow = {
  id: string;
  user_id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nama: string;
  username: string;
  division: "PA" | "TE" | "TEKNIK" | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(checkIn: string | null, checkOut: string | null) {
  if (checkIn && checkOut) {
    return {
      label: "Selesai",
      className: "bg-emerald-500/10 text-emerald-600",
    };
  }

  if (checkIn) {
    return {
      label: "Sedang Magang",
      className: "bg-blue-500/10 text-blue-600",
    };
  }

  return {
    label: "Belum Absen",
    className: "bg-amber-500/10 text-amber-600",
  };
}

export default async function TLAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    date?: string;
  }>;
}) {
  const params = await searchParams;

  const { division } = await getTLScope();
  const supabase = await createClient();

  const now = new Date();

  const selectedMonth =
    params?.month?.trim() ||
    String(now.getMonth() + 1).padStart(2, "0");

  const selectedDate = params?.date?.trim() || "";

  const monthIndex = Number(selectedMonth) - 1;

  const monthStart = new Date(now.getFullYear(), monthIndex, 1);

  const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0);

  const monthStartString = `${monthStart.getFullYear()}-${String(
    monthStart.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const monthEndString = `${monthEnd.getFullYear()}-${String(
    monthEnd.getMonth() + 1
  ).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, nama, username, division")
    .eq("role", "peserta")
    .eq("division", division)
    .eq("is_active", true)
    .order("nama", { ascending: true });

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profiles = (profilesData ?? []) as ProfileRow[];

  const userIds = profiles.map((item) => item.id);

  let attendanceQuery = supabase
    .from("absensi")
    .select(
      "id, user_id, tanggal, check_in_at, check_out_at, status, created_at"
    )
    .in("user_id", userIds);

  if (selectedDate) {
    attendanceQuery = attendanceQuery.eq("tanggal", selectedDate);
  } else {
    attendanceQuery = attendanceQuery
      .gte("tanggal", monthStartString)
      .lte("tanggal", monthEndString);
  }

  const { data: attendanceData, error: attendanceError } =
    userIds.length > 0
      ? await attendanceQuery.order("tanggal", {
          ascending: false,
        })
      : { data: [] as AttendanceRow[], error: null };

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  const attendances = (attendanceData ?? []) as AttendanceRow[];

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile])
  );

  return (
    <DashboardLayout navigation={tlNavigation}>
      <DashboardPageHeader
        title="Monitoring Absensi"
        description={`Pantau absensi peserta magang divisi ${division} secara real-time.`}
      />

      <div className="space-y-5">
        {/* Header Card */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-5 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                Divisi {division}
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
                Riwayat Kehadiran Peserta
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Monitoring aktivitas check-in dan check-out peserta
                magang berdasarkan tanggal dan periode tertentu.
              </p>
            </div>

            {/* Filter */}
            <form
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              method="get"
            >
              <div className="relative">
                <select
                  name="month"
                  defaultValue={selectedMonth}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-4 pr-10 text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10 sm:w-[150px]"
                >
                  {Array.from({ length: 12 }).map((_, index) => {
                    const month = String(index + 1).padStart(2, "0");

                    return (
                      <option key={month} value={month}>
                        Bulan {month}
                      </option>
                    );
                  })}
                </select>
              </div>

              <input
                type="date"
                name="date"
                defaultValue={selectedDate}
                className="h-11 rounded-xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </form>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4 font-semibold">Nama</th>
                  <th className="px-4 py-4 font-semibold">Username</th>
                  <th className="px-4 py-4 font-semibold">Tanggal</th>
                  <th className="px-4 py-4 font-semibold">Check-In</th>
                  <th className="px-4 py-4 font-semibold">Check-Out</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/20">
                {attendances.length > 0 ? (
                  attendances.map((attendance) => {
                    const profile = profileMap.get(attendance.user_id);

                    const status = getStatus(
                      attendance.check_in_at,
                      attendance.check_out_at
                    );

                    return (
                      <tr
                        key={attendance.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {profile?.nama ?? "-"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {profile?.username ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {formatDate(attendance.tanggal)}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {formatTime(attendance.check_in_at)}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {formatTime(attendance.check_out_at)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-sm text-muted-foreground"
                    >
                      Belum ada data absensi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card */}
        <div className="space-y-4 lg:hidden">
          {attendances.length > 0 ? (
            attendances.map((attendance) => {
              const profile = profileMap.get(attendance.user_id);

              const status = getStatus(
                attendance.check_in_at,
                attendance.check_out_at
              );

              return (
                <div
                  key={attendance.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {profile?.nama ?? "-"}
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        {profile?.username ?? "-"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Tanggal
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(attendance.tanggal)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Divisi
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {profile?.division ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />

                        <p className="text-xs text-muted-foreground">
                          Check-In
                        </p>
                      </div>

                      <p className="mt-1 text-sm font-medium">
                        {formatTime(attendance.check_in_at)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />

                        <p className="text-xs text-muted-foreground">
                          Check-Out
                        </p>
                      </div>

                      <p className="mt-1 text-sm font-medium">
                        {formatTime(attendance.check_out_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed bg-card py-12 text-center text-sm text-muted-foreground">
              Belum ada data absensi.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}