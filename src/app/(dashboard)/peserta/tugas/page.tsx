import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { pesertaNavigation } from "@/constants/navigation";

type TaskUserRow = {
  id: string;
  tugas_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
  submitted_at: string | null;
  selesai_at: string | null;
  created_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  target_type: "all" | "division" | "individual";
  target_division: "PA" | "TE" | "TEKNIK" | null;
  due_date: string | null;
  created_at: string;
};

type TaskItem = TaskUserRow & {
  task: TaskRow | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "bg-blue-500/10 text-blue-600";
  if (status === "submitted") return "bg-violet-500/10 text-violet-600";
  if (status === "selesai") return "bg-emerald-500/10 text-emerald-600";
  return "bg-amber-500/10 text-amber-600";
}

function getStatusLabel(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "Sedang Dikerjakan";
  if (status === "submitted") return "Sudah Dikirim";
  if (status === "selesai") return "Selesai";
  return "Belum Dimulai";
}

function getTargetLabel(task: TaskRow | null) {
  if (!task) return "-";
  if (task.target_type === "all") return "Semua";
  if (task.target_type === "division") return `Divisi ${task.target_division ?? "-"}`;
  return "Individu";
}

export default async function PesertaTugasPage() {
  const user = await requireRole(["peserta"]);

  const userSupabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: taskUsersData } = await userSupabase
    .from("tugas_user")
    .select("id, tugas_id, status, submitted_at, selesai_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const taskUsers = (taskUsersData ?? []) as TaskUserRow[];
  const taskIds = taskUsers.map((item) => item.tugas_id);

  const { data: tasksData } = taskIds.length
    ? await adminSupabase
        .from("tugas")
        .select(
          "id, title, description, target_type, target_division, due_date, created_at"
        )
        .in("id", taskIds)
    : { data: [] as TaskRow[] };

  const tasks = (tasksData ?? []) as TaskRow[];
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  const rows: TaskItem[] = taskUsers.map((item) => ({
    ...item,
    task: taskMap.get(item.tugas_id) ?? null,
  }));

  const total = rows.length;
  const pending = rows.filter((item) => item.status === "pending").length;
  const inProgress = rows.filter((item) => item.status === "in_progress").length;
  const submitted = rows.filter((item) => item.status === "submitted").length;
  const selesai = rows.filter((item) => item.status === "selesai").length;

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Tugas Peserta
            </div>
            <p className="text-sm text-muted-foreground sm:text-[15px]">
              Lihat tugas yang diberikan kepada kamu dan pantau status pengerjaannya.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total Tugas</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{total}</h2>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Belum Dimulai</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{pending}</h2>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Sedang Dikerjakan</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{inProgress}</h2>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Selesai</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{selesai}</h2>
          </div>
        </section>

        <section className="space-y-3">
          {rows.length > 0 ? (
            rows.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border bg-card p-4 shadow-sm transition-colors hover:bg-muted/20 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                        {item.task?.title ?? "Data tugas tidak ditemukan"}
                      </h3>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                      {item.task?.description ?? "-"}
                    </p>

                    <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <span>Deadline: {formatDate(item.task?.due_date ?? null)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Target: {getTargetLabel(item.task)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/peserta/tugas/${item.tugas_id}`}
                    className="inline-flex h-9 w-fit items-center justify-center rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm sm:p-10">
              Belum ada tugas untuk kamu.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}