import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { OFFICE_LOCATION } from "@/lib/location/office";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { pesertaNavigation } from "@/constants/navigation";
import { AbsensiClient } from "@/components/peserta/absensi-client";
import { OfficeMapWrapper } from "@/components/maps/office-map-wrapper";

type AttendanceRow = {
  id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
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

function getStatusBadge(
  status: string,
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (checkOutAt) return "bg-emerald-500/10 text-emerald-600";
  if (checkInAt) return "bg-blue-500/10 text-blue-600";
  if (status === "pending") return "bg-amber-500/10 text-amber-600";
  return "bg-muted text-muted-foreground";
}

function getStatusLabel(
  status: string,
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (checkOutAt) return "Pulang";
  if (checkInAt) return "Sudah Datang";
  if (status === "pending") return "Belum Absen";
  return status;
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

export default async function PesertaAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    date?: string;
  }>;
}) {
  const params = await searchParams;

  const user = await requireRole(["peserta"]);
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const selectedMonth =
    params?.month?.trim() || new Date().toISOString().slice(5, 7);

  const selectedDate = params?.date?.trim() || "";

  const { data: todayAttendance } = await supabase
    .from("absensi")
    .select("check_in_at, check_out_at")
    .eq("user_id", user.id)
    .eq("tanggal", today)
    .maybeSingle();

  let historyQuery = supabase
    .from("absensi")
    .select("id, tanggal, check_in_at, check_out_at, status")
    .eq("user_id", user.id);

  if (selectedDate) {
    historyQuery = historyQuery.eq("tanggal", selectedDate);
  } else if (selectedMonth) {
    historyQuery = historyQuery
      .gte("tanggal", `${new Date().getFullYear()}-${selectedMonth}-01`)
      .lt(
        "tanggal",
        `${new Date().getFullYear()}-${
          selectedMonth === "12"
            ? "01"
            : String(Number(selectedMonth) + 1).padStart(2, "0")
        }-01`
      );
  }

  const { data: attendanceHistory } = await historyQuery.order("tanggal", {
    ascending: false,
  });

  const history = (attendanceHistory ?? []) as AttendanceRow[];
  const monthOptions = getMonthOptions();

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Absensi Peserta
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Datang dan pulang menggunakan lokasi GPS kantor.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Radius {OFFICE_LOCATION.radius}m
            </span>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold sm:text-lg">
                    Lokasi Kantor
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pastikan berada di dalam area yang sudah ditentukan.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border">
                <div className="relative z-0 h-[240px] sm:h-[300px]">
                  <OfficeMapWrapper
                    lat={OFFICE_LOCATION.lat}
                    lng={OFFICE_LOCATION.lng}
                    radius={OFFICE_LOCATION.radius}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Latitude
                </p>
                <p className="mt-2 break-all text-sm font-semibold">
                  {OFFICE_LOCATION.lat}
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Longitude
                </p>
                <p className="mt-2 break-all text-sm font-semibold">
                  {OFFICE_LOCATION.lng}
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Radius
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {OFFICE_LOCATION.radius} meter
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <AbsensiClient todayAttendance={todayAttendance ?? null} />
            </section>

            <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <h3 className="text-base font-semibold sm:text-lg">Panduan</h3>

              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted-foreground">
                <li>Pastikan GPS aktif sebelum menekan tombol absensi.</li>
                <li>Izinkan akses lokasi pada browser.</li>
                <li>Berada di area kantor agar absensi diterima.</li>
                <li>Check-out hanya bisa dilakukan setelah check-in.</li>
              </ul>
            </section>
          </div>
        </div>

        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-semibold sm:text-lg">
                Riwayat Absensi
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter berdasarkan bulan atau tanggal tertentu.
              </p>
            </div>

            <form
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
              method="get"
            >
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

              <button
                type="submit"
                className="h-10 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-border/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4 font-semibold">Tanggal</th>
                  <th className="pb-3 pr-4 font-semibold">Datang</th>
                  <th className="pb-3 pr-4 font-semibold">Pulang</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {history.length > 0 ? (
                  history.map((item) => {
                    const badge = getStatusBadge(
                      item.status,
                      item.check_in_at,
                      item.check_out_at
                    );

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/20 last:border-b-0"
                      >
                        <td className="py-3.5 pr-4 text-sm font-medium">
                          {formatDate(item.tanggal)}
                        </td>

                        <td className="py-3.5 pr-4 text-sm">
                          {formatTime(item.check_in_at)}
                        </td>

                        <td className="py-3.5 pr-4 text-sm">
                          {formatTime(item.check_out_at)}
                        </td>

                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badge}`}
                          >
                            {getStatusLabel(
                              item.status,
                              item.check_in_at,
                              item.check_out_at
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Belum ada riwayat absensi untuk filter ini.
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