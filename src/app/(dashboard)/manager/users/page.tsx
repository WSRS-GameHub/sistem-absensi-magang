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

const DIVISIONS = ["PA", "TE", "TEKNIK"] as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDivisionAccent(division: string) {
  if (division === "PA")
    return {
      badge: { background: "#0072CE15", color: "#0072CE", border: "1px solid #0072CE30" },
      header: { background: "#0072CE", color: "#fff" },
      card: { borderColor: "#0072CE1a", background: "#0072CE06" },
      dot: "#0072CE",
    };
  if (division === "TE")
    return {
      badge: { background: "#FFE60025", color: "#7a6200", border: "1px solid #FFE60070" },
      header: { background: "#e6a800", color: "#fff" },
      card: { borderColor: "#FFE60040", background: "#FFE6000a" },
      dot: "#e6a800",
    };
  // TEKNIK
  return {
    badge: { background: "#0072CE08", color: "#005baa", border: "1px solid #0072CE20" },
    header: { background: "#003d7a", color: "#FFE600" },
    card: { borderColor: "#003d7a1a", background: "#003d7a06" },
    dot: "#003d7a",
  };
}

export default async function ManagerPesertaPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, nama, division, is_active, created_at")
    .eq("role", "peserta")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const participants = (data ?? []) as ProfileRow[];

  const byDivision = DIVISIONS.map((div) => ({
    division: div,
    members: participants.filter((p) => p.division === div),
  }));

  const noDivision = participants.filter((p) => !p.division);

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-5">

        {/* Header */}
        <section
          className="rounded-[22px] p-5 shadow-sm relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0072CE 0%, #005baa 100%)" }}
        >
          <div
            className="absolute top-0 right-0 h-full w-1.5 rounded-r-[22px]"
            style={{ background: "#FFE600" }}
          />
          <div
            className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full opacity-10"
            style={{ background: "#FFE600" }}
          />
          <div className="relative">
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
              style={{ background: "#FFE600", color: "#003d7a" }}
            >
              Monitoring Peserta
            </div>
            <p className="mt-2 text-sm text-blue-100">
              Daftar peserta aktif kegiatan magang.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            className="rounded-[20px] p-4 shadow-sm relative overflow-hidden border-0"
            style={{ background: "#0072CE" }}
          >
            <div
              className="absolute bottom-0 right-0 h-16 w-16 rounded-tl-full opacity-20"
              style={{ background: "#FFE600" }}
            />
            <p className="text-xs font-medium text-blue-100">Total Peserta</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {participants.length}
            </h2>
          </div>

          {DIVISIONS.map((div) => {
            const accent = getDivisionAccent(div);
            const count = participants.filter((p) => p.division === div).length;
            return (
              <div
                key={div}
                className="rounded-[20px] p-4 shadow-sm border"
                style={{ borderColor: accent.card.borderColor, background: accent.card.background }}
              >
                <p className="text-xs font-medium" style={{ color: accent.dot }}>
                  Divisi {div}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight" style={{ color: accent.dot }}>
                  {count}
                </h2>
              </div>
            );
          })}
        </section>

        {/* Per-Division Sections */}
        <section className="space-y-4">
          {byDivision.map(({ division, members }) => {
            const accent = getDivisionAccent(division);
            return (
              <div
                key={division}
                className="overflow-hidden rounded-[22px] shadow-sm"
                style={{ border: `1px solid ${accent.card.borderColor}` }}
              >
                {/* Division Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 sm:px-5"
                  style={accent.header}
                >
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4" />
                    <h3 className="text-sm font-semibold tracking-tight">
                      Divisi {division}
                    </h3>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "inherit",
                    }}
                  >
                    {members.length} peserta
                  </span>
                </div>

                {/* Member Cards */}
                <div
                  className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4"
                  style={{ background: accent.card.background }}
                >
                  {members.length > 0 ? (
                    members.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl p-4 transition-colors hover:brightness-95"
                        style={{
                          border: `1px solid ${accent.card.borderColor}`,
                          background: "#fff",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                              {item.nama}
                            </h4>

                            <div className="mt-2">
                              <span
                                className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium"
                                style={accent.badge}
                              >
                                {item.division ?? "-"}
                              </span>
                            </div>

                            <p className="mt-3 text-xs text-muted-foreground">
                              Bergabung {formatDate(item.created_at)}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                            Aktif
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="col-span-full rounded-2xl p-8 text-center text-sm text-muted-foreground"
                      style={{
                        border: `1.5px dashed ${accent.card.borderColor}`,
                      }}
                    >
                      Belum ada peserta di divisi {division}.
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* No division group */}
          {noDivision.length > 0 && (
            <div
              className="overflow-hidden rounded-[22px] shadow-sm border"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div className="flex items-center justify-between bg-muted/40 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold tracking-tight">Tanpa Divisi</h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {noDivision.length} peserta
                </span>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
                {noDivision.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-muted/20 p-4 transition-all hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                          {item.nama}
                        </h4>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Bergabung {formatDate(item.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                        Aktif
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
