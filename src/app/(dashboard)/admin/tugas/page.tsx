import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
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

type TargetType = "all" | "division" | "individual";

function getTargetLabel(targetType: TargetType) {
  if (targetType === "all") return "Semua Peserta";
  if (targetType === "division") return "Per Divisi";
  return "Individu";
}

const targetStyles: Record<TargetType, { pill: string; dot: string }> = {
  all: {
    pill: "bg-violet-50 text-violet-800 border border-violet-200",
    dot: "bg-violet-500",
  },
  division: {
    pill: "bg-blue-50 text-blue-800 border border-blue-200",
    dot: "bg-blue-600",
  },
  individual: {
    pill: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
  },
};

type DivisionKey = "PA" | "TE" | "TEKNIK";

const divisionStyles: Record<DivisionKey, { pill: string; dot: string }> = {
  PA: {
    pill: "bg-blue-50 text-blue-800 border border-blue-200",
    dot: "bg-blue-600",
  },
  TE: {
    pill: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  TEKNIK: {
    pill: "bg-violet-50 text-violet-800 border border-violet-200",
    dot: "bg-violet-500",
  },
};

export default async function AdminTugasPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: tasksData } = await supabase
    .from("tugas")
    .select("id, title, description, target_type, target_division, due_date, created_at")
    .order("created_at", { ascending: false });

  const tasks = (tasksData ?? []) as TaskRow[];

  const { data: participantsData } = await supabase
    .from("profiles")
    .select("id, nama, username, division")
    .eq("role", "peserta")
    .eq("is_active", true)
    .order("nama", { ascending: true });

  const participants = (participantsData ?? []) as TaskTargetUser[];

  // Stats
  const totalTugas = tasks.length;
  const tugasSemua = tasks.filter((t) => t.target_type === "all").length;
  const tugasDivisi = tasks.filter((t) => t.target_type === "division").length;
  const tugasIndividu = tasks.filter((t) => t.target_type === "individual").length;

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4">

        {/* ── HERO ── */}
        <section
          className="flex items-center justify-between rounded-[20px] px-5 py-4"
          style={{ background: "#0072CE" }}
        >
          <div>
            <span
              className="mb-2 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "#FFE600", color: "#5C4A00" }}
            >
              Data Tugas
            </span>
            <h1 className="text-lg font-bold text-white">Daftar Tugas Peserta</h1>
            <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
              Buat tugas untuk semua peserta, divisi, atau individu.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <CreateTugasDialog participants={participants} />
            </div>
            <div
              className="flex items-center justify-center rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#FFE600" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </section>

        {/* Mobile create button */}
        <div className="sm:hidden">
          <CreateTugasDialog participants={participants} />
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#0072CE" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>Total Tugas</p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{totalTugas}</span>
          </div>
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#8B5CF6" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>Semua Peserta</p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{tugasSemua}</span>
          </div>
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#3B82F6" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>Per Divisi</p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{tugasDivisi}</span>
          </div>
          <div className="rounded-2xl border-l-[3px] bg-white p-3.5 shadow-sm" style={{ borderLeftColor: "#10B981" }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#3D5166" }}>Individu</p>
            <span className="text-xl font-bold" style={{ color: "#0F1D2A" }}>{tugasIndividu}</span>
          </div>
        </div>

        {/* ── TABLE (Desktop) ── */}
        <section className="hidden overflow-hidden rounded-[20px] bg-white shadow-sm lg:block">
          {/* Toolbar */}
          <div
            className="flex items-center justify-between border-b px-5 py-3.5"
            style={{ borderColor: "#EBF4FF" }}
          >
            <div className="flex items-center gap-2">
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="#0072CE" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-sm font-bold" style={{ color: "#0F1D2A" }}>Tabel Tugas</h3>
            </div>
            <span
              className="rounded-full px-3 py-0.5 text-[11px] font-bold"
              style={{ background: "#E6F3FF", color: "#0072CE" }}
            >
              {tasks.length} tugas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr style={{ background: "#EEF6FF" }}>
                  {["Judul", "Deskripsi", "Target", "Divisi", "Deadline", "Dibuat", "Aksi"].map((h) => (
                    <th
                      key={h}
                      className={`border-b px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${h === "Aksi" ? "text-right" : "text-left"}`}
                      style={{ borderColor: "#CCE4F7", color: "#7A94A8" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const tStyle = targetStyles[task.target_type];
                    const dStyle = task.target_division
                      ? divisionStyles[task.target_division]
                      : null;

                    return (
                      <tr
                        key={task.id}
                        className="border-b transition-colors hover:bg-[#F4F9FF]"
                        style={{ borderColor: "#EEF6FF" }}
                      >
                        {/* Judul */}
                        <td className="px-3.5 py-3 align-top">
                          <span className="text-[13px] font-bold" style={{ color: "#0F1D2A" }}>
                            {task.title}
                          </span>
                        </td>

                        {/* Deskripsi */}
                        <td className="px-3.5 py-3 align-top">
                          <p
                            className="line-clamp-2 max-w-[300px] text-xs leading-relaxed"
                            style={{ color: "#3D5166" }}
                          >
                            {task.description ?? "-"}
                          </p>
                        </td>

                        {/* Target */}
                        <td className="px-3.5 py-3 align-top">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tStyle.pill}`}>
                            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${tStyle.dot}`} />
                            {getTargetLabel(task.target_type)}
                          </span>
                        </td>

                        {/* Divisi */}
                        <td className="px-3.5 py-3 align-top">
                          {task.target_division && dStyle ? (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${dStyle.pill}`}>
                              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dStyle.dot}`} />
                              {task.target_division}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "#7A94A8" }}>–</span>
                          )}
                        </td>

                        {/* Deadline */}
                        <td className="px-3.5 py-3 align-top">
                          <span className="text-[12.5px] font-semibold" style={{ color: "#1A2E40" }}>
                            {formatDate(task.due_date)}
                          </span>
                        </td>

                        {/* Dibuat */}
                        <td className="px-3.5 py-3 align-top">
                          <span className="text-xs" style={{ color: "#7A94A8" }}>
                            {formatDate(task.created_at)}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-3.5 py-3 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/tugas/${task.id}`}
                              className="inline-flex h-8 items-center justify-center rounded-[10px] border px-3 text-xs font-semibold transition-colors hover:bg-[#F4F9FF]"
                              style={{ borderColor: "#CCE4F7", color: "#0072CE", background: "#E6F3FF" }}
                            >
                              Detail
                            </Link>
                            <EditTugasDialog task={task} />
                            <DeleteTugasDialog id={task.id} title={task.title} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 text-center text-sm"
                      style={{ color: "#7A94A8" }}
                    >
                      Belum ada tugas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {tasks.length > 0 && (
            <div className="border-t px-5 py-2.5" style={{ borderColor: "#EEF6FF" }}>
              <span className="text-[11px] font-medium" style={{ color: "#7A94A8" }}>
                Menampilkan {tasks.length} tugas
              </span>
            </div>
          )}
        </section>

        {/* ── MOBILE CARDS ── */}
        <section className="lg:hidden">
          {tasks.length > 0 ? (
            <div className="grid gap-3">
              {tasks.map((task) => {
                const tStyle = targetStyles[task.target_type];
                const dStyle = task.target_division
                  ? divisionStyles[task.target_division]
                  : null;

                return (
                  <div
                    key={task.id}
                    className="rounded-[20px] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Title + badge */}
                      <div className="flex flex-wrap items-start gap-2">
                        <h3 className="flex-1 text-sm font-bold" style={{ color: "#0F1D2A" }}>
                          {task.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tStyle.pill}`}>
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${tStyle.dot}`} />
                          {getTargetLabel(task.target_type)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "#3D5166" }}>
                        {task.description ?? "-"}
                      </p>

                      {/* Meta grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[12px] p-2.5" style={{ background: "#EEF6FF" }}>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7A94A8" }}>Divisi</p>
                          {task.target_division && dStyle ? (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${dStyle.pill}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${dStyle.dot}`} />
                              {task.target_division}
                            </span>
                          ) : (
                            <span className="text-xs font-medium" style={{ color: "#3D5166" }}>–</span>
                          )}
                        </div>
                        <div className="rounded-[12px] p-2.5" style={{ background: "#EEF6FF" }}>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7A94A8" }}>Deadline</p>
                          <p className="text-xs font-semibold" style={{ color: "#1A2E40" }}>
                            {formatDate(task.due_date)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex flex-wrap gap-2 border-t pt-3"
                        style={{ borderColor: "#EEF6FF" }}
                      >
                        <Link
                          href={`/admin/tugas/${task.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-[10px] border px-3 text-xs font-semibold transition-colors"
                          style={{ borderColor: "#CCE4F7", color: "#0072CE", background: "#E6F3FF" }}
                        >
                          Detail
                        </Link>
                        <EditTugasDialog task={task} />
                        <DeleteTugasDialog id={task.id} title={task.title} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-[20px] border-2 border-dashed p-12 text-center text-sm"
              style={{ borderColor: "#CCE4F7", color: "#7A94A8", background: "#F7FAFD" }}
            >
              Belum ada tugas.
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
