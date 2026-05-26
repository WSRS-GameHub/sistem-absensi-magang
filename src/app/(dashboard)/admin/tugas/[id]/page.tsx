import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { adminNavigation } from "@/constants/navigation";
import { ApproveTugasButton } from "@/components/tasks/approve-tugas-button";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  target_type: "all" | "division" | "individual";
  target_division: "PA" | "TE" | "TEKNIK" | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type ProfileRow = {
  id: string;
  nama: string;
  username: string;
  division: "PA" | "TE" | "TEKNIK" | null;
};

type TaskUserRow = {
  id: string;
  user_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
  submitted_at: string | null;
  selesai_at: string | null;
  submission_text: string | null;
  submission_file_url: string | null;
  created_at: string;
};

type TaskUserItem = TaskUserRow & {
  profile: ProfileRow | null;
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

function getTargetLabel(targetType: "all" | "division" | "individual") {
  if (targetType === "all") return "Semua Peserta";
  if (targetType === "division") return "Per Divisi";
  return "Individu";
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

function getProgressLabel(status: TaskUserRow["status"]) {
  if (status === "pending") return "Belum mulai";
  if (status === "in_progress") return "Sedang berjalan";
  if (status === "submitted") return "Menunggu approval";
  return "Tuntas";
}

export default async function AdminTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);

  const { id } = await params;
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("tugas")
    .select(
      "id, title, description, target_type, target_division, due_date, created_at, updated_at, created_by"
    )
    .eq("id", id)
    .single();

  if (taskError || !task) {
    notFound();
  }

  const taskRow = task as TaskRow;

  const { data: taskUsersData, error: taskUsersError } = await supabase
    .from("tugas_user")
    .select(
      "id, user_id, status, submitted_at, selesai_at, submission_text, submission_file_url, created_at"
    )
    .eq("tugas_id", taskRow.id)
    .order("created_at", { ascending: true });

  if (taskUsersError) {
    throw new Error(taskUsersError.message);
  }

  const taskUsers = (taskUsersData ?? []) as TaskUserRow[];
  const userIds = taskUsers.map((item) => item.user_id);

  const { data: profilesData, error: profilesError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, nama, username, division")
        .in("id", userIds)
    : { data: [] as ProfileRow[], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((item) => [item.id, item]));

  const taskWithUsers: TaskUserItem[] = taskUsers.map((item) => ({
    ...item,
    profile: profileMap.get(item.user_id) ?? null,
  }));

  const total = taskWithUsers.length;
  const pending = taskWithUsers.filter((item) => item.status === "pending").length;
  const inProgress = taskWithUsers.filter(
    (item) => item.status === "in_progress"
  ).length;
  const submitted = taskWithUsers.filter((item) => item.status === "submitted").length;
  const selesai = taskWithUsers.filter((item) => item.status === "selesai").length;

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <div>
          <Link
            href="/admin/tugas"
            className="inline-flex h-9 items-center justify-center rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            ← Kembali ke Tugas
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Judul
                  </p>
                  <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                    {taskRow.title}
                  </h1>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                    taskRow.target_type === "all"
                      ? "bg-violet-500/10 text-violet-600"
                      : taskRow.target_type === "division"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {getTargetLabel(taskRow.target_type)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="mt-1 text-sm font-medium">
                    {getTargetLabel(taskRow.target_type)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Divisi</p>
                  <p className="mt-1 text-sm font-medium">
                    {taskRow.target_division ?? "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDate(taskRow.due_date)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Dibuat</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDateTime(taskRow.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-muted/30 p-4 sm:p-5">
                <p className="text-sm font-medium">Deskripsi</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {taskRow.description ?? "-"}
                </p>
              </div>
            </section>

            <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Peserta Target</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Status tugas peserta yang menerima tugas ini.
                  </p>
                </div>

                <div className="inline-flex w-fit rounded-2xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  {total} peserta
                </div>
              </div>

              {/* Desktop Table */}
              <div className="mt-5 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[960px]">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4 font-semibold">Nama</th>
                      <th className="pb-3 pr-4 font-semibold">Username</th>
                      <th className="pb-3 pr-4 font-semibold">Divisi</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 pr-4 font-semibold">Submit</th>
                      <th className="pb-3 pr-4 font-semibold">Catatan</th>
                      <th className="pb-3 pr-4 font-semibold">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {taskWithUsers.length > 0 ? (
                      taskWithUsers.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/20 transition-colors last:border-b-0 hover:bg-muted/20"
                        >
                          <td className="py-4 pr-4 text-sm font-medium">
                            {item.profile?.nama ?? "-"}
                          </td>

                          <td className="py-4 pr-4 text-sm text-muted-foreground">
                            {item.profile?.username ?? "-"}
                          </td>

                          <td className="py-4 pr-4 text-sm text-muted-foreground">
                            {item.profile?.division ?? "-"}
                          </td>

                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                                item.status
                              )}`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-sm text-muted-foreground">
                            {formatDateTime(item.submitted_at)}
                          </td>

                          <td className="py-4 pr-4 text-sm text-muted-foreground">
                            <div className="max-w-[260px] whitespace-pre-line">
                              {item.submission_text ?? "-"}
                            </div>
                          </td>

                          <td className="py-4 pr-4">
                            {item.status === "submitted" ? (
                              <ApproveTugasButton
                                taskUserId={item.id}
                                taskId={taskRow.id}
                                role="admin"
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {getProgressLabel(item.status)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          Belum ada peserta target.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="mt-5 grid gap-3 lg:hidden">
                {taskWithUsers.length > 0 ? (
                  taskWithUsers.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">
                            {item.profile?.nama ?? "-"}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.profile?.username ?? "-"} •{" "}
                            {item.profile?.division ?? "-"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                          <span>Submit</span>
                          <span className="font-medium">
                            {formatDateTime(item.submitted_at)}
                          </span>
                        </div>

                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Catatan
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                            {item.submission_text ?? "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        {item.status === "submitted" ? (
                          <ApproveTugasButton
                            taskUserId={item.id}
                            taskId={taskRow.id}
                            role="admin"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {getProgressLabel(item.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Belum ada peserta target.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold">Ringkasan Tugas</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span className="text-muted-foreground">Total Peserta</span>
                  <span className="font-medium">{total}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span className="text-muted-foreground">Belum Mulai</span>
                  <span className="font-medium">{pending}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span className="text-muted-foreground">Sedang Dikerjakan</span>
                  <span className="font-medium">{inProgress}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span className="text-muted-foreground">Sudah Dikirim</span>
                  <span className="font-medium">{submitted}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span className="text-muted-foreground">Selesai</span>
                  <span className="font-medium">{selesai}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold">Catatan</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Halaman ini dipakai untuk monitoring tugas. Status yang paling penting:
                pending, in_progress, submitted, lalu selesai.
              </p>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}