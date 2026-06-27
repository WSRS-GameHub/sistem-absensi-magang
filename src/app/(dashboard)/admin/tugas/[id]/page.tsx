import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
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

type TargetType = "all" | "division" | "individual";
type StatusType = "pending" | "in_progress" | "submitted" | "selesai";
type DivisionKey = "PA" | "TE" | "TEKNIK";

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

function getTargetLabel(t: TargetType) {
  if (t === "all") return "Semua Peserta";
  if (t === "division") return "Per Divisi";
  return "Individu";
}

function getStatusLabel(s: StatusType) {
  if (s === "in_progress") return "Sedang Dikerjakan";
  if (s === "submitted") return "Sudah Dikirim";
  if (s === "selesai") return "Selesai";
  return "Belum Dimulai";
}

function getProgressLabel(s: StatusType) {
  if (s === "pending") return "Belum mulai";
  if (s === "in_progress") return "Sedang berjalan";
  if (s === "submitted") return "Menunggu approval";
  return "Tuntas";
}

function getInitials(nama: string) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const targetStyles: Record<TargetType, { pill: string; dot: string }> = {
  all:        { pill: "bg-violet-50 text-violet-800 border border-violet-200", dot: "bg-violet-500" },
  division:   { pill: "bg-blue-50 text-blue-800 border border-blue-200",       dot: "bg-blue-600"   },
  individual: { pill: "bg-emerald-50 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500" },
};

const statusStyles: Record<StatusType, { pill: string; dot: string }> = {
  pending:     { pill: "bg-amber-50 text-amber-800 border border-amber-200",       dot: "bg-amber-500"   },
  in_progress: { pill: "bg-blue-50 text-blue-800 border border-blue-200",          dot: "bg-blue-600"    },
  submitted:   { pill: "bg-violet-50 text-violet-800 border border-violet-200",    dot: "bg-violet-500"  },
  selesai:     { pill: "bg-emerald-50 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500" },
};

const divisionStyles: Record<DivisionKey, { pill: string; dot: string; avatar: string }> = {
  PA:     { pill: "bg-blue-50 text-blue-800 border border-blue-200",          dot: "bg-blue-600",    avatar: "bg-blue-50 border-blue-200 text-blue-700"       },
  TE:     { pill: "bg-emerald-50 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500", avatar: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  TEKNIK: { pill: "bg-violet-50 text-violet-800 border border-violet-200",    dot: "bg-violet-500",  avatar: "bg-violet-50 border-violet-200 text-violet-700"  },
};

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
    .select("id, title, description, target_type, target_division, due_date, created_at, updated_at, created_by")
    .eq("id", id)
    .single();

  if (taskError || !task) notFound();

  const taskRow = task as TaskRow;

  const { data: taskUsersData, error: taskUsersError } = await supabase
    .from("tugas_user")
    .select("id, user_id, status, submitted_at, selesai_at, submission_text, submission_file_url, created_at")
    .eq("tugas_id", taskRow.id)
    .order("created_at", { ascending: true });

  if (taskUsersError) throw new Error(taskUsersError.message);

  const taskUsers = (taskUsersData ?? []) as TaskUserRow[];
  const userIds = taskUsers.map((item) => item.user_id);

  const { data: profilesData, error: profilesError } = userIds.length
    ? await supabase.from("profiles").select("id, nama, username, division").in("id", userIds)
    : { data: [] as ProfileRow[], error: null };

  if (profilesError) throw new Error(profilesError.message);

  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const taskWithUsers: TaskUserItem[] = taskUsers.map((item) => ({
    ...item,
    profile: profileMap.get(item.user_id) ?? null,
  }));

  const total     = taskWithUsers.length;
  const pending   = taskWithUsers.filter((i) => i.status === "pending").length;
  const inProgress = taskWithUsers.filter((i) => i.status === "in_progress").length;
  const submitted = taskWithUsers.filter((i) => i.status === "submitted").length;
  const selesai   = taskWithUsers.filter((i) => i.status === "selesai").length;

  const tStyle   = targetStyles[taskRow.target_type];
  const divStyle = taskRow.target_division ? divisionStyles[taskRow.target_division] : null;

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4">

        {/* ── TOMBOL KEMBALI ── */}
        <Link
          href="/admin/tugas"
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3.5 text-xs font-semibold transition-colors hover:bg-[#F4F9FF]"
          style={{ borderColor: "#CCE4F7", color: "#0072CE", background: "#E6F3FF" }}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Tugas
        </Link>

        {/* ── HERO INFO TUGAS ── */}
        <section className="overflow-hidden rounded-[20px] bg-white shadow-sm">
          {/* Header biru */}
          <div
            className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
            style={{ background: "#0072CE" }}
          >
            <div className="min-w-0">
              <span
                className="mb-2 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: "#FFE600", color: "#5C4A00" }}
              >
                Detail Tugas
              </span>
              <h1 className="text-lg font-bold leading-snug text-white">
                {taskRow.title}
              </h1>
            </div>
            <span className={`mt-1 inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tStyle.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tStyle.dot}`} />
              {getTargetLabel(taskRow.target_type)}
            </span>
          </div>

          {/* Meta grid 2x2 */}
          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4">
            <div className="rounded-[12px] p-3" style={{ background: "#EEF6FF" }}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7A94A8" }}>Target</p>
              <p className="text-sm font-semibold" style={{ color: "#0F1D2A" }}>{getTargetLabel(taskRow.target_type)}</p>
            </div>
            <div className="rounded-[12px] p-3" style={{ background: "#EEF6FF" }}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7A94A8" }}>Divisi</p>
              {taskRow.target_division && divStyle ? (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${divStyle.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${divStyle.dot}`} />
                  {taskRow.target_division}
                </span>
              ) : (
                <p className="text-sm font-semibold" style={{ color: "#0F1D2A" }}>–</p>
              )}
            </div>
            <div className="rounded-[12px] p-3" style={{ background: "#EEF6FF" }}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7A94A8" }}>Deadline</p>
              <p className="text-sm font-semibold" style={{ color: "#0F1D2A" }}>{formatDate(taskRow.due_date)}</p>
            </div>
            <div className="rounded-[12px] p-3" style={{ background: "#EEF6FF" }}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7A94A8" }}>Dibuat</p>
              <p className="text-sm font-semibold" style={{ color: "#0F1D2A" }}>{formatDate(taskRow.created_at)}</p>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="mx-4 mb-4 rounded-[12px] p-4" style={{ background: "#F7FAFD", border: "1.5px solid #CCE4F7" }}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7A94A8" }}>Deskripsi</p>
            <p className="whitespace-pre-line text-sm leading-7" style={{ color: "#3D5166" }}>
              {taskRow.description ?? "-"}
            </p>
          </div>
        </section>

        {/* ── RINGKASAN STAT ── */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            { label: "Total",       value: total,      borderColor: "#0072CE" },
            { label: "Belum Mulai", value: pending,    borderColor: "#F59E0B" },
            { label: "Dikerjakan",  value: inProgress, borderColor: "#3B82F6" },
            { label: "Dikirim",     value: submitted,  borderColor: "#8B5CF6" },
            { label: "Selesai",     value: selesai,    borderColor: "#10B981" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm"
              style={{ borderLeftColor: s.borderColor }}
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>{s.label}</p>
              <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── PESERTA TARGET — CARD LIST ── */}
        <section className="overflow-hidden rounded-[20px] bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#EBF4FF" }}>
            <div className="flex items-center gap-2">
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="#0072CE" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-sm font-bold" style={{ color: "#0F1D2A" }}>Peserta Target</h2>
            </div>
            <span
              className="rounded-full px-3 py-0.5 text-[11px] font-bold"
              style={{ background: "#E6F3FF", color: "#0072CE" }}
            >
              {total} peserta
            </span>
          </div>

          {/* Card list — no horizontal scroll */}
          <div className="divide-y" style={{ borderColor: "#EEF6FF" }}>
            {taskWithUsers.length > 0 ? (
              taskWithUsers.map((item) => {
                const dv      = item.profile?.division;
                const dvStyle = dv ? divisionStyles[dv] : null;
                const stStyle = statusStyles[item.status];

                return (
                  <div key={item.id} className="px-5 py-4 transition-colors hover:bg-[#F7FAFD]">
                    {/* Row utama: avatar + info + status */}
                    <div className="flex flex-wrap items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold uppercase ${dvStyle?.avatar ?? "bg-blue-50 border-blue-200 text-blue-700"}`}
                      >
                        {item.profile ? getInitials(item.profile.nama) : "?"}
                      </div>

                      {/* Nama + username */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: "#0F1D2A" }}>
                            {item.profile?.nama ?? "-"}
                          </span>
                          {dv && dvStyle && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${dvStyle.pill}`}>
                              <span className={`h-1 w-1 rounded-full ${dvStyle.dot}`} />
                              {dv}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px]" style={{ color: "#7A94A8" }}>
                          @{item.profile?.username ?? "-"}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${stStyle.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${stStyle.dot}`} />
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Meta baris kedua */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {/* Waktu submit */}
                      <div
                        className="flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-xs"
                        style={{ background: "#EEF6FF" }}
                      >
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#7A94A8" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span style={{ color: "#7A94A8" }}>Submit:</span>
                        <span className="font-semibold" style={{ color: "#1A2E40" }}>
                          {formatDateTime(item.submitted_at)}
                        </span>
                      </div>

                      {/* Catatan jika ada */}
                      {item.submission_text && (
                        <div
                          className="flex items-start gap-2 rounded-[10px] px-3 py-1.5 text-xs"
                          style={{ background: "#F7FAFD", border: "1.5px solid #CCE4F7" }}
                        >
                          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#7A94A8" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span className="whitespace-pre-line" style={{ color: "#3D5166" }}>
                            {item.submission_text}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Aksi */}
                    <div className="mt-3">
                      {item.status === "submitted" ? (
                        <ApproveTugasButton
                          taskUserId={item.id}
                          taskId={taskRow.id}
                          role="admin"
                        />
                      ) : (
                        <span className="text-xs" style={{ color: "#7A94A8" }}>
                          {getProgressLabel(item.status)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="m-4 rounded-[16px] border-2 border-dashed p-12 text-center text-sm"
                style={{ borderColor: "#CCE4F7", color: "#7A94A8", background: "#F7FAFD" }}
              >
                Belum ada peserta target.
              </div>
            )}
          </div>

          {taskWithUsers.length > 0 && (
            <div className="border-t px-5 py-2.5" style={{ borderColor: "#EEF6FF" }}>
              <span className="text-[11px] font-medium" style={{ color: "#7A94A8" }}>
                Menampilkan {taskWithUsers.length} peserta
              </span>
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
