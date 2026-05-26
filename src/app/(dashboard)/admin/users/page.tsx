import { CalendarDays, Users2 } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { adminNavigation } from "@/constants/navigation";
import { CreatePesertaDialog } from "@/components/admin/create-peserta-dialog";
import { EditPesertaDialog } from "@/components/admin/edit-peserta-dialog";
import { DeletePesertaDialog } from "@/components/admin/delete-peserta-dialog";

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
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDivisionBadge(division: string | null) {
  if (division === "PA") return "bg-blue-500/10 text-blue-600";
  if (division === "TE") return "bg-emerald-500/10 text-emerald-600";
  if (division === "TEKNIK") return "bg-violet-500/10 text-violet-600";

  return "bg-muted text-muted-foreground";
}

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, nama, username, email, jurusan, instansi, division, mulai_magang, akhir_magang, is_active, created_at"
    )
    .eq("role", "peserta")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const participants = (data ?? []) as ParticipantRow[];

  const activeCount = participants.filter((item) => item.is_active).length;
  const paCount = participants.filter((item) => item.division === "PA").length;
  const teCount = participants.filter((item) => item.division === "TE").length;
  const teknikCount = participants.filter(
    (item) => item.division === "TEKNIK"
  ).length;

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Data Peserta
              </div>

              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                Daftar Peserta Magang
              </h2>

              <p className="mt-1 text-sm text-muted-foreground sm:text-[15px]">
                Tambah, ubah, dan hapus data peserta dengan tampilan yang ringkas.
              </p>
            </div>

            <CreatePesertaDialog />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total Peserta</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {participants.length}
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Peserta Aktif</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {activeCount}
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Divisi PA</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{paCount}</h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Divisi TE</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{teCount}</h2>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border bg-card shadow-sm">
          <div className="border-b border-border/40 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                  Tabel Users
                </h3>
              </div>

              <p className="text-xs text-muted-foreground">
                Total {participants.length} peserta
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Jurusan</th>
                  <th className="px-4 py-3 font-semibold">Instansi</th>
                  <th className="px-4 py-3 font-semibold">Divisi</th>
                  <th className="px-4 py-3 font-semibold">Mulai</th>
                  <th className="px-4 py-3 font-semibold">Akhir</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/20">
                {participants.length > 0 ? (
                  participants.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/[0.03]"
                      }`}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-semibold tracking-tight">
                          {item.nama}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                        {item.username}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                        {item.jurusan ?? "-"}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                        {item.instansi ?? "-"}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getDivisionBadge(
                            item.division
                          )}`}
                        >
                          {item.division ?? "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          {formatDate(item.mulai_magang)}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          {formatDate(item.akhir_magang)}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
                            item.is_active
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-2">
                          <EditPesertaDialog peserta={item} />
                          <DeletePesertaDialog id={item.id} nama={item.nama} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Belum ada data peserta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}