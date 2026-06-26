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
  if (status === "in_progress") return "bg-blue-100 text-blue-700";
  if (status === "submitted") return "bg-violet-100 text-violet-700";
  if (status === "selesai") return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
}

function getCardAccent(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white";
  if (status === "submitted") return "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white";
  if (status === "selesai") return "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white";
  return "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white";
}

function getCardHoverAccent(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "hover:border-blue-300";
  if (status === "submitted") return "hover:border-violet-300";
  if (status === "selesai") return "hover:border-emerald-300";
  return "hover:border-amber-300";
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
        {/* Header banner — gradasi biru senada dengan dashboard utama */}
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-2">
            <div className="inline-flex w-fit items-center rounded-full bg-amber-300 px-3 py-1 text-xs font-bold tracking-wide text-blue-900">
              TUGAS PESERTA
            </div>
            <p className="text-sm text-blue-50 sm:text-[15px]">
              Pantau seluruh tugasmu dan progres pengerjaannya di satu tempat.
            </p>
          </div>
        </section>

        {/* Ringkasan statistik */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Tugas</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-blue-900">{total}</h2>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Belum Dimulai</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-amber-600">{pending}</h2>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Sedang Dikerjakan</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-blue-600">{inProgress}</h2>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Selesai</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">{selesai}</h2>
          </div>
        </section>

        {/* Daftar tugas */}
        <section className="space-y-3">
          {rows.length > 0 ? (
            rows.map((item) => (
              <div
                key={item.id}
                className={`rounded-[22px] border p-4 shadow-sm transition-colors sm:p-5 ${getCardAccent(
                  item.status
                )} ${getCardHoverAccent(item.status)}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold tracking-tight text-blue-900 sm:text-lg">
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

                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      {item.task?.description ?? "Belum ada deskripsi untuk tugas ini."}
                    </p>

                    <div className="mt-3 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <span>Deadline: {formatDate(item.task?.due_date ?? null)}</span>
                      <span className="hidden text-blue-300 sm:inline">•</span>
                      <span>Target: {getTargetLabel(item.task)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/peserta/tugas/${item.tugas_id}`}
                    className="inline-flex h-9 w-fit items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 text-sm font-semibold text-blue-900 shadow-sm transition-colors hover:from-amber-300 hover:to-amber-400"
                  >
                    Detail →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/40 to-white p-8 text-center text-sm text-slate-400 shadow-sm sm:p-10">
              Belum ada tugas yang diberikan untukmu saat ini.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
