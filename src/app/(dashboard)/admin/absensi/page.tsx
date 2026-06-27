import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { adminNavigation } from "@/constants/navigation";

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
  if (!value) return null;
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

type StatusKey = "selesai" | "checkin" | "belum" | "default";

function getStatusKey(
  status: string,
  checkInAt: string | null,
  checkOutAt: string | null
): StatusKey {
  if (checkOutAt) return "selesai";
  if (checkInAt) return "checkin";
  if (status === "pending") return "belum";
  return "default";
}

const statusStyles: Record<StatusKey, { pill: string; dot: string }> = {
  selesai: {
    pill: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  checkin: {
    pill: "bg-blue-50 text-blue-800 border border-blue-200",
    dot: "bg-blue-600",
  },
  belum: {
    pill: "bg-amber-50 text-amber-800 border border-amber-200",
    dot: "bg-amber-500",
  },
  default: {
    pill: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
  },
};

type DivisionKey = "PA" | "TE" | "TEKNIK" | "default";

const divisionStyles: Record<DivisionKey, { pill: string; dot: string; avatar: string }> = {
  PA: {
    pill: "bg-blue-50 text-blue-800 border border-blue-200",
    dot: "bg-blue-600",
    avatar: "bg-blue-50 border-blue-200 text-blue-700",
  },
  TE: {
    pill: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
    avatar: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  TEKNIK: {
    pill: "bg-violet-50 text-violet-800 border border-violet-200",
    dot: "bg-violet-500",
    avatar: "bg-violet-50 border-violet-200 text-violet-700",
  },
  default: {
    pill: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
    avatar: "bg-blue-50 border-blue-200 text-blue-700",
  },
};

function getDivisionStyle(division: string | null) {
  return divisionStyles[(division as DivisionKey) ?? "default"] ?? divisionStyles.default;
}

function getInitials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getMonthOptions() {
  const year = new Date().getFullYear();
  return ["01","02","03","04","05","06","07","08","09","10","11","12"].map((month) => ({
    value: month,
    label: new Date(`${year}-${month}-01`).toLocaleDateString("id-ID", { month: "long" }),
  }));
}

export default async function AdminAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string; division?: string }>;
}) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const params = await searchParams;

  const selectedMonth = params?.month?.trim() || new Date().toISOString().slice(5, 7);
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
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const rows = attendanceRows
    .map((row) => ({ ...row, profile: profileMap.get(row.user_id) ?? null }))
    .filter((row) => {
      if (!selectedDivision) return true;
      return row.profile?.division === selectedDivision;
    });

  const monthOptions = getMonthOptions();

  // Stats
  const totalAbsensi = rows.length;
  const selesai = rows.filter((r) => r.check_out_at).length;
  const sudahCheckIn = rows.filter((r) => r.check_in_at && !r.check_out_at).length;
  const belumAbsen = rows.filter((r) => !r.check_in_at).length;

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4">

        {/* ── HERO ── */}
        <section
          className="flex items-center justify-between rounded-[20px] px-5 py-4"
          style={{ background: "#0072CE" }}
        >
          <div>
            <span
              className="mb-2 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "#FFE600", color: "#5C4A00" }}
            >
              Data Absensi
            </span>
            <h1 className="text-lg font-bold text-white">Monitoring Absensi</h1>
            <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
              Pantau kehadiran peserta magang secara keseluruhan.
            </p>
          </div>
          <div
            className="flex items-center justify-center rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            {/* Calendar icon */}
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#FFE600" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </section>

        {/* ── FILTER ── */}
        <section className="rounded-[20px] border bg-white px-5 py-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#0072CE" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <h3 className="text-sm font-bold" style={{ color: "#0F1D2A" }}>Filter Absensi</h3>
          </div>
          <form className="flex flex-wrap gap-2" method="get">
            <select
              name="month"
              defaultValue={selectedMonth}
              className="h-9 rounded-[10px] border px-3 text-xs outline-none focus:border-blue-400"
              style={{ borderColor: "#CCE4F7", background: "#F7FAFD", color: "#0F1D2A", minWidth: 130 }}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="h-9 rounded-[10px] border px-3 text-xs outline-none focus:border-blue-400"
              style={{ borderColor: "#CCE4F7", background: "#F7FAFD", color: "#0F1D2A", minWidth: 130 }}
            />

            <select
              name="division"
              defaultValue={selectedDivision}
              className="h-9 rounded-[10px] border px-3 text-xs outline-none focus:border-blue-400"
              style={{ borderColor: "#CCE4F7", background: "#F7FAFD", color: "#0F1D2A", minWidth: 130 }}
            >
              <option value="">Semua Divisi</option>
              <option value="PA">PA</option>
              <option value="TE">TE</option>
              <option value="TEKNIK">TEKNIK</option>
            </select>

            <button
              type="submit"
              className="h-9 rounded-[10px] px-4 text-xs font-bold text-white"
              style={{ background: "#0072CE" }}
            >
              Terapkan Filter
            </button>

            <a
              href="/admin/absensi"
              className="inline-flex h-9 items-center rounded-[10px] border px-3.5 text-xs font-semibold"
              style={{ borderColor: "#CCE4F7", background: "#E6F3FF", color: "#0072CE" }}
            >
              Reset
            </a>
          </form>
        </section>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {/* Total */}
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#0072CE" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>
              Total Absensi
            </p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{totalAbsensi}</span>
          </div>
          {/* Selesai */}
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#10B981" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>
              Selesai
            </p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{selesai}</span>
          </div>
          {/* Sudah Check-In */}
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#F59E0B" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>
              Sudah Check-In
            </p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{sudahCheckIn}</span>
          </div>
          {/* Belum Absen */}
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#EF4444" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>
              Belum Absen
            </p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{belumAbsen}</span>
          </div>
        </div>

        {/* ── TABLE ── */}
        <section className="overflow-hidden rounded-[20px] bg-white shadow-sm">
          {/* Toolbar */}
          <div
            className="flex items-center justify-between border-b px-5 py-3.5"
            style={{ borderColor: "#EBF4FF" }}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="#0072CE" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-sm font-bold" style={{ color: "#0F1D2A" }}>Data Absensi Peserta</h3>
            </div>
            <span
              className="rounded-full px-3 py-0.5 text-[11px] font-bold"
              style={{ background: "#E6F3FF", color: "#0072CE" }}
            >
              {rows.length} data
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr style={{ background: "#EEF6FF" }}>
                  {["Peserta", "Divisi", "Tanggal", "Check-In", "Check-Out", "Status"].map((h) => (
                    <th
                      key={h}
                      className="border-b px-3.5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest"
                      style={{ borderColor: "#CCE4F7", color: "#7A94A8" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((item) => {
                    const profile = item.profile;
                    const divStyle = getDivisionStyle(profile?.division ?? null);
                    const statusKey = getStatusKey(item.status, item.check_in_at, item.check_out_at);
                    const stStyle = statusStyles[statusKey];
                    const checkIn = formatTime(item.check_in_at);
                    const checkOut = formatTime(item.check_out_at);

                    return (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-[#F4F9FF]"
                        style={{ borderColor: "#EEF6FF" }}
                      >
                        {/* Peserta */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-extrabold uppercase ${divStyle.avatar}`}
                            >
                              {profile ? getInitials(profile.nama) : "?"}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold" style={{ color: "#0F1D2A" }}>
                                {profile?.nama ?? "-"}
                              </div>
                              <div className="text-[11px]" style={{ color: "#7A94A8" }}>
                                @{profile?.username ?? "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Divisi */}
                        <td className="px-3.5 py-2.5">
                          {profile?.division ? (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${divStyle.pill}`}>
                              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${divStyle.dot}`} />
                              {profile.division}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>

                        {/* Tanggal */}
                        <td className="px-3.5 py-2.5">
                          <span className="text-[12.5px] font-semibold" style={{ color: "#1A2E40" }}>
                            {formatDate(item.tanggal)}
                          </span>
                        </td>

                        {/* Check-In */}
                        <td className="px-3.5 py-2.5">
                          {checkIn ? (
                            <span className="text-[12.5px] font-semibold" style={{ color: "#1A2E40" }}>{checkIn}</span>
                          ) : (
                            <span className="text-xs" style={{ color: "#7A94A8" }}>–</span>
                          )}
                        </td>

                        {/* Check-Out */}
                        <td className="px-3.5 py-2.5">
                          {checkOut ? (
                            <span className="text-[12.5px] font-semibold" style={{ color: "#1A2E40" }}>{checkOut}</span>
                          ) : (
                            <span className="text-xs" style={{ color: "#7A94A8" }}>–</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3.5 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${stStyle.pill}`}>
                            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${stStyle.dot}`} />
                            {getStatusLabel(item.status, item.check_in_at, item.check_out_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-sm"
                      style={{ color: "#7A94A8" }}
                    >
                      Belum ada data absensi untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {rows.length > 0 && (
            <div
              className="border-t px-5 py-2.5"
              style={{ borderColor: "#EEF6FF" }}
            >
              <span className="text-[11px] font-medium" style={{ color: "#7A94A8" }}>
                Menampilkan {rows.length} data absensi
              </span>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
