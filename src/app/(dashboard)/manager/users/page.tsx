import { Users2 } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { managerNavigation } from "@/constants/navigation";

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
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

function getDivisionStyle(division: string | null) {
  if (division === "PA") {
    return "bg-blue-500/10 text-blue-600";
  }

  if (division === "TE") {
    return "bg-emerald-500/10 text-emerald-600";
  }

  if (division === "TEKNIK") {
    return "bg-violet-500/10 text-violet-600";
  }

  return "bg-muted text-muted-foreground";
}

export default async function ManagerPesertaPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, nama, division, is_active, created_at"
    )
    .eq("role", "peserta")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const participants = (data ?? []) as ProfileRow[];

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Monitoring Peserta
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Daftar peserta aktif kegiatan magang.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Total Peserta
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {participants.length}
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Divisi PA
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {
                participants.filter(
                  (item) => item.division === "PA"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Divisi TE
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {
                participants.filter(
                  (item) => item.division === "TE"
                ).length
              }
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Divisi Teknik
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {
                participants.filter(
                  (item) => item.division === "TEKNIK"
                ).length
              }
            </h2>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border bg-card shadow-sm">
          <div className="border-b border-border/40 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-primary" />

              <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                Peserta Aktif
              </h3>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
            {participants.length > 0 ? (
              participants.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-muted/20 p-4 transition-all hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                        {item.nama}
                      </h4>

                      <div className="mt-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getDivisionStyle(
                            item.division
                          )}`}
                        >
                          {item.division ?? "-"}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground">
                        Bergabung{" "}
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                      Aktif
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                Belum ada data peserta.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}