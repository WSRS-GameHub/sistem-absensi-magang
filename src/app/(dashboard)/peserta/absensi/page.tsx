import {
  MapPin,
  Navigation,
  Ruler,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { OFFICE_LOCATION } from "@/lib/location/office";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { pesertaNavigation } from "@/constants/navigation";
import { AbsensiClient } from "@/components/peserta/absensi-client";
import { OfficeMapWrapper } from "@/components/maps/office-map-wrapper";

// ---- Types & helpers tidak berubah -------------------------

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
  if (checkOutAt) return { bg: "#e6f4ea", color: "#1e7e34", border: "#a8d5b5" };
  if (checkInAt) return { bg: "#fff8e1", color: "#b45309", border: "#fcd34d" };
  if (status === "pending") return { bg: "#fff1f0", color: "#c0392b", border: "#fca5a5" };
  return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
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
  return ["01","02","03","04","05","06","07","08","09","10","11","12"].map(
    (month) => ({
      value: month,
      label: new Date(`${year}-${month}-01`).toLocaleDateString("id-ID", {
        month: "long",
      }),
    })
  );
}

// ---- Page (logika identik, tampilan disesuaikan ke style dashboard) ----

export default async function PesertaAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
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
      <div className="space-y-5">

        {/* ── HERO BANNER ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
          style={{
            background: "#0072CE",
            boxShadow: "0 4px 20px rgba(0,114,206,0.35)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full"
            style={{ background: "rgba(255,230,0,0.10)" }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span
                className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                style={{ background: "#FFE600", color: "#003B8E" }}
              >
                Absensi Peserta
              </span>
              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                Datang dan pulang menggunakan lokasi GPS kantor.
              </p>
            </div>

            <div
              className="shrink-0 self-start rounded-xl px-4 py-3 text-right lg:self-auto"
              style={{
                background: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                Area Absensi
              </p>
              <p className="mt-1 text-base font-bold text-white">
                Radius {OFFICE_LOCATION.radius} m
              </p>
            </div>
          </div>
        </div>

        {/* ── KONTEN UTAMA ── kedua kolom dibuat align tingginya ── */}
        <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">

          <div className="flex h-full flex-col gap-4">
            {/* Peta Kantor — tinggi disamakan proporsinya, tidak terlalu pendek/lebar */}
            <div
              className="flex flex-1 flex-col rounded-2xl bg-white p-5"
              style={{
                border: "1px solid #dde3ed",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <h3 className="text-base font-bold sm:text-lg" style={{ color: "#003B8E" }}>
                Lokasi Kantor
              </h3>
              <p className="mt-0.5 text-sm" style={{ color: "#64748b" }}>
                Pastikan berada di dalam area yang sudah ditentukan.
              </p>

              <div
                className="mt-3 flex-1 overflow-hidden rounded-xl"
                style={{ border: "1px solid #dde3ed", minHeight: "220px" }}
              >
                <div className="relative z-0 h-full min-h-[220px]">
                  <OfficeMapWrapper
                    lat={OFFICE_LOCATION.lat}
                    lng={OFFICE_LOCATION.lng}
                    radius={OFFICE_LOCATION.radius}
                  />
                </div>
              </div>
            </div>

            {/* Stat cards koordinat */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Latitude", value: OFFICE_LOCATION.lat, Icon: MapPin },
                { label: "Longitude", value: OFFICE_LOCATION.lng, Icon: Navigation },
                { label: "Radius", value: `${OFFICE_LOCATION.radius} meter`, Icon: Ruler },
              ].map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dde3ed",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 #ffffff",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "#EBF5FF" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "#0072CE" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium" style={{ color: "#64748b" }}>
                        {label}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold" style={{ color: "#003B8E" }}>
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AbsensiClient — card PUTIH biasa, sama seperti card lain (tidak ada background biru lagi) */}
          <div
            className="flex h-full flex-col rounded-2xl bg-white p-5 sm:p-6"
            style={{
              border: "1px solid #dde3ed",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <AbsensiClient todayAttendance={todayAttendance ?? null} />
          </div>
        </div>

        {/* ── RIWAYAT ABSENSI ── */}
        <div
          className="rounded-2xl bg-white p-5"
          style={{
            border: "1px solid #dde3ed",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-bold sm:text-lg" style={{ color: "#003B8E" }}>
                Riwayat Absensi
              </h3>
              <p className="mt-0.5 text-sm" style={{ color: "#64748b" }}>
                Filter berdasarkan bulan atau tanggal tertentu.
              </p>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" method="get">
              <select
                name="month"
                defaultValue={selectedMonth}
                className="h-9 rounded-lg px-3 text-sm font-medium outline-none transition-colors"
                style={{ border: "1px solid #dde3ed", color: "#003B8E" }}
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
                className="h-9 rounded-lg px-3 text-sm font-medium outline-none transition-colors"
                style={{ border: "1px solid #dde3ed", color: "#003B8E" }}
              />

              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98]"
                style={{
                  background: "#0072CE",
                  boxShadow: "0 2px 8px rgba(0,114,206,0.3)",
                }}
              >
                Filter
              </button>
            </form>
          </div>

          <div
            className="mt-4 overflow-x-auto rounded-xl"
            style={{ border: "1px solid #dde3ed" }}
          >
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr style={{ background: "#EBF5FF" }}>
                  <th
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "#0072CE" }}
                  >
                    Tanggal
                  </th>
                  <th
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "#0072CE" }}
                  >
                    Datang
                  </th>
                  <th
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "#0072CE" }}
                  >
                    Pulang
                  </th>
                  <th
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "#0072CE" }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((item, idx) => {
                    const badge = getStatusBadge(
                      item.status,
                      item.check_in_at,
                      item.check_out_at
                    );
                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:opacity-90"
                        style={{
                          borderTop: "1px solid #eef2f7",
                          background: idx % 2 === 1 ? "#fafbfc" : "#ffffff",
                        }}
                      >
                        <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: "#003B8E" }}>
                          {formatDate(item.tanggal)}
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: "#1e293b" }}>
                          {formatTime(item.check_in_at)}
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: "#1e293b" }}>
                          {formatTime(item.check_out_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                            }}
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
                      className="px-4 py-10 text-center text-sm italic"
                      style={{ color: "#94a3b8" }}
                    >
                      Belum ada riwayat absensi untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
