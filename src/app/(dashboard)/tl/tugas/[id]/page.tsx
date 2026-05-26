import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Users2,
} from "lucide-react";

import { getTLScope } from "@/lib/auth/get-tl-scope";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { tlNavigation } from "@/constants/navigation";

import { ApproveTugasButton } from "@/components/tasks/approve-tugas-button";

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
  id: string;
  user_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
  submitted_at: string | null;
  selesai_at: string | null;
  submission_text: string | null;
  submission_file_url: string | null;
  created_at: string;
  profile?: ProfileRow | null;
};

type ProfileRow = {
  id: string;
  nama: string;
  username: string;
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

function getTargetLabel(
  targetType: "all" | "division" | "individual"
) {
  if (targetType === "all") return "Semua Peserta";
  if (targetType === "division") return "Per Divisi";

  return "Individu";
}

function getStatusBadge(
  status: TaskUserRow["status"]
) {
  if (status === "in_progress")
    return "bg-blue-500/10 text-blue-600";

  if (status === "submitted")
    return "bg-violet-500/10 text-violet-600";

  if (status === "selesai")
    return "bg-emerald-500/10 text-emerald-600";

  return "bg-amber-500/10 text-amber-600";
}

function getStatusLabel(
  status: TaskUserRow["status"]
) {
  if (status === "in_progress")
    return "Sedang Dikerjakan";

  if (status === "submitted")
    return "Sudah Dikirim";

  if (status === "selesai") return "Selesai";

  return "Belum Dimulai";
}

function getProgressLabel(
  status: TaskUserRow["status"]
) {
  if (status === "pending")
    return "Belum mulai";

  if (status === "in_progress")
    return "Sedang berjalan";

  if (status === "submitted")
    return "Menunggu approval";

  return "Tuntas";
}

export default async function TLTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { division } = await getTLScope();

  const { id } = await params;

  const supabase = await createClient();

  const { data: task, error: taskError } =
    await supabase
      .from("tugas")
      .select(
        "id, title, description, target_type, target_division, due_date, created_at"
      )
      .eq("id", id)
      .maybeSingle();

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (!task) {
    notFound();
  }

  const taskRow = task as TaskRow;

  if (taskRow.target_type === "all") {
    notFound();
  }

  if (
    taskRow.target_type === "division" &&
    taskRow.target_division !== division
  ) {
    notFound();
  }

  const {
    data: taskUsersData,
    error: taskUsersError,
  } = await supabase
    .from("tugas_user")
    .select(
      "id, user_id, status, submitted_at, selesai_at, submission_text, submission_file_url, created_at"
    )
    .eq("tugas_id", taskRow.id)
    .order("created_at", { ascending: true });

  if (taskUsersError) {
    throw new Error(taskUsersError.message);
  }

  const taskUsers = (taskUsersData ??
    []) as TaskUserRow[];

  const userIds = taskUsers.map(
    (item) => item.user_id
  );

  const {
    data: profilesData,
    error: profilesError,
  } = userIds.length
    ? await supabase
        .from("profiles")
        .select(
          "id, nama, username, division"
        )
        .in("id", userIds)
    : {
        data: [] as ProfileRow[],
        error: null,
      };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profiles = (profilesData ??
    []) as ProfileRow[];

  const profileMap = new Map(
    profiles.map((item) => [item.id, item])
  );

  const taskWithUsers = taskUsers
    .map((item) => ({
      ...item,
      profile:
        profileMap.get(item.user_id) ??
        null,
    }))
    .filter(
      (item) =>
        item.profile?.division === division
    );

  if (
    taskRow.target_type === "individual" &&
    taskWithUsers.length === 0
  ) {
    notFound();
  }

  const total = taskWithUsers.length;

  const pending = taskWithUsers.filter(
    (item) => item.status === "pending"
  ).length;

  const inProgress = taskWithUsers.filter(
    (item) =>
      item.status === "in_progress"
  ).length;

  const submitted = taskWithUsers.filter(
    (item) =>
      item.status === "submitted"
  ).length;

  const selesai = taskWithUsers.filter(
    (item) => item.status === "selesai"
  ).length;

  return (
    <DashboardLayout navigation={tlNavigation}>
      <DashboardPageHeader
        title="Detail Tugas Divisi"
        description={`Monitoring progress dan pengumpulan tugas peserta divisi ${division}.`}
      />

      <div className="space-y-5">
        {/* Back */}
        <div>
          <Link
            href="/tl/tugas"
            className="inline-flex h-10 items-center gap-2 rounded-2xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </div>

        {/* Top Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Total Peserta
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              {total}
            </h2>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Sedang Dikerjakan
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-blue-600">
              {inProgress}
            </h2>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Menunggu Approval
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-violet-600">
              {submitted}
            </h2>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Tugas Selesai
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">
              {selesai}
            </h2>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          {/* Main */}
          <div className="space-y-5">
            {/* Task Detail */}
            <div className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {getTargetLabel(
                      taskRow.target_type
                    )}
                  </div>

                  <h1 className="mt-4 text-2xl font-bold tracking-tight">
                    {taskRow.title}
                  </h1>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {taskRow.description ??
                      "Tidak ada deskripsi."}
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Divisi
                      </p>

                      <p className="mt-1 font-medium">
                        {taskRow.target_division ??
                          division}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Deadline
                      </p>

                      <p className="mt-1 font-medium">
                        {formatDate(
                          taskRow.due_date
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Dibuat
                      </p>

                      <p className="mt-1 font-medium">
                        {formatDateTime(
                          taskRow.created_at
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-[28px] border bg-card shadow-sm lg:block">
              <div className="border-b border-border/40 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-primary" />

                  <div>
                    <h2 className="font-semibold">
                      Progress Peserta
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      Monitoring tugas peserta
                      divisi {division}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4 font-semibold">
                        Nama
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Username
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Submit
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Catatan
                      </th>

                      <th className="px-4 py-4 font-semibold text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/20">
                    {taskWithUsers.length > 0 ? (
                      taskWithUsers.map(
                        (item) => (
                          <tr
                            key={item.id}
                            className="transition-colors hover:bg-muted/20"
                          >
                            <td className="px-6 py-5">
                              <div className="font-medium">
                                {item.profile
                                  ?.nama ?? "-"}
                              </div>
                            </td>

                            <td className="px-4 py-5 text-sm text-muted-foreground">
                              {item.profile
                                ?.username ??
                                "-"}
                            </td>

                            <td className="px-4 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                                  item.status
                                )}`}
                              >
                                {getStatusLabel(
                                  item.status
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-5 text-sm">
                              {formatDateTime(
                                item.submitted_at
                              )}
                            </td>

                            <td className="px-4 py-5 text-sm text-muted-foreground">
                              <div className="max-w-[260px] whitespace-pre-line line-clamp-3">
                                {item.submission_text ??
                                  "-"}
                              </div>
                            </td>

                            <td className="px-4 py-5 text-right">
                              {item.status ===
                              "submitted" ? (
                                <ApproveTugasButton
                                  taskUserId={
                                    item.id
                                  }
                                  taskId={
                                    taskRow.id
                                  }
                                  role="tl"
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {getProgressLabel(
                                    item.status
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-14 text-center text-sm text-muted-foreground"
                        >
                          Belum ada peserta
                          target.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 lg:hidden">
              {taskWithUsers.length > 0 ? (
                taskWithUsers.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {item.profile?.nama ??
                            "-"}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {item.profile
                            ?.username ?? "-"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(
                          item.status
                        )}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Waktu Submit
                        </p>

                        <p className="mt-1">
                          {formatDateTime(
                            item.submitted_at
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Catatan
                        </p>

                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {item.submission_text ??
                            "-"}
                        </p>
                      </div>

                      {item.submission_file_url ? (
                        <a
                          href={
                            item.submission_file_url
                          }
                          target="_blank"
                          className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          Lihat File
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      {item.status ===
                      "submitted" ? (
                        <ApproveTugasButton
                          taskUserId={item.id}
                          taskId={taskRow.id}
                          role="tl"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {getProgressLabel(
                            item.status
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed bg-card py-14 text-center text-sm text-muted-foreground">
                  Belum ada peserta target.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="rounded-[28px] border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />

                <h2 className="font-semibold">
                  Ringkasan Progress
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Total Peserta
                  </span>

                  <span className="font-semibold">
                    {total}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Belum Mulai
                  </span>

                  <span className="font-semibold">
                    {pending}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Dikerjakan
                  </span>

                  <span className="font-semibold">
                    {inProgress}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Menunggu Review
                  </span>

                  <span className="font-semibold">
                    {submitted}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Selesai
                  </span>

                  <span className="font-semibold">
                    {selesai}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">
                Informasi
              </h2>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Team Leader hanya dapat
                memonitor peserta sesuai
                divisinya. Approval tugas dapat
                dilakukan saat peserta sudah
                melakukan submit pekerjaan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}