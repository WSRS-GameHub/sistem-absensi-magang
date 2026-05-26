import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Layers3,
  Users2,
} from "lucide-react";

import { getTLScope } from "@/lib/auth/get-tl-scope";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { tlNavigation } from "@/constants/navigation";

import type { TaskTargetUser } from "@/lib/tasks/get-task-target-users";

import { CreateTugasDialogTL } from "@/components/tl/create-tugas-dialog";
import { EditTugasDialogTL } from "@/components/tl/edit-tugas-dialog";
import { DeleteTugasDialogTL } from "@/components/tl/delete-tugas-dialog";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  target_type: "all" | "division" | "individual";
  target_division: "PA" | "TE" | "TEKNIK" | null;
  due_date: string | null;
  created_at: string;
};

type TaskUserRow = {
  tugas_id: string;
  user_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTargetLabel(
  targetType: "all" | "division" | "individual"
) {
  if (targetType === "all") return "Semua Peserta";
  if (targetType === "division") return "Divisi";
  return "Individu";
}

function getTargetBadgeClass(
  targetType: "all" | "division" | "individual"
) {
  if (targetType === "all")
    return "bg-violet-500/10 text-violet-600";

  if (targetType === "division")
    return "bg-blue-500/10 text-blue-600";

  return "bg-emerald-500/10 text-emerald-600";
}

function getProgressBadge(progress: {
  total: number;
  pending: number;
  inProgress: number;
  submitted: number;
  selesai: number;
}) {
  if (progress.total === 0) {
    return {
      label: "Belum Ada Peserta",
      className: "bg-muted text-muted-foreground",
    };
  }

  if (progress.selesai === progress.total) {
    return {
      label: "Selesai",
      className: "bg-emerald-500/10 text-emerald-600",
    };
  }

  if (progress.submitted > 0) {
    return {
      label: `Menunggu Approval (${progress.submitted})`,
      className: "bg-violet-500/10 text-violet-600",
    };
  }

  if (progress.inProgress > 0) {
    return {
      label: `Sedang Dikerjakan (${progress.inProgress})`,
      className: "bg-blue-500/10 text-blue-600",
    };
  }

  return {
    label: "Belum Dikerjakan",
    className: "bg-amber-500/10 text-amber-600",
  };
}

export default async function TLTugasPage() {
  const { division } = await getTLScope();

  const supabase = await createClient();

  const { data: participantsData } = await supabase
    .from("profiles")
    .select("id, nama, username, division")
    .eq("role", "peserta")
    .eq("division", division)
    .eq("is_active", true)
    .order("nama", { ascending: true });

  const participants = (participantsData ??
    []) as TaskTargetUser[];

  const participantIds = participants.map((item) => item.id);

  const { data: tasksData } = await supabase
    .from("tugas")
    .select(
      "id, title, description, target_type, target_division, due_date, created_at"
    )
    .order("created_at", { ascending: false });

  const allTasks = (tasksData ?? []) as TaskRow[];

  const { data: taskUsersData } = await supabase
    .from("tugas_user")
    .select("tugas_id, user_id, status");

  const allTaskUsers = (taskUsersData ??
    []) as TaskUserRow[];

  const taskUserMap = new Map<string, TaskUserRow[]>();

  for (const item of allTaskUsers) {
    const current =
      taskUserMap.get(item.tugas_id) ?? [];

    current.push(item);

    taskUserMap.set(item.tugas_id, current);
  }

  const tasks = allTasks.filter((task) => {
    if (task.target_type === "division") {
      return task.target_division === division;
    }

    if (task.target_type === "individual") {
      const rows =
        taskUserMap.get(task.id) ?? [];

      return rows.some((row) =>
        participantIds.includes(row.user_id)
      );
    }

    return false;
  });

  const totalTasks = tasks.length;

  const totalSubmitted = allTaskUsers.filter(
    (item) =>
      participantIds.includes(item.user_id) &&
      item.status === "submitted"
  ).length;

  const totalInProgress = allTaskUsers.filter(
    (item) =>
      participantIds.includes(item.user_id) &&
      item.status === "in_progress"
  ).length;

  const totalCompleted = allTaskUsers.filter(
    (item) =>
      participantIds.includes(item.user_id) &&
      item.status === "selesai"
  ).length;

  return (
    <DashboardLayout navigation={tlNavigation}>
      <DashboardPageHeader
        title="Manajemen Tugas"
        description={`Kelola dan monitor seluruh tugas peserta divisi ${division}.`}
      />

      <div className="space-y-5">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Tugas
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  {totalTasks}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Tugas aktif divisi
                </p>
              </div>

              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Sedang Dikerjakan
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  {totalInProgress}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Progress berjalan
                </p>
              </div>

              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Menunggu Review
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  {totalSubmitted}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Perlu approval
                </p>
              </div>

              <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-600">
                <Users2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Tugas Selesai
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  {totalCompleted}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Sudah dituntaskan
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="overflow-hidden rounded-[30px] border bg-card shadow-sm">
          <div className="border-b border-border/40 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent px-5 py-6 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Divisi {division}
                </div>

                <h3 className="mt-4 text-xl font-bold tracking-tight">
                  Daftar Tugas Peserta
                </h3>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Team Leader dapat memonitor progress,
                  membuat tugas baru, serta melakukan
                  pengelolaan tugas peserta sesuai divisi.
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <CreateTugasDialogTL
                  participants={participants}
                  division={division}
                />
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 font-semibold">
                    Judul
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Deskripsi
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Target
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Deadline
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Progress
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Dibuat
                  </th>

                  <th className="px-4 py-4 font-semibold text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/20">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const rows =
                      taskUserMap.get(task.id) ?? [];

                    const filteredRows =
                      rows.filter((row) =>
                        participantIds.includes(
                          row.user_id
                        )
                      );

                    const progress = {
                      total: filteredRows.length,

                      pending: filteredRows.filter(
                        (item) =>
                          item.status === "pending"
                      ).length,

                      inProgress:
                        filteredRows.filter(
                          (item) =>
                            item.status ===
                            "in_progress"
                        ).length,

                      submitted:
                        filteredRows.filter(
                          (item) =>
                            item.status ===
                            "submitted"
                        ).length,

                      selesai: filteredRows.filter(
                        (item) =>
                          item.status === "selesai"
                      ).length,
                    };

                    const progressBadge =
                      getProgressBadge(progress);

                    return (
                      <tr
                        key={task.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-6 py-5 align-top">
                          <div className="font-semibold tracking-tight">
                            {task.title}
                          </div>
                        </td>

                        <td className="px-4 py-5 align-top text-sm text-muted-foreground">
                          <div className="max-w-[320px] line-clamp-2 leading-6">
                            {task.description ?? "-"}
                          </div>
                        </td>

                        <td className="px-4 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getTargetBadgeClass(
                              task.target_type
                            )}`}
                          >
                            {getTargetLabel(
                              task.target_type
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-5 align-top text-sm">
                          {formatDate(task.due_date)}
                        </td>

                        <td className="px-4 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${progressBadge.className}`}
                          >
                            {progressBadge.label}
                          </span>
                        </td>

                        <td className="px-4 py-5 align-top text-sm">
                          {formatDate(task.created_at)}
                        </td>

                        <td className="px-4 py-5 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/tl/tugas/${task.id}`}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
                            >
                              Detail
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>

                            <EditTugasDialogTL
                              task={task}
                            />

                            <DeleteTugasDialogTL
                              id={task.id}
                              title={task.title}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      Belum ada tugas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 p-4 lg:hidden">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const rows =
                  taskUserMap.get(task.id) ?? [];

                const filteredRows = rows.filter(
                  (row) =>
                    participantIds.includes(
                      row.user_id
                    )
                );

                const progress = {
                  total: filteredRows.length,

                  pending: filteredRows.filter(
                    (item) =>
                      item.status === "pending"
                  ).length,

                  inProgress:
                    filteredRows.filter(
                      (item) =>
                        item.status ===
                        "in_progress"
                    ).length,

                  submitted:
                    filteredRows.filter(
                      (item) =>
                        item.status ===
                        "submitted"
                    ).length,

                  selesai: filteredRows.filter(
                    (item) =>
                      item.status === "selesai"
                  ).length,
                };

                const progressBadge =
                  getProgressBadge(progress);

                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {task.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {task.description ??
                            "-"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getTargetBadgeClass(
                          task.target_type
                        )}`}
                      >
                        {getTargetLabel(
                          task.target_type
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          Deadline
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {formatDate(
                            task.due_date
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          Progress
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${progressBadge.className}`}
                        >
                          {progressBadge.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/tl/tugas/${task.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium hover:bg-muted"
                      >
                        Detail
                      </Link>

                      <EditTugasDialogTL
                        task={task}
                      />

                      <DeleteTugasDialogTL
                        id={task.id}
                        title={task.title}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed bg-card py-14 text-center text-sm text-muted-foreground">
                Belum ada tugas.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}