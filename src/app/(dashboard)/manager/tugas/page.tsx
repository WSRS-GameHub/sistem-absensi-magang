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
    return "bg-emerald-500/10 text-emerald-600";
  }

  if (status === "submitted") {
    return "bg-violet-500/10 text-violet-600";
  }

  if (status === "in_progress") {
    return "bg-blue-500/10 text-blue-600";
  }

  return "bg-amber-500/10 text-amber-600";
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
      .select(
        "id, title, due_date, target_type, target_division, created_at"
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("tugas_user")
      .select(
        "id, tugas_id, user_id, status, created_at"
      )
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

  const participantMap = new Map(
    participants.map((item) => [item.id, item])
  );

  const getTaskUsers = (taskId: string) =>
    taskUsers.filter((item) => item.tugas_id === taskId);

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Monitoring Tugas
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Monitoring progres tugas peserta magang.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Total Tugas
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {tasks.length}
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Sedang Dikerjakan
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {
                taskUsers.filter(
                  (t) => t.status === "in_progress"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Selesai
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {
                taskUsers.filter(
                  (t) =>
                    t.status === "selesai" ||
                    t.status === "submitted"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Pending
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {
                taskUsers.filter(
                  (t) => t.status === "pending"
                ).length
              }
            </h2>
          </div>
        </section>

        <section className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task) => {
              const related = getTaskUsers(task.id);

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
                  className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                          <ClipboardList className="h-5 w-5 text-primary" />
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

                      <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${progres}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{progres}% progres</span>

                          <span>
                            {selesai}/{total} selesai
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-2xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />

                      {formatDateTime(task.created_at)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {related.length > 0 ? (
                      related.slice(0, 6).map((item) => {
                        const participant =
                          participantMap.get(item.user_id);

                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl border bg-muted/30 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {participant?.nama ?? "Peserta"}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  Divisi{" "}
                                  {participant?.division ?? "-"}
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
                      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                        Belum ada peserta pada tugas ini.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[22px] border border-dashed bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              Belum ada tugas.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}