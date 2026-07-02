import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Users2,
  CheckCircle2,
  Layers3,
  Clock,
  Info,
} from "lucide-react";

import { getTLScope } from "@/lib/auth/get-tl-scope";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
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

function getTargetLabel(targetType: "all" | "division" | "individual") {
  if (targetType === "all") return "Semua Peserta";
  if (targetType === "division") return "Per Divisi";
  return "Individu";
}

function getStatusBadge(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "bg-[#0072CE]/15 text-[#0072CE] font-semibold";
  if (status === "submitted") return "bg-[#FFE600] text-[#003580] font-bold";
  if (status === "selesai") return "bg-emerald-500/15 text-emerald-700 font-semibold";
  return "bg-gray-100 text-gray-500 font-medium";
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

export default async function TLTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { division } = await getTLScope();
  const { id } = await params;
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("tugas")
    .select("id, title, description, target_type, target_division, due_date, created_at")
    .eq("id", id)
    .maybeSingle();

  if (taskError) throw new Error(taskError.message);
  if (!task) notFound();

  const taskRow = task as TaskRow;

  if (taskRow.target_type === "all") notFound();
  if (taskRow.target_type === "division" && taskRow.target_division !== division) notFound();

  const { data: taskUsersData, error: taskUsersError } = await supabase
    .from("tugas_user")
    .select("id, user_id, status, submitted_at, selesai_at, submission_text, created_at")
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
  const profileMap = new Map(profiles.map((item) => [item.id, item]));

  const taskWithUsers = taskUsers
    .map((item) => ({ ...item, profile: profileMap.get(item.user_id) ?? null }))
    .filter((item) => item.profile?.division === division);

  if (taskRow.target_type === "individual" && taskWithUsers.length === 0) notFound();

  const total = taskWithUsers.length;
  const pending = taskWithUsers.filter((i) => i.status === "pending").length;
  const inProgress = taskWithUsers.filter((i) => i.status === "in_progress").length;
  const submitted = taskWithUsers.filter((i) => i.status === "submitted").length;
  const selesai = taskWithUsers.filter((i) => i.status === "selesai").length;

  return (
    <DashboardLayout navigation={tlNavigation}>
      <div className="space-y-5">

        {/* ── Page Banner (Header Section) ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0072CE] px-6 py-5 shadow-md">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="inline-flex shrink-0 items-center rounded-full bg-[#FFE600] px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#003580] shadow-sm">
                Detail Tugas Divisi
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white/80">
              Monitoring progress dan pengumpulan tugas peserta divisi{" "}
              <span className="font-bold text-[#FFE600]">{division}</span>.
            </p>
          </div>
        </div>

        {/* ── Back Button ── */}
        <div>
          <Link
            href="/tl/tugas"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-[#0072CE]/25 bg-white px-4 text-sm font-semibold text-[#0072CE] transition-colors hover:bg-[#0072CE]/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-[#0072CE]/20 bg-white p-4 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#0072CE]" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/70">Total Peserta</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#003580]">{total}</h2>
                <p className="mt-1 text-[11px] text-gray-400">Terdaftar pada tugas</p>
              </div>
              <div className="rounded-xl bg-[#0072CE]/10 p-2.5 text-[#0072CE]">
                <Users2 className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#0072CE]/20 bg-white p-4 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#0072CE]/60" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/70">Sedang Dikerjakan</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#003580]">{inProgress}</h2>
                <p className="mt-1 text-[11px] text-gray-400">Progress berjalan</p>
              </div>
              <div className="rounded-xl bg-[#0072CE]/10 p-2.5 text-[#0072CE]">
                <Layers3 className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#FFE600]/40 bg-white p-4 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#FFE600]" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#003580]/60">Menunggu Approval</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#003580]">{submitted}</h2>
                <p className="mt-1 text-[11px] text-gray-400">Perlu ditinjau</p>
              </div>
              <div className="rounded-xl bg-[#FFE600]/20 p-2.5 text-[#003580]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-emerald-500" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Tugas Selesai</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#003580]">{selesai}</h2>
                <p className="mt-1 text-[11px] text-gray-400">Sudah dituntaskan</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Task Info Strip (white card, compact) ── */}
        <div className="overflow-hidden rounded-[20px] border border-[#0072CE]/15 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: title + desc */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#0072CE]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0072CE]">
                  {getTargetLabel(taskRow.target_type)}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-[#003580]">
                {taskRow.title}
              </h2>
              {taskRow.description && (
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-500">
                  {taskRow.description}
                </p>
              )}
            </div>

            {/* Right: meta pills */}
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:gap-2 sm:text-right">
              <div className="rounded-xl bg-[#0072CE]/5 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/60">Divisi</p>
                <p className="mt-0.5 text-sm font-bold text-[#0072CE]">{taskRow.target_division ?? division}</p>
              </div>
              <div className="rounded-xl bg-[#0072CE]/5 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/60">Deadline</p>
                <p className="mt-0.5 text-sm font-semibold text-[#003580]">{formatDate(taskRow.due_date)}</p>
              </div>
              <div className="rounded-xl bg-[#0072CE]/5 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/60">Dibuat</p>
                <p className="mt-0.5 text-sm font-semibold text-[#003580]">{formatDateTime(taskRow.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ringkasan Progress + Info — horizontal strip ── */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Ringkasan Progress */}
          <div className="overflow-hidden rounded-[20px] border border-[#0072CE]/15 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-[#0072CE] px-5 py-3.5">
              <ClipboardList className="h-4 w-4 text-[#FFE600]" />
              <h2 className="text-sm font-bold text-white">Ringkasan Progress</h2>
            </div>
            <div className="grid grid-cols-5 divide-x divide-[#0072CE]/10 px-0 py-0">
              {[
                { label: "Total", value: total, accent: false },
                { label: "Belum Mulai", value: pending, accent: false },
                { label: "Dikerjakan", value: inProgress, accent: false },
                { label: "Menunggu", value: submitted, accent: true },
                { label: "Selesai", value: selesai, accent: false },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex flex-col items-center justify-center py-4 text-center ${
                    row.accent ? "bg-[#FFE600]/10" : ""
                  }`}
                >
                  <span
                    className={`text-2xl font-extrabold ${
                      row.accent ? "text-[#003580]" : "text-[#0072CE]"
                    }`}
                  >
                    {row.value}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold text-gray-400 leading-tight">
                    {row.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Informasi */}
          <div className="overflow-hidden rounded-[20px] border border-[#0072CE]/15 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-[#FFE600] px-5 py-3.5">
              <Info className="h-4 w-4 text-[#003580]" />
              <h2 className="text-sm font-bold text-[#003580]">Informasi</h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-gray-500">
                Team Leader hanya dapat memonitor peserta sesuai divisinya.
                Approval tugas dapat dilakukan saat peserta sudah melakukan
                submit pekerjaan.
              </p>
            </div>
          </div>
        </div>

        {/* ── Progress Table ── */}
        <div className="overflow-hidden rounded-[20px] border border-[#0072CE]/15 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#0072CE]/10 bg-[#0072CE]/5 px-5 py-4">
            <div className="rounded-xl bg-[#0072CE]/10 p-2 text-[#0072CE]">
              <Users2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#003580]">Progress Peserta</h2>
              <p className="text-xs text-gray-400">Monitoring tugas peserta divisi {division}.</p>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#0072CE]/10 bg-[#0072CE]/5 text-left text-[11px] font-bold uppercase tracking-widest text-[#0072CE]">
                  <th className="px-5 py-3.5">Nama</th>
                  <th className="px-4 py-3.5">Username</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Submit</th>
                  <th className="px-4 py-3.5">Catatan</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0072CE]/8">
                {taskWithUsers.length > 0 ? (
                  taskWithUsers.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-[#0072CE]/5">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#003580]">{item.profile?.nama ?? "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{item.profile?.username ?? "-"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs ${getStatusBadge(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDateTime(item.submitted_at)}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="max-w-[240px] whitespace-pre-line line-clamp-3">
                          {item.submission_text ?? "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.status === "submitted" ? (
                          <ApproveTugasButton taskUserId={item.id} taskId={taskRow.id} role="tl" />
                        ) : (
                          <span className="text-xs text-gray-400">{getProgressLabel(item.status)}</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      Belum ada peserta target.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 p-4 lg:hidden">
            {taskWithUsers.length > 0 ? (
              taskWithUsers.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-[#0072CE]/15 bg-white shadow-sm">
                  <div className="h-1 w-full bg-[#0072CE]" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#003580]">{item.profile?.nama ?? "-"}</h3>
                        <p className="text-sm text-gray-400">{item.profile?.username ?? "-"}</p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#0072CE]/5 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#0072CE]/70">Waktu Submit</p>
                        <p className="mt-1 text-sm font-medium text-[#003580]">{formatDateTime(item.submitted_at)}</p>
                      </div>
                      <div className="rounded-xl bg-[#0072CE]/5 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#0072CE]/70">Catatan</p>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.submission_text ?? "-"}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      {item.status === "submitted" ? (
                        <ApproveTugasButton taskUserId={item.id} taskId={taskRow.id} role="tl" />
                      ) : (
                        <span className="text-xs text-gray-400">{getProgressLabel(item.status)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#0072CE]/20 bg-[#0072CE]/5 py-12 text-center text-sm text-[#0072CE]/60">
                Belum ada peserta target.
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
