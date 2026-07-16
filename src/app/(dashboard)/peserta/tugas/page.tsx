import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { pesertaNavigation } from "@/constants/navigation";
import { ExportTugasPdfButton } from "@/components/peserta/export-tugas-pdf-button";

type TaskUserRow = {
  id: string;
  tugas_id: string;
  status: "pending" | "in_progress" | "submitted" | "selesai";
  submitted_at: string | null;
  selesai_at: string | null;
  created_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  target_type: "all" | "division" | "individual";
  target_division: "PA" | "TE" | "TEKNIK" | null;
  due_date: string | null;
  created_at: string;
};

type TaskItem = TaskUserRow & {
  task: TaskRow | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateLong(value: string | null | undefined) {
  if (!value) return null;

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStatusBadge(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "bg-blue-100 text-blue-700";
  if (status === "submitted") return "bg-violet-100 text-violet-700";
  if (status === "selesai") return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
}

function getStatusDot(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "bg-blue-500";
  if (status === "submitted") return "bg-violet-500";
  if (status === "selesai") return "bg-emerald-500";
  return "bg-amber-500";
}

function getStatusLabel(status: TaskUserRow["status"]) {
  if (status === "in_progress") return "Sedang Dikerjakan";
  if (status === "submitted") return "Sudah Dikirim";
  if (status === "selesai") return "Selesai";
  return "Belum Dimulai";
}

function getTargetLabel(task: TaskRow | null) {
  if (!task) return "-";
  if (task.target_type === "all") return "Semua";
  if (task.target_type === "division") return `Divisi ${task.target_division ?? "-"}`;
  return "Individu";
}

export default async function PesertaTugasPage() {
  const user = await requireRole(["peserta"]);

  const userSupabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: profileData } = await userSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData ?? {}) as Record<string, unknown>;

  const { data: taskUsersData } = await userSupabase
    .from("tugas_user")
    .select("id, tugas_id, status, submitted_at, selesai_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const taskUsers = (taskUsersData ?? []) as TaskUserRow[];
  const taskIds = taskUsers.map((item) => item.tugas_id);

  const { data: tasksData } = taskIds.length
    ? await adminSupabase
        .from("tugas")
        .select(
          "id, title, description, target_type, target_division, due_date, created_at"
        )
        .in("id", taskIds)
    : { data: [] as TaskRow[] };

  const tasks = (tasksData ?? []) as TaskRow[];
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  const rows: TaskItem[] = taskUsers.map((item) => ({
    ...item,
    task: taskMap.get(item.tugas_id) ?? null,
  }));

  const total = rows.length;
  const pending = rows.filter((item) => item.status === "pending").length;
  const inProgress = rows.filter((item) => item.status === "in_progress").length;
  const submitted = rows.filter((item) => item.status === "submitted").length;
  const selesai = rows.filter((item) => item.status === "selesai").length;

  // Nama peserta untuk header laporan PDF — diambil dari tabel "profiles".
  // Coba beberapa kemungkinan nama kolom (full_name / nama), fallback ke email.
  const namaPeserta =
    (profile.full_name as string | undefined) ??
    (profile.nama as string | undefined) ??
    (user as { email?: string }).email ??
    "Peserta";

  // Data identitas tambahan untuk laporan (opsional).
  // Sesuaikan nama kolom jika berbeda di tabel profiles kamu.
  const nimPeserta =
    (profile.nim as string | undefined) ?? (profile.nim_mahasiswa as string | undefined);
  const jurusanPeserta =
    (profile.jurusan as string | undefined) ?? (profile.program_studi as string | undefined);

  // Unit/Bagian diambil dari kolom "division" di tabel profiles.
  const unitBagianPeserta = (profile.division as string | undefined) ?? undefined;

  // Periode magang diambil dari kolom "mulai_magang" dan "akhir_magang".
  const mulaiMagang = formatDateLong(profile.mulai_magang as string | undefined);
  const akhirMagang = formatDateLong(profile.akhir_magang as string | undefined);
  const periodeMagang =
    mulaiMagang && akhirMagang ? `${mulaiMagang} s/d ${akhirMagang}` : undefined;

  const exportRows = rows
    .slice()
    .sort((a, b) => {
      const da = a.task?.due_date ? new Date(a.task.due_date).getTime() : 0;
      const db = b.task?.due_date ? new Date(b.task.due_date).getTime() : 0;
      return da - db;
    })
    .map((item, idx) => {
      const judul = item.task?.title ?? "-";
      const deskripsi = item.task?.description;
      return {
        no: idx + 1,
        tanggal: formatDate(item.task?.due_date ?? null),
        uraian: deskripsi ? `${judul}\n${deskripsi}` : judul,
      };
    });

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">
        {/* Header banner — gradasi biru senada dengan dashboard utama */}
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-2">
            <div className="inline-flex w-fit items-center rounded-full bg-amber-300 px-3 py-1 text-xs font-bold tracking-wide text-blue-900">
              TUGAS PESERTA
            </div>
            <p className="text-sm text-blue-50 sm:text-[15px]">
              Pantau selalu tugasmu dan progres pengerjaannya!
            </p>
          </div>
        </section>

        {/* Ringkasan statistik */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Tugas</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-blue-900">{total}</h2>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Belum Dimulai</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-amber-600">{pending}</h2>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Sedang Dikerjakan</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-blue-600">{inProgress}</h2>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Selesai</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">{selesai}</h2>
          </div>
        </section>

        {/* Daftar tugas — bentuk list ringkas, bukan card besar */}
        <section className="overflow-hidden rounded-[20px] border border-blue-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-50 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-blue-900">
                Daftar Tugas
              </h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                {rows.length} tugas
              </span>
            </div>

            <ExportTugasPdfButton
              namaPeserta={namaPeserta}
              nim={nimPeserta}
              jurusan={jurusanPeserta}
              instansi="PT PLN (Persero) ULP Rivai"
              unitBagian={unitBagianPeserta}
              alamatInstansi="Jl. Demang Lebar Daun No.170, Lorok Pakjo, Kec. Ilir Bar. I, Kota Palembang, Sumatera Selatan 30151"
              periode={periodeMagang}
              rows={exportRows}
            />
          </div>

          {rows.length > 0 ? (
            <ul className="divide-y divide-blue-50">
              {rows.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/peserta/tugas/${item.tugas_id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50/40 sm:px-5"
                  >
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${getStatusDot(item.status)}`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-blue-900">
                        {item.task?.title ?? "Data tugas tidak ditemukan"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-slate-500">
                        <span>Deadline: {formatDate(item.task?.due_date ?? null)}</span>
                        <span className="text-blue-200">•</span>
                        <span>{getTargetLabel(item.task)}</span>
                      </div>
                    </div>

                    <span
                      className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>

                    <ChevronRight className="h-4 w-4 shrink-0 text-blue-300" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400 sm:p-10">
              Belum ada tugas yang diberikan untukmu saat ini.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}