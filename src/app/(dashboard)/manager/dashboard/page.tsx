import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { managerNavigation } from "@/constants/navigation";

const TIMEZONE = "Asia/Jakarta";

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
  is_active: boolean;
  akhir_magang: string | null;
  mulai_magang: string | null;
};

type AttendanceRow = {
  id: string;
  user_id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  target_type: "all" | "division" | "individual" | null;
  target_division: "PA" | "TE" | "TEKNIK" | null;
};

type TaskUserRow = {
  id: string;
  tugas_id: string;
  user_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
};

/**
 * Mengambil tanggal hari ini dalam format YYYY-MM-DD
 * berdasarkan timezone Asia/Jakarta (bukan UTC server).
 */
function getTodayJakarta(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
  }).format(now);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

/**
 * Status aktif yang sebenarnya = is_active bernilai true DAN
 * (tidak ada tanggal akhir_magang ATAU tanggal akhir_magang belum lewat).
 * Konsisten dengan logika yang dipakai di halaman admin.
 */
function isUserActive(item: ProfileRow) {
  if (!item.is_active) return false;
  if (!item.akhir_magang) return true;

  const today = getTodayJakarta();
  return item.akhir_magang >= today;
}

export default async function ManagerDashboardPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const today = getTodayJakarta();

  const [
    { count: totalParticipants },
    { count: todayAttendanceCount },
    { count: totalTasks },
    { data: participantsData },
    { data: attendanceData, error: attendanceError },
    { data: tasksData, error: tasksError },
    { data: taskUsersData, error: taskUsersError },
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
      .select("id, nama, division, is_active, akhir_magang, mulai_magang")
      .eq("role", "peserta")
      .eq("is_active", true)
      .order("mulai_magang", { ascending: false })
      .limit(4),

    // Kolom "mulai_magang" hanya ada di tabel profiles, bukan di absensi.
    // Order di sini pakai created_at supaya query tidak gagal.
    supabase
      .from("absensi")
      .select("id, user_id, tanggal, check_in_at, check_out_at")
      .eq("tanggal", today)
      .order("created_at", { ascending: false })
      .limit(4),

    // Sama halnya untuk tabel tugas.
    supabase
      .from("tugas")
      .select("id, title, due_date, target_type, target_division")
      .order("created_at", { ascending: false })
      .limit(4),

    // Sama halnya untuk tabel tugas_user.
    supabase
      .from("tugas_user")
      .select("id, tugas_id, user_id, status")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (attendanceError) throw new Error(attendanceError.message);
  if (tasksError) throw new Error(tasksError.message);
  if (taskUsersError) throw new Error(taskUsersError.message);

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
      tone: "bg-[#0072CE] text-white",
      href: "/manager/peserta",
    },
    {
      title: "Absensi",
      value: String(todayAttendanceCount ?? 0),
      desc: `${attendanceRate}% hadir`,
      icon: CalendarCheck2,
      tone: "bg-[#FFE600] text-[#0A2540]",
      href: "/manager/absensi",
    },
    {
      title: "Tugas",
      value: String(totalTasks ?? 0),
      desc: `${progresTugas}% progres`,
      icon: ClipboardList,
      tone: "bg-[#0A2540] text-white",
      href: "/manager/tugas",
    },
    {
      title: "Progress",
      value: String(selesaiCount),
      desc: "Terkirim / selesai",
      icon: Activity,
      tone: "bg-[#0072CE]/10 text-[#0072CE]",
      href: "/manager/tugas",
    },
  ];

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-5">
        {/* Header banner */}
        <section className="relative overflow-hidden rounded-[24px] bg-[#0072CE] p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rotate-12 rounded-[28px] bg-[#FFE600]/90" />
          <div className="pointer-events-none absolute -right-2 top-10 h-20 w-20 rotate-12 rounded-2xl bg-white/10" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Dashboard Manager
            </div>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
              Monitoring peserta, absensi, dan progres tugas magang.
            </p>
          </div>
        </section>

        {/* Stat cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-[20px] border border-[#0072CE]/10 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0072CE]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.title}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
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

        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          {/* Progress tugas */}
          <section className="rounded-[22px] border border-[#0072CE]/10 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Progress Tugas
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Monitoring tugas peserta.
                </p>
              </div>

              <Link
                href="/manager/tugas"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#0072CE]/15 px-4 text-sm font-medium text-[#0072CE] transition-colors hover:bg-[#0072CE]/[0.06]"
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
                      className="rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.03] p-4"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {task.title}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Deadline {formatDate(task.due_date)}
                            </p>
                          </div>

                          <span className="rounded-full bg-[#0072CE]/10 px-2 py-0.5 text-xs font-semibold text-[#0072CE]">
                            {progres}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[#0072CE]/10">
                          <div
                            className="h-full rounded-full bg-[#0072CE]"
                            style={{
                              width: `${progres}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {selesai}/{total} selesai
                          </span>

                          <span className="rounded-full bg-[#FFE600]/25 px-2 py-0.5 font-medium text-[#0A2540]">
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
                <div className="rounded-2xl border border-dashed border-[#0072CE]/20 p-8 text-center text-sm text-muted-foreground">
                  Belum ada tugas.
                </div>
              )}
            </div>
          </section>

          {/* Absensi hari ini */}
          <section className="rounded-[22px] border border-[#0072CE]/10 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Absensi Hari Ini
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Aktivitas absensi terbaru.
                </p>
              </div>

              <Link
                href="/manager/absensi"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#0072CE]/15 px-4 text-sm font-medium text-[#0072CE] transition-colors hover:bg-[#0072CE]/[0.06]"
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
                    className="flex items-center gap-3 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.03] p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0072CE]/10 text-[#0072CE]">
                      <CalendarCheck2 className="h-4 w-4" />
                    </div>

                    <div className="flex flex-1 items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          Absensi tercatat
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(item.tanggal)}
                        </p>
                      </div>

                      <span className="rounded-full bg-[#FFE600]/25 px-2.5 py-1 text-xs font-semibold text-[#0A2540]">
                        {formatTime(item.check_in_at)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#0072CE]/20 p-8 text-center text-sm text-muted-foreground">
                  Belum ada absensi.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Peserta aktif - sekarang sebagai tabel */}
        <section className="rounded-[22px] border border-[#0072CE]/10 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Peserta Aktif
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Peserta terbaru yang aktif.
              </p>
            </div>

            <Link
              href="/manager/users"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#0072CE]/15 px-4 text-sm font-medium text-[#0072CE] transition-colors hover:bg-[#0072CE]/[0.06]"
            >
              Semua
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Tabel - desktop / tablet */}
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#0072CE]/10 text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Divisi</th>
                  <th className="px-4 py-3 font-medium">Berakhir</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  participants.map((item) => {
                    const active = isUserActive(item);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#0072CE]/5 last:border-0 hover:bg-[#0072CE]/[0.03]"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.nama}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.division ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(item.akhir_magang)}
                        </td>
                        <td className="px-4 py-3">
                          {active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE600]/25 px-2.5 py-1 text-[11px] font-semibold text-[#0A2540]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#0A2540]" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                              Tidak Aktif
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Belum ada peserta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Kartu - mobile */}
          <div className="mt-4 space-y-3 sm:hidden">
            {participants.length > 0 ? (
              participants.map((item) => {
                const active = isUserActive(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0072CE]/10 text-[#0072CE]">
                          <Users className="h-4 w-4" />
                        </div>
                        <p className="truncate font-medium text-foreground">
                          {item.nama}
                        </p>
                      </div>

                      {active ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFE600]/25 px-2.5 py-1 text-[11px] font-semibold text-[#0A2540]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0A2540]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                          Tidak Aktif
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Divisi {item.division ?? "-"}</span>
                      <span>Berakhir {formatDate(item.akhir_magang)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#0072CE]/20 p-8 text-center text-sm text-muted-foreground">
                Belum ada peserta.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
