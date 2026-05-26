import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { pesertaNavigation } from "@/constants/navigation";
import { TaskDetailClient } from "@/components/peserta/task-detail-client";

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
  status: "pending" | "in_progress" | "submitted" | "selesai";
  submitted_at: string | null;
  selesai_at: string | null;
  submission_text: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function compactTargetLabel(task: TaskRow) {
  if (task.target_type === "all") return "Semua Peserta";
  if (task.target_type === "division")
    return `Divisi ${task.target_division ?? "-"}`;
  return "Individu";
}

export default async function PesertaTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["peserta"]);
  const { id } = await params;

  const userSupabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: taskUser, error: taskUserError } = await userSupabase
    .from("tugas_user")
    .select("id, status, submitted_at, selesai_at, submission_text")
    .eq("tugas_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskUserError) {
    return (
      <DashboardLayout navigation={pesertaNavigation}>
        <div className="space-y-4 sm:space-y-5">
          <DashboardPageHeader
            title="Detail Tugas"
            description="Terjadi masalah saat memuat data tugas."
          />

          <div className="rounded-[22px] border bg-card p-4 text-sm text-muted-foreground shadow-sm sm:p-5">
            Error tugas_user: {taskUserError.message}
          </div>

          <div>
            <Link
              href="/peserta/tugas"
              className="inline-flex h-9 items-center justify-center rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              ← Kembali ke Tugas
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!taskUser) {
    return (
      <DashboardLayout navigation={pesertaNavigation}>
        <div className="space-y-4 sm:space-y-5">
          <DashboardPageHeader
            title="Detail Tugas"
            description="Data tugas peserta tidak ditemukan."
          />

          <div className="rounded-[22px] border bg-card p-4 text-sm text-muted-foreground shadow-sm sm:p-5">
            Tidak ada data <span className="font-medium">tugas_user</span> untuk
            tugas ini. Berarti relasi <span className="font-medium">tugas_id</span>{" "}
            dan <span className="font-medium">user_id</span> belum cocok.
          </div>

          <div>
            <Link
              href="/peserta/tugas"
              className="inline-flex h-9 items-center justify-center rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              ← Kembali ke Tugas
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { data: task, error: taskError } = await adminSupabase
    .from("tugas")
    .select(
      "id, title, description, target_type, target_division, due_date, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (taskError) {
    return (
      <DashboardLayout navigation={pesertaNavigation}>
        <div className="space-y-4 sm:space-y-5">
          <DashboardPageHeader
            title="Detail Tugas"
            description="Terjadi masalah saat memuat data tugas."
          />

          <div className="rounded-[22px] border bg-card p-4 text-sm text-muted-foreground shadow-sm sm:p-5">
            Error tugas: {taskError.message}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout navigation={pesertaNavigation}>
        <div className="space-y-4 sm:space-y-5">
          <DashboardPageHeader
            title="Detail Tugas"
            description="Data tugas tidak ditemukan."
          />

          <div className="rounded-[22px] border bg-card p-4 text-sm text-muted-foreground shadow-sm sm:p-5">
            Baris <span className="font-medium">tugas</span> dengan id{" "}
            <span className="font-medium">{id}</span> tidak ditemukan.
          </div>

          <div>
            <Link
              href="/peserta/tugas"
              className="inline-flex h-9 items-center justify-center rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              ← Kembali ke Tugas
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const taskRow = task as TaskRow;
  const taskUserRow = taskUser as TaskUserRow;

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <DashboardPageHeader
          title="Detail Tugas"
          description="Kerjakan, submit, dan pantau status tugas kamu."
        />

        <div>
          <Link
            href="/peserta/tugas"
            className="inline-flex h-9 items-center justify-center rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            ← Kembali ke Tugas
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Judul Tugas
                </p>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {taskRow.title}
                </h1>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/40 p-3.5 sm:p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Target
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {compactTargetLabel(taskRow)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3.5 sm:p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Deadline
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDate(taskRow.due_date)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/30 p-4 sm:p-5">
                <p className="text-sm font-medium">Deskripsi</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {taskRow.description ?? "-"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-background p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {taskUserRow.status === "in_progress"
                      ? "Sedang Dikerjakan"
                      : taskUserRow.status === "submitted"
                        ? "Sudah Dikirim"
                        : taskUserRow.status === "selesai"
                          ? "Selesai"
                          : "Belum Dimulai"}
                  </p>
                </div>

                <div className="rounded-2xl border bg-background p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Dikirim
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDate(taskUserRow.submitted_at)}
                  </p>
                </div>

                <div className="rounded-2xl border bg-background p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Selesai
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDate(taskUserRow.selesai_at)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <TaskDetailClient
              taskId={taskRow.id}
              taskTitle={taskRow.title}
              status={taskUserRow.status}
              dueDate={taskRow.due_date}
              submittedAt={taskUserRow.submitted_at}
              selesaiAt={taskUserRow.selesai_at}
              submissionText={taskUserRow.submission_text}
            />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}