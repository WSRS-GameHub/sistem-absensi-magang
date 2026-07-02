import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { pesertaNavigation } from "@/constants/navigation";
import { TaskDetailClient } from "@/components/peserta/task-detail-client";

// Timezone acuan untuk seluruh format tanggal di halaman ini.
const TIMEZONE = "Asia/Jakarta";

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
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

function compactTargetLabel(task: TaskRow) {
  if (task.target_type === "all") return "Semua Peserta";
  if (task.target_type === "division")
    return `Divisi ${task.target_division ?? "-"}`;
  return "Individu";
}

function getStatusBadgeClass(status: TaskUserRow["status"]) {
  if (status === "in_progress")
    return "bg-blue-100 text-blue-700 border border-blue-200";
  if (status === "submitted")
    return "bg-violet-100 text-violet-700 border border-violet-200";
  if (status === "selesai")
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  return "bg-amber-100 text-amber-700 border border-amber-200";
}

function getStatusLabel(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "Sedang Dikerjakan";
  if (status === "submitted") return "Sudah Dikirim";
  if (status === "selesai") return "Selesai";
  return "Belum Dimulai";
}

/* ── Info box: biru gelap (Target) ── */
function InfoBoxBlue({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#003B6F] p-4">
      {/* dekoratif lingkaran */}
      <div className="pointer-events-none absolute -right-3 -bottom-3 h-14 w-14 rounded-full bg-white/10" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</p>
      <p className="mt-1.5 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

/* ── Info box: kuning (Deadline) ── */
function InfoBoxYellow({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#FFD600] p-4">
      <div className="pointer-events-none absolute -right-3 -bottom-3 h-14 w-14 rounded-full bg-white/20" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#003B6F]/60">{label}</p>
      <p className="mt-1.5 text-sm font-bold text-[#003B6F]">{value}</p>
    </div>
  );
}

/* ── Status box ── */
function StatusBox({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "blue" | "yellow";
}) {
  const cls =
    variant === "blue"
      ? "bg-blue-50 border border-blue-100 text-[#003B6F]"
      : "bg-[#FFFDE7] border border-yellow-200 text-[#003B6F]";
  const labelCls =
    variant === "blue" ? "text-blue-400" : "text-amber-500";

  return (
    <div className={`rounded-2xl p-3 text-center ${cls}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${labelCls}`}>{label}</p>
      <p className="mt-1 text-xs font-bold">{value}</p>
    </div>
  );
}

const backLink = (
  <Link
    href="/peserta/tugas"
    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#003B6F] shadow-sm transition-colors hover:bg-blue-50"
  >
    ← Kembali ke Tugas
  </Link>
);

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
          <div className="rounded-[22px] border border-red-100 bg-red-50/60 p-4 text-sm text-red-600 shadow-sm sm:p-5">
            Gagal memuat data tugas_user: {taskUserError.message}
          </div>
          <div>{backLink}</div>
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
          <div className="rounded-[22px] border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-700 shadow-sm sm:p-5">
            Belum ada data <span className="font-semibold">tugas_user</span>{" "}
            untuk tugas ini. Kemungkinan relasi{" "}
            <span className="font-semibold">tugas_id</span> dan{" "}
            <span className="font-semibold">user_id</span> belum cocok.
          </div>
          <div>{backLink}</div>
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
          <div className="rounded-[22px] border border-red-100 bg-red-50/60 p-4 text-sm text-red-600 shadow-sm sm:p-5">
            Gagal memuat data tugas: {taskError.message}
          </div>
          <div>{backLink}</div>
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
          <div className="rounded-[22px] border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-700 shadow-sm sm:p-5">
            Tugas dengan id{" "}
            <span className="font-semibold">{id}</span> tidak ditemukan.
          </div>
          <div>{backLink}</div>
        </div>
      </DashboardLayout>
    );
  }

  const taskRow = task as TaskRow;
  const taskUserRow = taskUser as TaskUserRow;

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">

        {/* ── Hero Banner PLN ── */}
        <section className="relative overflow-hidden rounded-[22px] bg-[#003B6F] p-5 shadow-sm sm:p-6">
          {/* dekoratif lingkaran kuning */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[#FFD600]/10" />
          <div className="pointer-events-none absolute right-16 -bottom-12 h-32 w-32 rounded-full bg-[#FFD600]/5" />

          <div className="relative flex flex-col gap-2">
            {/* badge kuning */}
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFD600] px-3 py-1 text-xs font-bold tracking-wide text-[#003B6F]">
              Detail Tugas
            </div>
            <p className="text-sm text-blue-100 sm:text-[15px]">
              Pantau seluruh tugasmu dan progres pengerjaannya di satu tempat.
            </p>
          </div>
        </section>

        <div>{backLink}</div>

        {/* ── Main Card ── */}
        <section className="rounded-[22px] border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5">

            {/* Judul + status badge */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1E88E5]">
                  Judul Tugas
                </p>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                    taskUserRow.status
                  )}`}
                >
                  {getStatusLabel(taskUserRow.status)}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#003B6F] sm:text-2xl">
                {taskRow.title}
              </h2>
            </div>

            {/* Target (biru) + Deadline (kuning) */}
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBoxBlue
                label="Target"
                value={compactTargetLabel(taskRow)}
                icon="users"
              />
              <InfoBoxYellow
                label="Deadline"
                value={formatDate(taskRow.due_date)}
              />
            </div>

            {/* Deskripsi */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
              <p className="mb-2 text-sm font-bold text-[#003B6F]">Deskripsi</p>
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {taskRow.description ?? "Belum ada deskripsi untuk tugas ini."}
              </p>
            </div>

            {/* Status 3-grid: biru / kuning / biru */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusBox
                label="Status"
                value={getStatusLabel(taskUserRow.status)}
                variant="blue"
              />
              <StatusBox
                label="Dikirim"
                value={formatDate(taskUserRow.submitted_at)}
                variant="yellow"
              />
              <StatusBox
                label="Selesai"
                value={formatDate(taskUserRow.selesai_at)}
                variant="blue"
              />
            </div>

            <hr className="border-blue-100" />

            <TaskDetailClient
              taskId={taskRow.id}
              taskTitle={taskRow.title}
              status={taskUserRow.status}
              dueDate={taskRow.due_date}
              submittedAt={taskUserRow.submitted_at}
              selesaiAt={taskUserRow.selesai_at}
              submissionText={taskUserRow.submission_text}
            />
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
