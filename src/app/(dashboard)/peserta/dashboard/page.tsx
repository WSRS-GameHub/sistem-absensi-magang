import Link from "next/link";
import {
  BellRing,
  CalendarCheck2,
  ClipboardList,
  Megaphone,
  ArrowRight,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { pesertaNavigation } from "@/constants/navigation";

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
};

type AttendanceRow = {
  id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  target_type: "all" | "division" | "individual";
  target_division: "PA" | "TE" | "TEKNIK" | null;
};

type TaskUserRow = {
  id: string;
  tugas_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
  created_at: string;
  task?: TaskRow | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAttendanceStatus(checkIn: string | null, checkOut: string | null) {
  if (checkIn && checkOut) return { label: "Selesai", bg: "#e6f4ea", color: "#1e7e34", border: "#a8d5b5" };
  if (checkIn) return { label: "Sudah Check-in", bg: "#fff8e1", color: "#b45309", border: "#fcd34d" };
  return { label: "Belum Absen", bg: "#fff1f0", color: "#c0392b", border: "#fca5a5" };
}

function getTaskStatusStyle(status: TaskUserRow["status"]) {
  if (status === "in_progress") return { bg: "#fff8e1", color: "#b45309", border: "#fcd34d" };
  if (status === "submitted") return { bg: "#f3f0ff", color: "#6d28d9", border: "#c4b5fd" };
  if (status === "selesai") return { bg: "#e6f4ea", color: "#1e7e34", border: "#a8d5b5" };
  return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
}

function getTaskStatusLabel(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "Sedang Dikerjakan";
  if (status === "submitted") return "Sudah Dikirim";
  if (status === "selesai") return "Selesai";
  return "Belum Dimulai";
}

export default async function PesertaDashboardPage() {
  const user = await requireRole(["peserta"]);

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, nama, division")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData ?? null) as ProfileRow | null;
  const today = new Date().toISOString().slice(0, 10);

  const { data: attendanceData } = await supabase
    .from("absensi")
    .select("id, tanggal, check_in_at, check_out_at")
    .eq("user_id", user.id)
    .eq("tanggal", today)
    .maybeSingle();

  const attendance = (attendanceData ?? null) as AttendanceRow | null;

  const { data: taskUsersData } = await supabase
    .from("tugas_user")
    .select("id, tugas_id, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const taskUsers = (taskUsersData ?? []) as TaskUserRow[];
  const taskIds = taskUsers.map((item) => item.tugas_id);

  const { data: tasksData } = taskIds.length
    ? await adminSupabase
        .from("tugas")
        .select("id, title, due_date, target_type, target_division")
        .in("id", taskIds)
    : { data: [] as TaskRow[] };

  const tasks = (tasksData ?? []) as TaskRow[];
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  const rows = taskUsers.map((item) => ({
    ...item,
    task: taskMap.get(item.tugas_id) ?? null,
  }));

  const pendingTasks = rows.filter((item) => item.status === "pending").length;

  const { data: announcementsData } = await adminSupabase
    .from("pengumuman")
    .select("id, title, content, created_at, jenis")
    .eq("jenis", "pengumuman")
    .order("created_at", { ascending: false })
    .limit(3);

  const announcements = (announcementsData ?? []) as AnnouncementRow[];

  const { data: notificationsData } = await adminSupabase
    .from("notifikasi")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const notifications = (notificationsData ?? []) as NotificationRow[];
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  const attendanceStatus = getAttendanceStatus(
    attendance?.check_in_at ?? null,
    attendance?.check_out_at ?? null
  );

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-5">

        {/* ── Welcome Banner ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
          style={{
            background: "#0072CE",
            boxShadow: "0 4px 20px rgba(0,114,206,0.35)",
          }}
        >
          {/* Dekorasi lingkaran kuning samar */}
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
                Selamat Datang
              </span>
              <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                {profile?.nama ?? "Peserta"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                Divisi {profile?.division ?? "-"} · Pantau aktivitas magang kamu di sini.
              </p>
            </div>

            {/* Pill absensi */}
            <div
              className="shrink-0 self-start rounded-xl px-4 py-3 lg:self-auto"
              style={{
                background: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                Status Absensi Hari Ini
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: attendanceStatus.bg,
                    color: attendanceStatus.color,
                    border: `1px solid ${attendanceStatus.border}`,
                  }}
                >
                  {attendanceStatus.label}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {attendance
                    ? `Check-in ${attendance.check_in_at
                        ? new Date(attendance.check_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                        : "-"}`
                    : "Belum absen hari ini"}
                </span>
              </div>
            </div>
          </div>

          {/* ── 4 Stat Cards ── */}
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Absensi Hari Ini", value: attendance ? "Sudah" : "Belum", Icon: CalendarCheck2 },
              { label: "Tugas Pending", value: pendingTasks, Icon: ClipboardList },
              { label: "Pengumuman", value: announcements.length, Icon: Megaphone },
              { label: "Pemberitahuan", value: unreadNotificationsCount, Icon: BellRing },
            ].map(({ label, value, Icon }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08), inset 0 1px 0 #ffffff",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "#EBF5FF" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#0072CE" }} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "#64748b" }}>{label}</p>
                    <p className="mt-0.5 text-base font-bold" style={{ color: "#003B8E" }}>{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">

          {/* Tugas Terbaru */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{
              border: "1px solid #dde3ed",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold sm:text-lg" style={{ color: "#003B8E" }}>
                  Tugas Terbaru
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: "#64748b" }}>
                  Pantau tugas yang sedang berjalan.
                </p>
              </div>
              <Link
                href="/peserta/tugas"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "#0072CE",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(0,114,206,0.3)",
                }}
              >
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {rows.length > 0 ? (
                rows.slice(0, 3).map((item) => {
                  const statusStyle = getTaskStatusStyle(item.status);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-4"
                      style={{
                        background: "#F0F7FF",
                        borderLeft: "3px solid #0072CE",
                        boxShadow: "0 2px 8px rgba(0,114,206,0.08), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                      }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold" style={{ color: "#003B8E" }}>
                              {item.task?.title ?? "Tugas belum dimuat"}
                            </h4>
                            <span
                              className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                border: `1px solid ${statusStyle.border}`,
                              }}
                            >
                              {getTaskStatusLabel(item.status)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs" style={{ color: "#64748b" }}>
                            Deadline: {formatDate(item.task?.due_date ?? null)}
                          </p>
                        </div>
                        <Link
                          href={`/peserta/tugas/${item.tugas_id}`}
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{
                            background: "#FFE600",
                            color: "#003B8E",
                            border: "1px solid #e6d800",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                          }}
                        >
                          Detail
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  className="rounded-xl p-8 text-center text-sm"
                  style={{ border: "1px dashed #cbd5e1", color: "#94a3b8" }}
                >
                  Belum ada tugas untuk kamu.
                </div>
              )}
            </div>
          </div>

          {/* Pengumuman Terbaru */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{
              border: "1px solid #dde3ed",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div>
              <h3 className="text-base font-bold sm:text-lg" style={{ color: "#003B8E" }}>
                Pengumuman Terbaru
              </h3>
              <p className="mt-0.5 text-sm" style={{ color: "#64748b" }}>
                Informasi penting dari admin atau team leader.
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              {announcements.length > 0 ? (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "#FFFBEA",
                      borderLeft: "3px solid #FFE600",
                      boxShadow: "0 2px 8px rgba(255,230,0,0.12), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                    }}
                  >
                    <h4 className="text-sm font-semibold" style={{ color: "#003B8E" }}>
                      {item.title}
                    </h4>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: "#475569" }}>
                      {item.content}
                    </p>
                    <p className="mt-3 text-[11px]" style={{ color: "#94a3b8" }}>
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <div
                  className="rounded-xl p-8 text-center text-sm"
                  style={{ border: "1px dashed #cbd5e1", color: "#94a3b8" }}
                >
                  Belum ada pengumuman.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
