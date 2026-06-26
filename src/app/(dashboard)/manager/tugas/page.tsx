import { ClipboardList, Clock3 } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { managerNavigation } from "@/constants/navigation";

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

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
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

function getStatusStyle(status: string) {
  if (status === "selesai") {
    return "bg-emerald-500/10 text-emerald-600 border border-emerald-200";
  }
  if (status === "submitted") {
    return "bg-violet-500/10 text-violet-600 border border-violet-200";
  }
  if (status === "in_progress") {
    // Blue accent for in-progress
    return "border text-[#0072CE] border-[#0072CE]/30 bg-[#0072CE]/8";
  }
  // Yellow accent for pending
  return "border text-amber-700 border-[#FFE600]/60 bg-[#FFE600]/20";
}

function getStatusLabel(status: string) {
  if (status === "selesai") return "Selesai";
  if (status === "submitted") return "Dikirim";
  if (status === "in_progress") return "Berjalan";
  return "Pending";
}

export default async function ManagerTugasPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const [
    { data: tasksData },
    { data: taskUsersData },
    { data: participantData },
  ] = await Promise.all([
    supabase
      .from("tugas")
      .select("id, title, due_date, target_type, target_division, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("tugas_user")
      .select("id, tugas_id, user_id, status, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, nama, division")
      .eq("role", "peserta")
      .eq("is_active", true),
  ]);

  const tasks = (tasksData ?? []) as TaskRow[];
  const taskUsers = (taskUsersData ?? []) as TaskUserRow[];
  const participants = (participantData ?? []) as ProfileRow[];

  const participantMap = new Map(participants.map((item) => [item.id, item]));

  const getTaskUsers = (taskId: string) =>
    taskUsers.filter((item) => item.tugas_id === taskId);

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-5">

        {/* Header Section */}
        <section
          className="rounded-[22px] p-5 shadow-sm relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0072CE 0%, #005baa 100%)" }}
        >
          {/* Decorative yellow accent strip */}
          <div
            className="absolute top-0 right-0 h-full w-1.5 rounded-r-[22px]"
            style={{ background: "#FFE600" }}
          />
          {/* Faint circle watermark */}
          <div
            className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full opacity-10"
            style={{ background: "#FFE600" }}
          />

          <div className="relative">
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
              style={{ background: "#FFE600", color: "#003d7a" }}
            >
              Monitoring Tugas
            </div>
            <p className="mt-2 text-sm text-blue-100">
              Monitoring progres tugas peserta magang.
            </p>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Tugas */}
          <div
            className="rounded-[20px] p-4 shadow-sm border-0 relative overflow-hidden"
            style={{ background: "#0072CE" }}
          >
            <div
              className="absolute bottom-0 right-0 h-16 w-16 rounded-tl-full opacity-20"
              style={{ background: "#FFE600" }}
            />
            <p className="text-xs font-medium text-blue-100">Total Tugas</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {tasks.length}
            </h2>
          </div>

          {/* Sedang Dikerjakan */}
          <div
            className="rounded-[20px] p-4 shadow-sm border"
            style={{ borderColor: "#0072CE33", background: "#0072CE0d" }}
          >
            <p className="text-xs font-medium" style={{ color: "#0072CE" }}>
              Sedang Dikerjakan
            </p>
            <h2
              className="mt-2 text-2xl font-bold tracking-tight"
              style={{ color: "#0072CE" }}
            >
              {taskUsers.filter((t) => t.status === "in_progress").length}
            </h2>
          </div>

          {/* Selesai */}
          <div
            className="rounded-[20px] p-4 shadow-sm border"
            style={{ borderColor: "#FFE60055", background: "#FFE6000d" }}
          >
            <p className="text-xs font-medium text-amber-700">Selesai</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
              {
                taskUsers.filter(
                  (t) => t.status === "selesai" || t.status === "submitted"
                ).length
              }
            </h2>
          </div>

          {/* Pending */}
          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Pending</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {taskUsers.filter((t) => t.status === "pending").length}
            </h2>
          </div>
        </section>

        {/* Task List */}
        <section className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task) => {
              const related = getTaskUsers(task.id);
              const total = related.length;
              const selesai = related.filter(
                (t) => t.status === "selesai" || t.status === "submitted"
              ).length;
              const progres = total > 0 ? Math.round((selesai / total) * 100) : 0;

              return (
                <div
                  key={task.id}
                  className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5"
                  style={{ borderColor: "#0072CE1a" }}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        {/* Icon with blue background */}
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                          style={{ background: "#0072CE" }}
                        >
                          <ClipboardList className="h-5 w-5 text-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                            {task.title}
                          </h3>
                          <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">
                            Deadline {formatDate(task.due_date)}
                            {" • "}
                            {task.target_type === "all"
                              ? "Semua Peserta"
                              : task.target_type === "division"
                                ? `Divisi ${task.target_division ?? "-"}`
                                : "Individu"}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progres}%`,
                              background:
                                progres === 100
                                  ? "#FFE600"
                                  : "linear-gradient(90deg, #0072CE, #FFE600)",
                            }}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span
                            className="font-medium"
                            style={{ color: progres > 0 ? "#0072CE" : undefined }}
                          >
                            {progres}% progres
                          </span>
                          <span>
                            {selesai}/{total} selesai
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp badge */}
                    <div
                      className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs"
                      style={{
                        background: "#FFE60022",
                        border: "1px solid #FFE60066",
                        color: "#7a6200",
                      }}
                    >
                      <Clock3 className="h-4 w-4" style={{ color: "#0072CE" }} />
                      {formatDateTime(task.created_at)}
                    </div>
                  </div>

                  {/* Participant grid */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {related.length > 0 ? (
                      related.slice(0, 6).map((item) => {
                        const participant = participantMap.get(item.user_id);

                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl p-4"
                            style={{
                              background: "#0072CE08",
                              border: "1px solid #0072CE1a",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {participant?.nama ?? "Peserta"}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Divisi {participant?.division ?? "-"}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusStyle(
                                  item.status
                                )}`}
                              >
                                {getStatusLabel(item.status)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className="rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3"
                        style={{ border: "1.5px dashed #0072CE33" }}
                      >
                        Belum ada peserta pada tugas ini.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="rounded-[22px] border-dashed bg-card p-8 text-center text-sm text-muted-foreground shadow-sm"
              style={{ border: "1.5px dashed #0072CE33" }}
            >
              Belum ada tugas.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
