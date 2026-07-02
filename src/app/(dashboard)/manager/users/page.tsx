import Script from "next/script";
import { Users2 } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { managerNavigation } from "@/constants/navigation";

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
  instansi: string | null;
  is_active: boolean;
  mulai_magang: string | null;
  akhir_magang: string | null;
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

/**
 * Status aktif yang sebenarnya = is_active bernilai true DAN
 * tanggal hari ini berada di rentang mulai_magang..akhir_magang
 * (kalau salah satu tanggal kosong, batas itu diabaikan).
 */
function isUserActive(item: ProfileRow) {
  if (!item.is_active) return false;

  const today = new Date().toISOString().slice(0, 10);

  if (item.mulai_magang && today < item.mulai_magang) return false;
  if (item.akhir_magang && today > item.akhir_magang) return false;

  return true;
}

function getDivisionAccent(division: string | null) {
  if (division === "PA")
    return {
      badge: { background: "#0072CE15", color: "#0072CE", border: "1px solid #0072CE30" },
      dot: "#0072CE",
    };
  if (division === "TE")
    return {
      badge: { background: "#FFE60025", color: "#7a6200", border: "1px solid #FFE60070" },
      dot: "#e6a800",
    };
  if (division === "TEKNIK")
    return {
      badge: { background: "#0072CE08", color: "#005baa", border: "1px solid #0072CE20" },
      dot: "#003d7a",
    };
  return {
    badge: { background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" },
    dot: "#9ca3af",
  };
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Aktif
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-600">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Tidak Aktif
    </span>
  );
}

export default async function ManagerPesertaPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  // Tidak memfilter is_active di query — status aktif sebenarnya
  // dihitung di bawah berdasarkan is_active + mulai_magang + akhir_magang,
  // supaya peserta yang belum mulai / sudah lewat tanggal akhir tetap
  // terlihat di daftar (ditandai "Tidak Aktif") bukan menghilang.
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, nama, division, instansi, is_active, mulai_magang, akhir_magang, created_at"
    )
    .eq("role", "peserta")
    .order("created_at", { ascending: false });

  const participants = (data ?? []) as ProfileRow[];

  const counts: Record<"ALL" | (typeof DIVISIONS)[number], number> = {
    ALL: participants.length,
    PA: participants.filter((p) => p.division === "PA").length,
    TE: participants.filter((p) => p.division === "TE").length,
    TEKNIK: participants.filter((p) => p.division === "TEKNIK").length,
  };

  const activeCount = participants.filter((p) => isUserActive(p)).length;
  const inactiveCount = participants.length - activeCount;

  const tabs: { value: "ALL" | (typeof DIVISIONS)[number]; label: string }[] = [
    { value: "ALL", label: "Semua" },
    { value: "PA", label: "PA" },
    { value: "TE", label: "TE" },
    { value: "TEKNIK", label: "TEKNIK" },
  ];

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-5">
        {/* Header */}
        <section
          className="relative overflow-hidden rounded-[22px] p-5 shadow-sm"
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
              Monitoring Users
            </div>
            <p className="mt-2 text-sm text-blue-100">
              Daftar peserta magang PLN ULP RIVAI Palembang
            </p>
          </div>
        </section>

        {/* Tabel + tab divisi (filter tanpa reload via data-attribute) */}
        <section
          id="users-table-section"
          className="rounded-[22px] border border-[#0072CE]/10 bg-card shadow-sm"
        >
          {/* Tab divisi */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#0072CE]/10 p-4 sm:px-5">
            {tabs.map((tab) => {
              const accent = getDivisionAccent(tab.value === "ALL" ? null : tab.value);
              const isDefaultActive = tab.value === "ALL";

              return (
                <button
                  key={tab.value}
                  type="button"
                  data-division-tab={tab.value}
                  data-active={isDefaultActive ? "true" : "false"}
                  className="division-tab-btn flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
                  style={
                    isDefaultActive
                      ? { background: "#0072CE", color: "#fff" }
                      : { background: "#0072CE0a", color: "#0072CE" }
                  }
                >
                  {tab.value !== "ALL" && (
                    <span
                      className="h-1.5 w-1.5 rounded-full tab-dot"
                      style={{ background: isDefaultActive ? "#FFE600" : accent.dot }}
                    />
                  )}
                  {tab.label}
                  <span
                    className="rounded-full px-1.5 text-[11px] font-semibold tab-count"
                    style={{
                      background: isDefaultActive ? "rgba(255,255,255,0.2)" : "#0072CE15",
                    }}
                  >
                    {counts[tab.value]}
                  </span>
                </button>
              );
            })}

            <span className="ml-auto text-xs text-muted-foreground">
              {activeCount} aktif · {inactiveCount} tidak aktif dari {participants.length}{" "}
              peserta
            </span>
          </div>

          {/* Tabel - desktop / tablet */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#0072CE]/10 text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Divisi</th>
                  <th className="px-5 py-3 font-medium">Instansi</th>
                  <th className="px-5 py-3 font-medium">Mulai</th>
                  <th className="px-5 py-3 font-medium">Akhir</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  participants.map((item) => {
                    const accent = getDivisionAccent(item.division);
                    const active = isUserActive(item);

                    return (
                      <tr
                        key={item.id}
                        data-row-division={item.division ?? ""}
                        className="user-row border-b border-[#0072CE]/5 last:border-0 hover:bg-[#0072CE]/[0.03]"
                      >
                        <td className="px-5 py-3 font-medium text-foreground">
                          {item.nama}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium"
                            style={accent.badge}
                          >
                            {item.division ?? "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {item.instansi ?? "-"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatDate(item.mulai_magang)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatDate(item.akhir_magang)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge active={active} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      Belum ada users.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <p
              id="empty-state-desktop"
              className="hidden px-5 py-10 text-center text-sm text-muted-foreground"
            >
              Belum ada users untuk divisi ini.
            </p>
          </div>

          {/* Kartu - mobile */}
          <div className="space-y-3 p-4 sm:hidden">
            {participants.length > 0 ? (
              participants.map((item) => {
                const accent = getDivisionAccent(item.division);
                const active = isUserActive(item);

                return (
                  <div
                    key={item.id}
                    data-row-division={item.division ?? ""}
                    className="user-row rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0072CE]/10 text-[#0072CE]">
                          <Users2 className="h-4 w-4" />
                        </div>
                        <p className="truncate font-medium text-foreground">
                          {item.nama}
                        </p>
                      </div>
                      <StatusBadge active={active} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={accent.badge}
                      >
                        {item.division ?? "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.instansi ?? "-"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Mulai {formatDate(item.mulai_magang)}</span>
                      <span>Akhir {formatDate(item.akhir_magang)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#0072CE]/20 p-8 text-center text-sm text-muted-foreground">
                Belum ada users.
              </div>
            )}

            <p
              id="empty-state-mobile"
              className="hidden rounded-2xl border border-dashed border-[#0072CE]/20 p-8 text-center text-sm text-muted-foreground"
            >
              Belum ada users untuk divisi ini.
            </p>
          </div>
        </section>

        {/* Script kecil: filter tab divisi tanpa reload halaman.
            Pakai next/script (bukan tag <script> mentah) karena App Router
            React Server Components tidak mengeksekusi tag <script> biasa
            yang dirender langsung di JSX. */}
        <Script
          id="users-table-filter-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var section = document.getElementById("users-table-section");
                if (!section) return;

                var tabs = section.querySelectorAll(".division-tab-btn");
                var rows = section.querySelectorAll(".user-row");
                var emptyDesktop = document.getElementById("empty-state-desktop");
                var emptyMobile = document.getElementById("empty-state-mobile");

                function applyFilter(value) {
                  var visibleCount = 0;

                  rows.forEach(function (row) {
                    var rowDivision = row.getAttribute("data-row-division");
                    var show = value === "ALL" || rowDivision === value;
                    row.style.display = show ? "" : "none";
                    if (show) visibleCount++;
                  });

                  if (emptyDesktop) {
                    emptyDesktop.classList.toggle("hidden", visibleCount !== 0 || rows.length === 0);
                  }
                  if (emptyMobile) {
                    emptyMobile.classList.toggle("hidden", visibleCount !== 0 || rows.length === 0);
                  }
                }

                tabs.forEach(function (tab) {
                  tab.addEventListener("click", function () {
                    var value = tab.getAttribute("data-division-tab");

                    tabs.forEach(function (t) {
                      var isActive = t === tab;
                      t.setAttribute("data-active", isActive ? "true" : "false");
                      t.style.background = isActive ? "#0072CE" : "#0072CE0a";
                      t.style.color = isActive ? "#fff" : "#0072CE";

                      var dot = t.querySelector(".tab-dot");
                      if (dot) {
                        dot.style.background = isActive ? "#FFE600" : dot.getAttribute("data-base-color") || dot.style.background;
                      }

                      var count = t.querySelector(".tab-count");
                      if (count) {
                        count.style.background = isActive ? "rgba(255,255,255,0.2)" : "#0072CE15";
                      }
                    });

                    applyFilter(value);
                  });
                });
              })();
            `,
          }}
        />
      </div>
    </DashboardLayout>
  );
}
