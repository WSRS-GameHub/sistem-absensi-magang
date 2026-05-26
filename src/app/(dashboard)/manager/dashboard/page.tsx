import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { managerNavigation } from "@/constants/navigation";

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
  is_active: boolean;
  created_at: string | null;
};

type AttendanceRow = {
  id: string;
  user_id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
  created_at: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  target_type: "all" | "division" | "individual" | null;
  target_division: "PA" | "TE" | "TEKNIK" | null;
  created_at: string | null;
};

type TaskUserRow = {
  id: string;
  tugas_id: string;
  user_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ManagerDashboardPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalParticipants },
    { count: todayAttendanceCount },
    { count: totalTasks },
    { data: participantsData },
    { data: attendanceData },
    { data: tasksData },
    { data: taskUsersData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "peserta")
      .eq("is_active", true),

    supabase
      .from("absensi")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", today),

    supabase
      .from("tugas")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("profiles")
      .select("id, nama, division, is_active, created_at")
      .eq("role", "peserta")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(4),

    supabase
      .from("absensi")
      .select("id, user_id, tanggal, check_in_at, check_out_at, created_at")
      .eq("tanggal", today)
      .order("created_at", { ascending: false })
      .limit(4),

    supabase
      .from("tugas")
      .select("id, title, due_date, target_type, target_division, created_at")
      .order("created_at", { ascending: false })
      .limit(4),

    supabase
      .from("tugas_user")
      .select("id, tugas_id, user_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const participants = (participantsData ?? []) as ProfileRow[];
  const attendances = (attendanceData ?? []) as AttendanceRow[];
  const tasks = (tasksData ?? []) as TaskRow[];
  const taskUsers = (taskUsersData ?? []) as TaskUserRow[];

  const taskUserMap = new Map<string, TaskUserRow[]>();

  for (const item of taskUsers) {
    const list = taskUserMap.get(item.tugas_id) ?? [];
    list.push(item);
    taskUserMap.set(item.tugas_id, list);
  }

  const attendanceRate =
    totalParticipants && totalParticipants > 0
      ? Math.round(
          (Number(todayAttendanceCount ?? 0) /
            Number(totalParticipants)) *
            100
        )
      : 0;

  const selesaiCount = taskUsers.filter(
    (item) =>
      item.status === "selesai" ||
      item.status === "submitted"
  ).length;

  const progresTugas =
    taskUsers.length > 0
      ? Math.round((selesaiCount / taskUsers.length) * 100)
      : 0;

  const stats = [
    {
      title: "Peserta Aktif",
      value: String(totalParticipants ?? 0),
      desc: "Peserta aktif",
      icon: Users,
      tone: "bg-blue-500/10 text-blue-600",
      href: "/manager/peserta",
    },
    {
      title: "Absensi",
      value: String(todayAttendanceCount ?? 0),
      desc: `${attendanceRate}% hadir`,
      icon: CalendarCheck2,
      tone: "bg-emerald-500/10 text-emerald-600",
      href: "/manager/absensi",
    },
    {
      title: "Tugas",
      value: String(totalTasks ?? 0),
      desc: `${progresTugas}% progres`,
      icon: ClipboardList,
      tone: "bg-violet-500/10 text-violet-600",
      href: "/manager/tugas",
    },
    {
      title: "Progress",
      value: String(selesaiCount),
      desc: "Terkirim / selesai",
      icon: Activity,
      tone: "bg-amber-500/10 text-amber-600",
      href: "/manager/tugas",
    },
  ];

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Dashboard Manager
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Monitoring peserta, absensi, dan progres tugas magang.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-[20px] border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.title}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight">
                      {item.value}
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-2.5 ${item.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  Progress Tugas
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Monitoring tugas peserta.
                </p>
              </div>

              <Link
                href="/manager/tugas"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border px-4 text-sm font-medium hover:bg-muted"
              >
                Semua
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  const related =
                    taskUserMap.get(task.id) ?? [];

                  const total = related.length;

                  const selesai = related.filter(
                    (t) =>
                      t.status === "selesai" ||
                      t.status === "submitted"
                  ).length;

                  const progres =
                    total > 0
                      ? Math.round((selesai / total) * 100)
                      : 0;

                  return (
                    <div
                      key={task.id}
                      className="rounded-2xl border bg-muted/30 p-4"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {task.title}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Deadline {formatDate(task.due_date)}
                            </p>
                          </div>

                          <span className="text-xs text-muted-foreground">
                            {progres}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-background">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${progres}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {selesai}/{total} selesai
                          </span>

                          <span>
                            {task.target_type === "division"
                              ? task.target_division
                              : "Semua"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Belum ada tugas.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  Absensi Hari Ini
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Aktivitas absensi terbaru.
                </p>
              </div>

              <Link
                href="/manager/absensi"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border px-4 text-sm font-medium hover:bg-muted"
              >
                Semua
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {attendances.length > 0 ? (
                attendances.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-muted/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          Absensi tercatat
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(item.tanggal)}
                        </p>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {item.check_in_at
                          ? new Date(
                              item.check_in_at
                            ).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Belum ada absensi.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">
                Peserta Aktif
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Peserta terbaru yang aktif.
              </p>
            </div>

            <Link
              href="/manager/peserta"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border px-4 text-sm font-medium hover:bg-muted"
            >
              Semua
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {participants.length > 0 ? (
              participants.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-muted/30 p-4"
                >
                  <p className="font-medium">{item.nama}</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Divisi {item.division ?? "-"}
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                    Aktif
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Belum ada peserta.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />

            <h3 className="text-lg font-semibold">
              Informasi Akses
            </h3>
          </div>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Manager hanya memiliki akses monitoring untuk melihat
            data peserta, absensi, dan progres tugas tanpa
            mengubah data sistem.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}