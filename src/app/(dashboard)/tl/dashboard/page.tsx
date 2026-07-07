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

// Timezone acuan untuk seluruh format tanggal/jam di halaman ini.
const TIMEZONE = "Asia/Jakarta";

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

/**
 * Mengambil tanggal hari ini dalam format YYYY-MM-DD
 * berdasarkan timezone Asia/Jakarta (bukan UTC server),
 * supaya tidak salah tanggal saat mendekati tengah malam WIB.
 */
function getTodayJakarta(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
  }).format(now); // format: YYYY-MM-DD
}

function formatTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
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
  if (checkOutAt) return "status-done";
  if (checkInAt) return "status-checkin";
  return "status-pending";
}

export default async function TLDashboardPage() {
  const { division } = await getTLScope();
  const supabase = await createClient();

  const today = getTodayJakarta();

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
      tone: "stat-blue",
    },
    {
      title: "Sudah Check-In",
      value: checkedInCount,
      note: "Hari ini",
      icon: CalendarCheck2,
      tone: "stat-yellow",
    },
    {
      title: "Belum Absen",
      value: notCheckedInCount,
      note: "Perlu dipantau",
      icon: CircleDashed,
      tone: "stat-yellow-soft",
    },
    {
      title: "Selesai Check-Out",
      value: completedCount,
      note: "Absensi lengkap",
      icon: CircleCheckBig,
      tone: "stat-blue-dark",
    },
  ];

  return (
    <DashboardLayout navigation={tlNavigation}>
      <style>{`
        /* ─── Brand tokens ─── */
        :root {
          --brand-yellow: #FFE600;
          --brand-yellow-hover: #F5DB00;
          --brand-yellow-soft: #FFF9C2;
          --brand-yellow-text: #7A6B00;
          --brand-blue: #0072CE;
          --brand-blue-hover: #005FAD;
          --brand-blue-soft: #E0F0FF;
          --brand-blue-text: #004A8C;
          --brand-blue-dark: #003D7A;
          --surface: #FFFFFF;
          --surface-muted: #F5F7FA;
          --border: #DDE3ED;
          --text-primary: #0A1A2F;
          --text-muted: #5A6A80;
        }

        /* ─── Stat cards ─── */
        .stat-blue {
          background: var(--brand-blue-soft);
          color: var(--brand-blue);
        }
        .stat-yellow {
          background: var(--brand-yellow);
          color: var(--brand-yellow-text);
        }
        .stat-yellow-soft {
          background: var(--brand-yellow-soft);
          color: var(--brand-yellow-text);
        }
        .stat-blue-dark {
          background: var(--brand-blue);
          color: #ffffff;
        }

        /* ─── Status badges ─── */
        .status-done {
          background: var(--brand-blue);
          color: #ffffff;
        }
        .status-checkin {
          background: var(--brand-yellow);
          color: var(--brand-yellow-text);
        }
        .status-pending {
          background: var(--brand-yellow-soft);
          color: var(--brand-yellow-text);
        }

        /* ─── Page header blue section ─── */
        .page-header-section {
          background: var(--brand-blue);
          border-radius: 0.875rem;
          padding: 1rem 1.375rem;
          box-shadow: 0 4px 16px rgba(0, 114, 206, 0.3);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .page-header-section::before {
          content: '';
          position: absolute;
          top: -30px; left: 45%;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .page-header-section::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 160px; height: 100%;
          background: linear-gradient(135deg, transparent 30%, rgba(255,230,0,0.08) 100%);
          pointer-events: none;
        }
        .header-pill {
          background: var(--brand-yellow);
          color: var(--brand-blue);
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.3rem 0.75rem;
          border-radius: 9999px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .header-desc {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.9);
          margin: 0;
        }

        /* ─── Stat card root ─── */
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-yellow) 100%);
        }

        /* ─── Card common ─── */
        .panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-bottom: 1px solid var(--border);
          padding: 1.25rem 1.5rem;
        }

        @media (min-width: 640px) {
          .panel-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        /* ─── Detail link button ─── */
        .btn-detail {
          display: inline-flex;
          height: 2.5rem;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 0.625rem;
          border: 2px solid var(--brand-blue);
          background: transparent;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--brand-blue);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .btn-detail:hover {
          background: var(--brand-blue);
          color: #ffffff;
        }

        /* ─── Table ─── */
        .attendance-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }
        .attendance-table thead tr {
          border-bottom: 2px solid var(--brand-blue);
          background: var(--brand-blue);
          text-align: left;
        }
        .attendance-table thead th {
          padding: 0.875rem 1.25rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #ffffff;
        }
        .attendance-table thead th:first-child {
          border-radius: 0;
        }
        .attendance-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background 0.12s;
        }
        .attendance-table tbody tr:hover {
          background: var(--brand-blue-soft);
        }
        .attendance-table tbody tr:last-child {
          border-bottom: none;
        }
        .attendance-table td {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .attendance-table td.muted {
          color: var(--text-muted);
        }

        /* ─── Status pill ─── */
        .status-pill {
          display: inline-flex;
          border-radius: 9999px;
          padding: 0.2rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ─── Mobile cards ─── */
        .mobile-card {
          background: var(--surface-muted);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1rem;
        }
        .mobile-time-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 0.625rem;
          padding: 0.75rem;
        }

        /* ─── Sidebar items ─── */
        .sidebar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-muted);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
        }

        .pending-pill {
          background: var(--brand-yellow);
          color: var(--brand-yellow-text);
          border-radius: 9999px;
          padding: 0.2rem 0.625rem;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .all-done-box {
          background: var(--brand-blue);
          border-radius: 0.75rem;
          padding: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          text-align: center;
        }

        /* ─── Summary values ─── */
        .summary-value {
          font-weight: 700;
          color: var(--brand-blue);
        }

        /* ─── Section titles ─── */
        .section-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .section-sub {
          margin-top: 0.25rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        /* ─── Stat icon wrapper ─── */
        .stat-icon {
          display: flex;
          height: 2.75rem;
          width: 2.75rem;
          align-items: center;
          justify-content: center;
          border-radius: 0.75rem;
          flex-shrink: 0;
        }

        /* ─── Empty state ─── */
        .empty-state {
          padding: 2.5rem 1rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
      `}</style>

      <div className="space-y-5">
        {/* Page Header - blue PLN section with yellow pill */}
        <div className="page-header-section">
          <span className="header-pill">Monitoring Divisi</span>
          <p className="header-desc">
            Pantau absensi dan aktivitas peserta magang divisi {division} .
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="stat-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {item.title}
                    </p>
                    <h2
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "2rem",
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.value}
                    </h2>
                    <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {item.note}
                    </p>
                  </div>
                  <div className={`stat-icon ${item.tone}`}>
                    <Icon style={{ width: "1.25rem", height: "1.25rem" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Attendance Table */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3 className="section-title">Absensi Hari Ini</h3>
                <p className="section-sub">Monitoring peserta divisi {division}.</p>
              </div>
              <Link href="/tl/absensi" className="btn-detail">
                Lihat Detail
                <ArrowUpRight style={{ width: "1rem", height: "1rem" }} />
              </Link>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Username</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {latestRows.length > 0 ? (
                    latestRows.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.nama}</td>
                        <td className="muted">{item.username}</td>
                        <td>{formatTime(item.attendance?.check_in_at ?? null)}</td>
                        <td>{formatTime(item.attendance?.check_out_at ?? null)}</td>
                        <td>
                          <span
                            className={`status-pill ${getStatusBadge(
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
                      <td colSpan={5} className="empty-state">
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
                  <div key={item.id} className="mobile-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.nama}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {item.username}
                        </p>
                      </div>
                      <span
                        className={`status-pill ${getStatusBadge(
                          item.attendance?.check_in_at ?? null,
                          item.attendance?.check_out_at ?? null
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="mobile-time-box">
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Check-In</p>
                        <p style={{ marginTop: "0.25rem", fontWeight: 600, fontSize: "0.875rem" }}>
                          {formatTime(item.attendance?.check_in_at ?? null)}
                        </p>
                      </div>
                      <div className="mobile-time-box">
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Check-Out</p>
                        <p style={{ marginTop: "0.25rem", fontWeight: 600, fontSize: "0.875rem" }}>
                          {formatTime(item.attendance?.check_out_at ?? null)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    border: "1.5px dashed var(--border)",
                    borderRadius: "1rem",
                  }}
                  className="empty-state"
                >
                  Belum ada data absensi.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Belum Check-In */}
            <div className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="section-title">Belum Check-In</h3>
                  <p className="section-sub">Peserta yang belum absensi hari ini.</p>
                </div>
                <div
                  className="stat-icon"
                  style={{ background: "var(--brand-yellow)", color: "var(--brand-yellow-text)" }}
                >
                  <CircleDashed style={{ width: "1.25rem", height: "1.25rem" }} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {notCheckedInRows.length > 0 ? (
                  notCheckedInRows.map((item) => (
                    <div key={item.id} className="sidebar-row">
                      <div className="min-w-0">
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.nama}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {item.username}
                        </p>
                      </div>
                      <span className="pending-pill">Pending</span>
                    </div>
                  ))
                ) : (
                  <div className="all-done-box">Semua peserta sudah check-in.</div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="panel p-5">
              {/* Blue top bar accent */}
              <div
                style={{
                  marginBottom: "1rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "2px solid var(--brand-yellow)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "0.875rem",
                    height: "0.875rem",
                    borderRadius: "50%",
                    background: "var(--brand-blue)",
                    flexShrink: 0,
                  }}
                />
                <h3 className="section-title">Ringkasan</h3>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Peserta aktif", value: totalParticipants },
                  { label: "Hadir hari ini", value: checkedInCount },
                  { label: "Belum absen", value: notCheckedInCount },
                  { label: "Check-out selesai", value: completedCount },
                ].map((row) => (
                  <div key={row.label} className="sidebar-row">
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {row.label}
                    </span>
                    <span className="summary-value" style={{ fontSize: "0.875rem" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
