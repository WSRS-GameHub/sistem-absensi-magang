import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Layers3,
  Users2,
  CheckCircle2,
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

function getTargetLabel(targetType: "all" | "division" | "individual") {
  if (targetType === "all") return "Semua Peserta";
  if (targetType === "division") return "Divisi";
  return "Individu";
}

function getTargetBadgeClass(targetType: "all" | "division" | "individual") {
  if (targetType === "all")
    return "bg-[#FFE600] text-[#003580] font-bold";
  if (targetType === "division")
    return "bg-[#0072CE]/15 text-[#0072CE] font-semibold";
  return "bg-emerald-500/15 text-emerald-700 font-semibold";
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
      className: "bg-gray-100 text-gray-500",
    };
  }
  if (progress.selesai === progress.total) {
    return {
      label: "Selesai",
      className: "bg-emerald-500/15 text-emerald-700 font-semibold",
    };
  }
  if (progress.submitted > 0) {
    return {
      label: `Menunggu Approval (${progress.submitted})`,
      className: "bg-[#FFE600] text-[#003580] font-bold",
    };
  }
  if (progress.inProgress > 0) {
    return {
      label: `Sedang Dikerjakan (${progress.inProgress})`,
      className: "bg-[#0072CE]/15 text-[#0072CE] font-semibold",
    };
  }
  return {
    label: "Belum Dikerjakan",
    className: "bg-amber-100 text-amber-700 font-semibold",
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

  const participants = (participantsData ?? []) as TaskTargetUser[];
  const participantIds = participants.map((item) => item.id);

  const { data: tasksData } = await supabase
    .from("tugas")
    .select("id, title, description, target_type, target_division, due_date, created_at")
    .order("created_at", { ascending: false });

  const allTasks = (tasksData ?? []) as TaskRow[];

  const { data: taskUsersData } = await supabase
    .from("tugas_user")
    .select("tugas_id, user_id, status");

  const allTaskUsers = (taskUsersData ?? []) as TaskUserRow[];

  const taskUserMap = new Map<string, TaskUserRow[]>();
  for (const item of allTaskUsers) {
    const current = taskUserMap.get(item.tugas_id) ?? [];
    current.push(item);
    taskUserMap.set(item.tugas_id, current);
  }

  const tasks = allTasks.filter((task) => {
    if (task.target_type === "division") return task.target_division === division;
    if (task.target_type === "individual") {
      const rows = taskUserMap.get(task.id) ?? [];
      return rows.some((row) => participantIds.includes(row.user_id));
    }
    return false;
  });

  const totalTasks = tasks.length;

  const totalSubmitted = allTaskUsers.filter(
    (item) => participantIds.includes(item.user_id) && item.status === "submitted"
  ).length;

  const totalInProgress = allTaskUsers.filter(
    (item) => participantIds.includes(item.user_id) && item.status === "in_progress"
  ).length;

  const totalCompleted = allTaskUsers.filter(
    (item) => participantIds.includes(item.user_id) && item.status === "selesai"
  ).length;

  return (
    <DashboardLayout navigation={tlNavigation}>

      <div className="space-y-5">

        {/* ── Page Banner (referensi gambar) ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0072CE] px-6 py-5 shadow-md">
          {/* decorative watermark circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#FFE600] px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#003580] shadow-sm">
              Manajemen Tugas
            </span>
            <p className="text-sm font-medium leading-relaxed text-white/90">
              Kelola dan monitor tugas peserta magang divisi{" "}
              <span className="font-bold text-[#FFE600]">{division}</span>
            </p>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Tugas */}
          <div className="relative overflow-hidden rounded-2xl border border-[#0072CE]/20 bg-white p-5 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#0072CE]" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0072CE]/70">
                  Total Tugas
                </p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#003580]">
                  {totalTasks}
                </h2>
                <p className="mt-1.5 text-xs text-gray-500">Tugas aktif divisi</p>
              </div>
              <div className="rounded-2xl bg-[#0072CE]/10 p-3 text-[#0072CE]">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Sedang Dikerjakan */}
          <div className="relative overflow-hidden rounded-2xl border border-[#0072CE]/20 bg-white p-5 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#0072CE]/60" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0072CE]/70">
                  Sedang Dikerjakan
                </p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#003580]">
                  {totalInProgress}
                </h2>
                <p className="mt-1.5 text-xs text-gray-500">Progress berjalan</p>
              </div>
              <div className="rounded-2xl bg-[#0072CE]/10 p-3 text-[#0072CE]">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Menunggu Review */}
          <div className="relative overflow-hidden rounded-2xl border border-[#FFE600]/40 bg-white p-5 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#FFE600]" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]/60">
                  Menunggu Review
                </p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#003580]">
                  {totalSubmitted}
                </h2>
                <p className="mt-1.5 text-xs text-gray-500">Perlu approval</p>
              </div>
              <div className="rounded-2xl bg-[#FFE600]/20 p-3 text-[#003580]">
                <Users2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Tugas Selesai */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-emerald-500" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70">
                  Tugas Selesai
                </p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#003580]">
                  {totalCompleted}
                </h2>
                <p className="mt-1.5 text-xs text-gray-500">Sudah dituntaskan</p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <div className="overflow-hidden rounded-[24px] border border-[#0072CE]/15 bg-white shadow-sm">

          {/* Card Header */}
          <div className="relative overflow-hidden border-b border-[#0072CE]/10 bg-[#0072CE] px-6 py-6">
            {/* decorative circles */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -right-4 top-4 h-28 w-28 rounded-full bg-white/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full bg-[#FFE600] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#003580] shadow-sm">
                  Divisi {division}
                </div>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-white">
                  Daftar Tugas Peserta
                </h3>
                <p className="mt-1.5 text-sm leading-7 text-white/75">
                  Team Leader dapat memonitor progress, membuat tugas baru, serta
                  melakukan pengelolaan tugas sesuai divisi.
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                {/* CreateTugasDialogTL — override button style via className if supported */}
                <div className="[&>button]:bg-[#FFE600] [&>button]:text-[#003580] [&>button]:font-bold [&>button]:hover:bg-yellow-300 [&>button]:shadow-sm">
                  <CreateTugasDialogTL
                    participants={participants}
                    division={division}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-[#0072CE]/10 bg-[#0072CE]/5 text-left text-[11px] font-bold uppercase tracking-widest text-[#0072CE]">
                  <th className="px-6 py-4">Judul</th>
                  <th className="px-4 py-4">Deskripsi</th>
                  <th className="px-4 py-4">Target</th>
                  <th className="px-4 py-4">Deadline</th>
                  <th className="px-4 py-4">Progress</th>
                  <th className="px-4 py-4">Dibuat</th>
                  <th className="px-4 py-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#0072CE]/8">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const rows = taskUserMap.get(task.id) ?? [];
                    const filteredRows = rows.filter((row) =>
                      participantIds.includes(row.user_id)
                    );

                    const progress = {
                      total: filteredRows.length,
                      pending: filteredRows.filter((i) => i.status === "pending").length,
                      inProgress: filteredRows.filter((i) => i.status === "in_progress").length,
                      submitted: filteredRows.filter((i) => i.status === "submitted").length,
                      selesai: filteredRows.filter((i) => i.status === "selesai").length,
                    };

                    const progressBadge = getProgressBadge(progress);

                    return (
                      <tr
                        key={task.id}
                        className="transition-colors hover:bg-[#0072CE]/5"
                      >
                        <td className="px-6 py-5 align-top">
                          <div className="font-semibold tracking-tight text-[#003580]">
                            {task.title}
                          </div>
                        </td>

                        <td className="px-4 py-5 align-top text-sm text-gray-500">
                          <div className="max-w-[320px] line-clamp-2 leading-6">
                            {task.description ?? "-"}
                          </div>
                        </td>

                        <td className="px-4 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs ${getTargetBadgeClass(
                              task.target_type
                            )}`}
                          >
                            {getTargetLabel(task.target_type)}
                          </span>
                        </td>

                        <td className="px-4 py-5 align-top text-sm text-gray-600">
                          {formatDate(task.due_date)}
                        </td>

                        <td className="px-4 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs ${progressBadge.className}`}
                          >
                            {progressBadge.label}
                          </span>
                        </td>

                        <td className="px-4 py-5 align-top text-sm text-gray-600">
                          {formatDate(task.created_at)}
                        </td>

                        <td className="px-4 py-5 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/tl/tugas/${task.id}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#0072CE]/30 bg-white px-4 text-xs font-semibold text-[#0072CE] transition-colors hover:bg-[#0072CE]/5"
                            >
                              Detail
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>

                            <EditTugasDialogTL task={task} />
                            <DeleteTugasDialogTL id={task.id} title={task.title} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm text-gray-400"
                    >
                      Belum ada tugas untuk divisi ini.
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
                const rows = taskUserMap.get(task.id) ?? [];
                const filteredRows = rows.filter((row) =>
                  participantIds.includes(row.user_id)
                );

                const progress = {
                  total: filteredRows.length,
                  pending: filteredRows.filter((i) => i.status === "pending").length,
                  inProgress: filteredRows.filter((i) => i.status === "in_progress").length,
                  submitted: filteredRows.filter((i) => i.status === "submitted").length,
                  selesai: filteredRows.filter((i) => i.status === "selesai").length,
                };

                const progressBadge = getProgressBadge(progress);

                return (
                  <div
                    key={task.id}
                    className="overflow-hidden rounded-2xl border border-[#0072CE]/15 bg-white shadow-sm"
                  >
                    {/* Mobile card top bar */}
                    <div className="h-1 w-full bg-[#0072CE]" />

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-[#003580]">
                            {task.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {task.description ?? "-"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] ${getTargetBadgeClass(
                            task.target_type
                          )}`}
                        >
                          {getTargetLabel(task.target_type)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#0072CE]/5 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0072CE]/70">
                            Deadline
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#003580]">
                            {formatDate(task.due_date)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#0072CE]/5 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0072CE]/70">
                            Progress
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] ${progressBadge.className}`}
                          >
                            {progressBadge.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/tl/tugas/${task.id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#0072CE]/30 px-4 text-xs font-semibold text-[#0072CE] hover:bg-[#0072CE]/5"
                        >
                          Detail
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        <EditTugasDialogTL task={task} />
                        <DeleteTugasDialogTL id={task.id} title={task.title} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#0072CE]/20 bg-[#0072CE]/5 py-14 text-center text-sm text-[#0072CE]/60">
                Belum ada tugas untuk divisi ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
