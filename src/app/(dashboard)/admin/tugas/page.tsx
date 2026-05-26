import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { adminNavigation } from "@/constants/navigation";
import { CreateTugasDialog } from "@/components/admin/create-tugas-dialog";
import { EditTugasDialog } from "@/components/admin/edit-tugas-dialog";
import { DeleteTugasDialog } from "@/components/admin/delete-tugas-dialog";
import type { TaskTargetUser } from "@/lib/tasks/get-task-target-users";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  target_type: "all" | "division" | "individual";
  target_division: "PA" | "TE" | "TEKNIK" | null;
  due_date: string | null;
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

function getTargetLabel(targetType: "all" | "division" | "individual") {
  if (targetType === "all") return "Semua Peserta";
  if (targetType === "division") return "Per Divisi";
  return "Individu";
}

function getTargetBadgeClass(targetType: "all" | "division" | "individual") {
  if (targetType === "all") return "bg-violet-500/10 text-violet-600";
  if (targetType === "division") return "bg-blue-500/10 text-blue-600";

  return "bg-emerald-500/10 text-emerald-600";
}

export default async function AdminTugasPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: tasksData } = await supabase
    .from("tugas")
    .select(
      "id, title, description, target_type, target_division, due_date, created_at"
    )
    .order("created_at", { ascending: false });

  const tasks = (tasksData ?? []) as TaskRow[];

  const { data: participantsData } = await supabase
    .from("profiles")
    .select("id, nama, username, division")
    .eq("role", "peserta")
    .eq("is_active", true)
    .order("nama", { ascending: true });

  const participants = (participantsData ?? []) as TaskTargetUser[];

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-5">

        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Data Tugas
              </div>

              <h2 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                Daftar Tugas Peserta
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Buat tugas untuk semua peserta, divisi, atau individu.
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <CreateTugasDialog participants={participants} />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border bg-card shadow-sm">
          <div className="border-b border-border/40 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                  Tabel Tugas
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Total {tasks.length} tugas tersedia
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4 font-semibold">Judul</th>
                  <th className="px-4 py-4 font-semibold">Deskripsi</th>
                  <th className="px-4 py-4 font-semibold">Target</th>
                  <th className="px-4 py-4 font-semibold">Divisi</th>
                  <th className="px-4 py-4 font-semibold">Deadline</th>
                  <th className="px-4 py-4 font-semibold">Dibuat</th>
                  <th className="px-4 py-4 font-semibold text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/20">
                {tasks.length > 0 ? (
                  tasks.map((task, index) => (
                    <tr
                      key={task.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        index % 2 === 0
                          ? "bg-background"
                          : "bg-muted/[0.03]"
                      }`}
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold tracking-tight">
                          {task.title}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                        <div className="max-w-[320px] line-clamp-2">
                          {task.description ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getTargetBadgeClass(
                            task.target_type
                          )}`}
                        >
                          {getTargetLabel(task.target_type)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top text-sm">
                        {task.target_division ?? "-"}
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                        {formatDate(task.due_date)}
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                        {formatDate(task.created_at)}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/tugas/${task.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-border/60 bg-background px-3 text-sm font-medium hover:bg-muted"
                          >
                            Detail
                          </Link>

                          <EditTugasDialog task={task} />

                          <DeleteTugasDialog
                            id={task.id}
                            title={task.title}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 text-center text-sm text-muted-foreground"
                    >
                      Belum ada tugas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card */}
          <div className="grid gap-3 p-4 lg:hidden">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border bg-background p-4"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold tracking-tight">
                          {task.title}
                        </h3>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${getTargetBadgeClass(
                            task.target_type
                          )}`}
                        >
                          {getTargetLabel(task.target_type)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {task.description ?? "-"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-muted/40 p-3">
                        <p className="text-muted-foreground">Divisi</p>
                        <p className="mt-1 font-medium">
                          {task.target_division ?? "-"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-muted/40 p-3">
                        <p className="text-muted-foreground">Deadline</p>
                        <p className="mt-1 font-medium">
                          {formatDate(task.due_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/tugas/${task.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-border/60 bg-background px-4 text-sm font-medium hover:bg-muted"
                      >
                        Detail
                      </Link>

                      <EditTugasDialog task={task} />

                      <DeleteTugasDialog
                        id={task.id}
                        title={task.title}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                Belum ada tugas.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}