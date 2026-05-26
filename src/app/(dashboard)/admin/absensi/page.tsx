import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { adminNavigation } from "@/constants/navigation";
import { DivisionBadge } from "@/components/common/division-badge";

type AttendanceRow = {
  id: string;
  user_id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
};

type ProfileRow = {
  id: string;
  nama: string;
  username: string;
  division: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
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

function getStatusLabel(
  status: string,
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (checkOutAt) return "Selesai";
  if (checkInAt) return "Sudah Check-In";
  if (status === "pending") return "Belum Absen";
  return status;
}

function getStatusBadgeClass(
  status: string,
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (checkOutAt) return "bg-emerald-500/10 text-emerald-600";
  if (checkInAt) return "bg-blue-500/10 text-blue-600";
  if (status === "pending") return "bg-amber-500/10 text-amber-600";
  return "bg-muted text-muted-foreground";
}

function getMonthOptions() {
  const year = new Date().getFullYear();

  return [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ].map((month) => ({
    value: month,
    label: new Date(`${year}-${month}-01`).toLocaleDateString("id-ID", {
      month: "long",
    }),
  }));
}

export default async function AdminAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    date?: string;
    division?: string;
  }>;
}) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const params = await searchParams;

  const selectedMonth =
    params?.month?.trim() || new Date().toISOString().slice(5, 7);
  const selectedDate = params?.date?.trim() || "";
  const selectedDivision = params?.division?.trim() || "";

  const year = new Date().getFullYear();

  let query = supabase
    .from("absensi")
    .select("id, user_id, tanggal, check_in_at, check_out_at, status")
    .order("tanggal", { ascending: false })
    .limit(200);

  if (selectedDate) {
    query = query.eq("tanggal", selectedDate);
  } else if (selectedMonth) {
    query = query
      .gte("tanggal", `${year}-${selectedMonth}-01`)
      .lt(
        "tanggal",
        `${year}-${selectedMonth === "12" ? "01" : String(Number(selectedMonth) + 1).padStart(2, "0")}-01`
      );
  }

  const { data: attendanceData } = await query;
  const attendanceRows = (attendanceData ?? []) as AttendanceRow[];

  const userIds = [...new Set(attendanceRows.map((row) => row.user_id))];

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, nama, username, division")
    .in("id", userIds);

  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const rows = attendanceRows
    .map((row) => ({
      ...row,
      profile: profileMap.get(row.user_id) ?? null,
    }))
    .filter((row) => {
      if (!selectedDivision) return true;
      return row.profile?.division === selectedDivision;
    });

  const monthOptions = getMonthOptions();

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Data Absensi
            </div>

            <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
              Monitoring absensi peserta secara keseluruhan.
            </p>
          </div>
        </section>

        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-semibold sm:text-lg">
                Filter Absensi
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter berdasarkan bulan, tanggal, dan divisi.
              </p>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" method="get">
              <select
                name="month"
                defaultValue={selectedMonth}
                className="h-10 rounded-2xl border border-border/60 bg-background px-3.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="date"
                defaultValue={selectedDate}
                className="h-10 rounded-2xl border border-border/60 bg-background px-3.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              />

              <select
                name="division"
                defaultValue={selectedDivision}
                className="h-10 rounded-2xl border border-border/60 bg-background px-3.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Semua Divisi</option>
                <option value="PA">PA</option>
                <option value="TE">TE</option>
                <option value="TEKNIK">TEKNIK</option>
              </select>

              <button
                type="submit"
                className="h-10 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95"
              >
                Filter
              </button>
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border bg-card shadow-sm">
          <div className="border-b border-border/40 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                  Data Absensi Peserta
                </h3>
              </div>

              <p className="text-xs text-muted-foreground">
                Total {rows.length} data
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold sm:px-5">Nama</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Divisi</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Check-In</th>
                  <th className="px-4 py-3 font-semibold">Check-Out</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/20">
                {rows.length > 0 ? (
                  rows.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/[0.03]"
                      }`}
                    >
                      <td className="px-4 py-3.5 align-top sm:px-5">
                        <div className="text-sm font-semibold tracking-tight">
                          {item.profile?.nama ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                        {item.profile?.username ?? "-"}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <DivisionBadge division={item.profile?.division ?? null} />
                      </td>

                      <td className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                        {formatDate(item.tanggal)}
                      </td>

                      <td className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                        {formatTime(item.check_in_at)}
                      </td>

                      <td className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                        {formatTime(item.check_out_at)}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getStatusBadgeClass(
                            item.status,
                            item.check_in_at,
                            item.check_out_at
                          )}`}
                        >
                          {getStatusLabel(
                            item.status,
                            item.check_in_at,
                            item.check_out_at
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Belum ada data absensi untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}