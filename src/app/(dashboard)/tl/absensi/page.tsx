import {
  CalendarCheck2,
  Clock3,
  Filter,
  Users,
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

      <div className="space-y-5">
        {/* Header Card */}
        <div
          className="overflow-hidden rounded-2xl shadow-sm"
          style={{ background: "#0072CE" }}
        >
          <div className="relative flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Decorative circles */}
            <div
              className="pointer-events-none absolute right-[-60px] top-[-80px] h-64 w-64 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <div
              className="pointer-events-none absolute bottom-[-60px] right-[160px] h-36 w-36 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />

            {/* Left: Info */}
            <div className="relative max-w-lg">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "#FFE600",
                  color: "#003B7A",
                }}
              >
                <CalendarCheck2 className="h-3.5 w-3.5" />
                Monitoring Divisi {division}
              </div>

              <h2 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Riwayat Kehadiran Peserta
              </h2>

              <p className="mt-2 text-sm leading-6" style={{ color: "rgba(255,255,255,0.75)" }}>
                Pantau absensi dan aktivitas check-in &amp; check-out peserta
                magang divisi {division} secara real-time.
              </p>
            </div>

            {/* Right: Filter */}
            <form
              className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              method="get"
            >
              <div className="relative">
                <select
                  name="month"
                  defaultValue={selectedMonth}
                  className="h-10 w-full rounded-xl px-4 pr-10 text-sm outline-none transition-all sm:w-[150px]"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    color: "#ffffff",
                  }}
                >
                  {Array.from({ length: 12 }).map((_, index) => {
                    const month = String(index + 1).padStart(2, "0");
                    return (
                      <option key={month} value={month} style={{ color: "#111", background: "#fff" }}>
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
                className="h-10 rounded-xl px-4 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1.5px solid rgba(255,255,255,0.35)",
                  color: "#ffffff",
                }}
              />

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all hover:opacity-90"
                style={{
                  background: "#FFE600",
                  color: "#003B7A",
                }}
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
                <tr
                  className="text-left text-xs uppercase tracking-wider"
                  style={{
                    borderBottom: "1px solid rgba(0,114,206,0.15)",
                    background: "rgba(0,114,206,0.05)",
                  }}
                >
                  <th className="px-5 py-4 font-semibold" style={{ color: "#0072CE" }}>Nama</th>
                  <th className="px-4 py-4 font-semibold" style={{ color: "#0072CE" }}>Username</th>
                  <th className="px-4 py-4 font-semibold" style={{ color: "#0072CE" }}>Tanggal</th>
                  <th className="px-4 py-4 font-semibold" style={{ color: "#0072CE" }}>Check-In</th>
                  <th className="px-4 py-4 font-semibold" style={{ color: "#0072CE" }}>Check-Out</th>
                  <th className="px-4 py-4 font-semibold" style={{ color: "#0072CE" }}>Status</th>
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
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ background: "#0072CE" }}
                            >
                              {profile?.nama?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <p className="font-medium">{profile?.nama ?? "-"}</p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {profile?.username ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {formatDate(attendance.tanggal)}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" style={{ color: "#0072CE" }} />
                            {formatTime(attendance.check_in_at)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatTime(attendance.check_out_at)}
                          </span>
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
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full"
                          style={{ background: "rgba(0,114,206,0.08)" }}
                        >
                          <Users className="h-5 w-5" style={{ color: "#0072CE" }} />
                        </div>
                        <p>Belum ada data absensi.</p>
                      </div>
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
                  className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                >
                  {/* Card top accent bar */}
                  <div className="h-1 w-full" style={{ background: "#0072CE" }} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: "#0072CE" }}
                        >
                          {profile?.nama?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {profile?.nama ?? "-"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {profile?.username ?? "-"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Tanggal</p>
                        <p className="mt-1 text-sm font-medium">
                          {formatDate(attendance.tanggal)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Divisi</p>
                        <p
                          className="mt-1 text-sm font-bold"
                          style={{ color: "#0072CE" }}
                        >
                          {profile?.division ?? "-"}
                        </p>
                      </div>

                      <div className="rounded-xl p-3" style={{ background: "rgba(0,114,206,0.06)" }}>
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4" style={{ color: "#0072CE" }} />
                          <p className="text-xs text-muted-foreground">Check-In</p>
                        </div>
                        <p className="mt-1 text-sm font-medium">
                          {formatTime(attendance.check_in_at)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-muted/30 p-3">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Check-Out</p>
                        </div>
                        <p className="mt-1 text-sm font-medium">
                          {formatTime(attendance.check_out_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed bg-card py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "rgba(0,114,206,0.08)" }}
                >
                  <Users className="h-5 w-5" style={{ color: "#0072CE" }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Belum ada data absensi.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
