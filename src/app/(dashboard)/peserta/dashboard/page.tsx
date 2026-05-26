import Link from "next/link";
import {
  BellRing,
  CalendarCheck2,
  ClipboardList,
  Megaphone,
  TrendingUp,
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
  if (checkIn && checkOut) {
    return {
      label: "Selesai",
      className: "bg-emerald-500/10 text-emerald-600",
    };
  }

  if (checkIn) {
    return {
      label: "Sudah Check-in",
      className: "bg-blue-500/10 text-blue-600",
    };
  }

  return {
    label: "Belum Absen",
    className: "bg-amber-500/10 text-amber-600",
  };
}

function getTaskStatusBadge(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "bg-blue-500/10 text-blue-600";
  if (status === "submitted") return "bg-violet-500/10 text-violet-600";
  if (status === "selesai") return "bg-emerald-500/10 text-emerald-600";
  return "bg-amber-500/10 text-amber-600";
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
  const unreadNotificationsCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  const attendanceStatus = getAttendanceStatus(
    attendance?.check_in_at ?? null,
    attendance?.check_out_at ?? null
  );

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <div className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Selamat Datang
              </div>

              <p className="mt-3 text-sm text-muted-foreground sm:text-[15px]">
                Divisi {profile?.division ?? "-"} • pantau aktivitas magang kamu di sini.
              </p>
            </div>

            <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Status Absensi Hari Ini
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${attendanceStatus.className}`}
                >
                  {attendanceStatus.label}
                </span>

                <span className="text-xs text-muted-foreground">
                  {attendance
                    ? `Check-in ${
                        attendance.check_in_at
                          ? new Date(attendance.check_in_at).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "-"
                      }`
                    : "Belum absen"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-blue-500/5 p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Absensi Hari Ini</p>
                  <p className="mt-1 text-base font-bold tracking-tight">
                    {attendance ? "Ada" : "Belum"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-amber-500/5 p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tugas Pending</p>
                  <p className="mt-1 text-base font-bold tracking-tight">
                    {pendingTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-violet-500/5 p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pengumuman</p>
                  <p className="mt-1 text-base font-bold tracking-tight">
                    {announcements.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-emerald-500/5 p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <BellRing className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pemberitahuan</p>
                  <p className="mt-1 text-base font-bold tracking-tight">
                    {unreadNotificationsCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold sm:text-lg">
                    Tugas Terbaru
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pantau tugas yang sedang berjalan.
                  </p>
                </div>

                <Link
                  href="/peserta/tugas"
                  className="inline-flex h-9 items-center justify-center rounded-2xl border bg-background px-3.5 text-sm font-medium hover:bg-muted sm:px-4"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {rows.length > 0 ? (
                  rows.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-muted/20 p-3.5 transition-colors hover:bg-muted/30 sm:p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold tracking-tight">
                              {item.task?.title ?? "Tugas belum dimuat"}
                            </h4>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getTaskStatusBadge(
                                item.status
                              )}`}
                            >
                              {getTaskStatusLabel(item.status)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">
                            Deadline: {formatDate(item.task?.due_date ?? null)}
                          </p>
                        </div>

                        <Link
                          href={`/peserta/tugas/${item.tugas_id}`}
                          className="inline-flex h-9 items-center justify-center rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
                        >
                          Detail
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Belum ada tugas untuk kamu.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold sm:text-lg">
                    Pengumuman Terbaru
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Informasi penting dari admin atau team leader.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {announcements.length > 0 ? (
                  announcements.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-violet-500/5 p-3.5 sm:p-4"
                    >
                      <h4 className="font-semibold tracking-tight">
                        {item.title}
                      </h4>
                      <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted-foreground">
                        {item.content}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Belum ada pengumuman.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <h3 className="text-base font-semibold sm:text-lg">Akses Cepat</h3>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/peserta/absensi"
                  className="inline-flex h-10 items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
                >
                  <span>Absensi</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  href="/peserta/tugas"
                  className="inline-flex h-10 items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
                >
                  <span>Tugas Saya</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  href="/peserta/notifikasi"
                  className="inline-flex h-10 items-center justify-between rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
                >
                  <span>Pemberitahuan</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}