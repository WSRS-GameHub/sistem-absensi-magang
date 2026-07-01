import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { adminNavigation } from "@/constants/navigation";
import { CreatePesertaDialog } from "@/components/admin/create-peserta-dialog";
import { EditPesertaDialog } from "@/components/admin/edit-peserta-dialog";
import { DeletePesertaDialog } from "@/components/admin/delete-peserta-dialog";

/* ─── Types ──────────────────────────────────────────────────── */
type ParticipantRow = {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  jurusan: string | null;
  instansi: string | null;
  division: "PA" | "TE" | "TEKNIK" | null;
  mulai_magang: string | null;
  akhir_magang: string | null;
  is_active: boolean;
  created_at: string | null;
  avatar_url: string | null;
};

/* Status dihitung dari tanggal akhir magang vs hari ini */
type MagangStatus = "aktif" | "selesai" | "nonaktif";

function getMagangStatus(item: ParticipantRow): MagangStatus {
  if (!item.is_active) return "nonaktif";
  if (item.akhir_magang && new Date(item.akhir_magang) < new Date()) return "selesai";
  return "aktif";
}

/* ─── Helpers ────────────────────────────────────────────────── */
function formatDate(v: string | null) {
  if (!v) return "–";
  return new Date(v).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(nama: string) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/* ─── Avatar ─────────────────────────────────────────────────── */
const avatarStyle: Record<string, { bg: string; border: string; color: string }> = {
  TE:      { bg: "#DBEEFF", border: "#93C5FD", color: "#1D4ED8" },
  PA:      { bg: "#DBEEFF", border: "#93C5FD", color: "#1D4ED8" },
  TEKNIK:  { bg: "#EDE9FE", border: "#C4B5FD", color: "#3730A3" },
  default: { bg: "#DBEEFF", border: "#93C5FD", color: "#1D4ED8" },
};

function Avatar({
  nama,
  division,
  avatarUrl,
}: {
  nama: string;
  division: string | null;
  avatarUrl: string | null;
}) {
  const s = avatarStyle[division ?? "default"] ?? avatarStyle.default;

  if (avatarUrl) {
    return (
      <div
        className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2"
        style={{ borderColor: s.border }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={`Foto ${nama}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold uppercase"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}
    >
      {initials(nama)}
    </div>
  );
}

/* ─── Divisi pill ────────────────────────────────────────────── */
const divStyle: Record<string, { pill: string; dot: string }> = {
  PA:     { pill: "bg-[#DBEEFF] text-[#0C447C] border border-[#B5D4F4]", dot: "bg-[#185FA5]" },
  TE:     { pill: "bg-[#D4F5E9] text-[#064E3B] border border-[#6EE7B7]", dot: "bg-[#059669]" },
  TEKNIK: { pill: "bg-[#EDE9FE] text-[#3730A3] border border-[#C4B5FD]", dot: "bg-[#6D28D9]" },
};

function DivisionPill({ division }: { division: string | null }) {
  if (!division)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D3D1C7] bg-[#F1EFE8] px-[10px] py-[4px] text-[11px] font-bold text-[#5F5E5A]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#888780]" />–
      </span>
    );
  const s = divStyle[division];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-[10px] py-[4px] text-[11px] font-bold ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {division}
    </span>
  );
}

/* ─── Status pill ────────────────────────────────────────────── */
const statusStyle: Record<MagangStatus, { pill: string; dot: string; label: string }> = {
  aktif:   { pill: "bg-[#D4F5E9] text-[#064E3B] border border-[#6EE7B7]", dot: "bg-[#10B981]", label: "Aktif" },
  selesai: { pill: "bg-[#FEF3C7] text-[#78350F] border border-[#FCD34D]", dot: "bg-[#F59E0B]", label: "Selesai" },
  nonaktif:{ pill: "bg-[#FEE2E2] text-[#7F1D1D] border border-[#FCA5A5]", dot: "bg-[#EF4444]", label: "Nonaktif" },
};

function StatusPill({ status }: { status: MagangStatus }) {
  const s = statusStyle[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-[10px] py-[4px] text-[11px] font-bold ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/* ─── Stat card ─────────────────────────────────────────────── */
function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-[16px] bg-white p-4" style={{ borderLeft: `3px solid ${accent}` }}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#3D5166]">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-[#0F1D2A]">{value}</p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, nama, username, email, jurusan, instansi, division, mulai_magang, akhir_magang, is_active, created_at, avatar_url"
    )
    .eq("role", "peserta")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const participants = (data ?? []) as ParticipantRow[];
  const activeCount = participants.filter((p) => getMagangStatus(p) === "aktif").length;
  const normalizeDivision = (d: string | null) => (d ?? "").trim().toUpperCase();

  const paCount     = participants.filter((p) => normalizeDivision(p.division) === "PA").length;
  const teCount     = participants.filter((p) => normalizeDivision(p.division) === "TE").length;
  const teknikCount = participants.filter((p) => normalizeDivision(p.division) === "TEKNIK").length;

  const TH_COLS = ["Peserta", "Jurusan / Instansi", "Divisi", "Periode Magang", "Status", "Aksi"];

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4 p-1">

        {/* ── Hero ── */}
        <section
          className="flex flex-col gap-4 rounded-[20px] p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "#0072CE" }}
        >
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "#FFE600", color: "#5C4A00" }}
            >
              Data Peserta
            </span>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Daftar Peserta Magang
            </h1>
            <p className="mt-1 text-[13px] text-white/65">
              Tambah, ubah, dan hapus data peserta dengan tampilan yang ringkas.
            </p>
          </div>
          <div className="shrink-0">
            <CreatePesertaDialog />
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Peserta" value={participants.length} accent="#0072CE" />
          <StatCard label="Peserta Aktif" value={activeCount}         accent="#10B981" />
          <StatCard label="Divisi PA"     value={paCount}             accent="#8B5CF6" />
          <StatCard label="Divisi TE"     value={teCount}             accent="#F59E0B" />
          <StatCard label="Divisi Teknik" value={teknikCount}         accent="#6D28D9" />
        </section>

        {/* ── Table ── */}
        <section className="overflow-hidden rounded-[20px] bg-white">

          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-[#EBF4FF] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0072CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3 className="text-[14px] font-bold text-[#0F1D2A]">Tabel Users</h3>
            </div>
            <span className="rounded-full bg-[#E6F3FF] px-3 py-1 text-[11px] font-bold text-[#0072CE]">
              {participants.length} peserta
            </span>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="bg-[#EEF6FF]">
                  {TH_COLS.map((h, i) => (
                    <th
                      key={h}
                      className="border-b-[1.5px] border-[#CCE4F7] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[.09em] text-[#7A94A8]"
                      style={{ textAlign: i === TH_COLS.length - 1 ? "right" : "left" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {participants.length > 0 ? (
                  participants.map((item) => {
                    const status = getMagangStatus(item);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#EEF6FF] transition-colors last:border-none hover:bg-[#F4F9FF]"
                      >
                        {/* Peserta */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              nama={item.nama}
                              division={item.division}
                              avatarUrl={item.avatar_url}
                            />
                            <div>
                              <p className="text-[13px] font-bold text-[#0F1D2A]">{item.nama}</p>
                              <p className="text-[11px] text-[#7A94A8]">@{item.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Jurusan / Instansi */}
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-semibold text-[#1A2E40]">{item.jurusan ?? "–"}</p>
                          <p className="text-[11px] text-[#5A7285]">{item.instansi ?? "–"}</p>
                        </td>

                        {/* Divisi */}
                        <td className="px-4 py-3">
                          <DivisionPill division={item.division} />
                        </td>

                        {/* Periode — hanya range tanggal, tanpa durasi bulan */}
                        <td className="px-4 py-3">
                          <p className="text-[12.5px] font-semibold text-[#1A2E40]">
                            {formatDate(item.mulai_magang)} – {formatDate(item.akhir_magang)}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusPill status={status} />
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <EditPesertaDialog peserta={item} />
                            <DeletePesertaDialog id={item.id} nama={item.nama} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-[13px] text-[#7A94A8]">
                      Belum ada data peserta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between border-t-[1.5px] border-[#EEF6FF] px-5 py-3">
            <p className="text-[11px] font-medium text-[#7A94A8]">
              Menampilkan {participants.length} peserta
            </p>
          </div>

        </section>
      </div>
    </DashboardLayout>
  );
}