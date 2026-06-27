import { Megaphone, Bell, Sparkles } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { adminNavigation } from "@/constants/navigation";

import { CreatePengumumanDialog } from "@/components/pengumuman/create-pengumuman-dialog";
import { EditPengumumanDialog } from "@/components/pengumuman/edit-pengumuman-dialog";
import { DeletePengumumanDialog } from "@/components/pengumuman/delete-pengumuman-dialog";

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  jenis: "pengumuman" | "pemberitahuan";
  tanggal_event: string | null;
  created_by: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nama: string;
  role: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function AdminPengumumanPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: announcementsData } = await supabase
    .from("pengumuman")
    .select("id, title, content, jenis, tanggal_event, created_by, created_at")
    .order("created_at", { ascending: false });

  const announcements = (announcementsData ?? []) as AnnouncementRow[];

  const creatorIds = [
    ...new Set(
      announcements
        .map((item) => item.created_by)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  const { data: profilesData } = creatorIds.length
    ? await supabase.from("profiles").select("id, nama, role").in("id", creatorIds)
    : { data: [] as ProfileRow[] };

  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((item) => [item.id, item]));

  const pemberitahuan = announcements.filter((item) => item.jenis === "pemberitahuan");
  const pengumuman = announcements.filter((item) => item.jenis !== "pemberitahuan");

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-5">

        {/* ── Page Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0072CE] px-6 py-5 shadow-md">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFE600] px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#003580] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Broadcast Informasi
              </span>
              <p className="mt-2 text-sm font-medium text-white/80">
                Kelola pengumuman dan pemberitahuan untuk seluruh peserta magang.
              </p>
            </div>
            <div className="shrink-0 [&>button]:bg-[#FFE600] [&>button]:text-[#003580] [&>button]:font-bold [&>button]:hover:bg-yellow-300">
              <CreatePengumumanDialog role="admin" />
            </div>
          </div>
        </div>

        {/* ── Pemberitahuan Section ── */}
        {pemberitahuan.length > 0 && (
          <section className="space-y-3">
            {/* Section label */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#FFE600] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#003580]">
                Pemberitahuan
              </span>
              <h3 className="text-base font-bold text-[#003580]">Info Penting</h3>
            </div>

            <div className="grid gap-3">
              {pemberitahuan.map((item) => {
                const creator = item.created_by ? profileMap.get(item.created_by) : null;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-[20px] border border-[#FFE600]/30 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* top accent bar */}
                    <div className="h-1 w-full bg-[#FFE600]" />

                    <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-start xl:justify-between">
                      {/* Left */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFE600]/20">
                            <Bell className="h-5 w-5 text-[#003580]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-bold tracking-tight text-[#003580]">
                              {item.title}
                            </h4>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {item.tanggal_event
                                ? `Tanggal event: ${formatDate(item.tanggal_event)}`
                                : "Pemberitahuan penting"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
                          {item.content}
                        </p>
                      </div>

                      {/* Right meta */}
                      <div className="w-full shrink-0 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/5 p-4 xl:w-[220px]">
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/60">
                              Dibuat Oleh
                            </p>
                            <p className="mt-1 font-semibold text-[#003580]">
                              {creator?.nama ?? "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/60">
                              Waktu
                            </p>
                            <p className="mt-1 text-gray-500">
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <EditPengumumanDialog role="admin" announcement={item} />
                          <DeletePengumumanDialog role="admin" id={item.id} title={item.title} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Pengumuman Section ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#0072CE]/15 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0072CE]">
              Pengumuman
            </span>
            <h3 className="text-base font-bold text-[#003580]">Info Umum</h3>
          </div>

          <div className="grid gap-3">
            {pengumuman.length > 0 ? (
              pengumuman.map((item) => {
                const creator = item.created_by ? profileMap.get(item.created_by) : null;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-[20px] border border-[#0072CE]/15 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* top accent bar */}
                    <div className="h-1 w-full bg-[#0072CE]" />

                    <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-start xl:justify-between">
                      {/* Left */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0072CE]/10">
                            <Megaphone className="h-5 w-5 text-[#0072CE]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-bold tracking-tight text-[#003580]">
                              {item.title}
                            </h4>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {item.tanggal_event
                                ? `Tanggal event: ${formatDate(item.tanggal_event)}`
                                : "Pengumuman"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
                          {item.content}
                        </p>
                      </div>

                      {/* Right meta */}
                      <div className="w-full shrink-0 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/5 p-4 xl:w-[220px]">
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/60">
                              Dibuat Oleh
                            </p>
                            <p className="mt-1 font-semibold text-[#003580]">
                              {creator?.nama ?? "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0072CE]/60">
                              Waktu
                            </p>
                            <p className="mt-1 text-gray-500">
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <EditPengumumanDialog role="admin" announcement={item} />
                          <DeletePengumumanDialog role="admin" id={item.id} title={item.title} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#0072CE]/20 bg-[#0072CE]/5 py-14 text-center text-sm text-[#0072CE]/60">
                Belum ada pengumuman.
              </div>
            )}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
