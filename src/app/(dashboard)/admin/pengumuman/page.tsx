import { Megaphone, Sparkles } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
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
    .select(
      "id, title, content, jenis, tanggal_event, created_by, created_at"
    )
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
    ? await supabase
        .from("profiles")
        .select("id, nama, role")
        .in("id", creatorIds)
    : { data: [] as ProfileRow[] };

  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((item) => [item.id, item]));

  const pemberitahuan = announcements.filter(
    (item) => item.jenis === "pemberitahuan"
  );

  const pengumuman = announcements.filter(
    (item) => item.jenis !== "pemberitahuan"
  );

  return (
    <DashboardLayout navigation={adminNavigation}>
      <div className="space-y-5">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[24px] border bg-gradient-to-br from-primary/[0.07] via-background to-background shadow-sm">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-[11px] font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Broadcast Informasi
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
                Kelola Pengumuman & Pemberitahuan
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Gunakan pemberitahuan untuk info penting seperti libur,
                perubahan jadwal, atau informasi lainnya kepada peserta.
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <CreatePengumumanDialog role="admin" />
            </div>
          </div>
        </section>

        {/* Pemberitahuan */}
        {pemberitahuan.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600">
                Pemberitahuan
              </span>

              <h3 className="text-base font-semibold sm:text-lg">
                Informasi Penting
              </h3>
            </div>

            <div className="grid gap-4">
              {pemberitahuan.map((item) => {
                const creator = item.created_by
                  ? profileMap.get(item.created_by)
                  : null;

                return (
                  <div
                    key={item.id}
                    className="rounded-[22px] border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10">
                            <Megaphone className="h-5 w-5 text-violet-600" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-base font-semibold tracking-tight sm:text-lg">
                              {item.title}
                            </h4>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.tanggal_event
                                ? `Tanggal event: ${formatDate(item.tanggal_event)}`
                                : "Pemberitahuan penting"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                          {item.content}
                        </p>
                      </div>

                      <div className="w-full rounded-2xl border bg-muted/20 p-4 xl:w-[240px]">
                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Dibuat Oleh
                            </p>

                            <p className="mt-1 font-medium">
                              {creator?.nama ?? "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Waktu
                            </p>

                            <p className="mt-1 text-muted-foreground">
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <EditPengumumanDialog
                            role="admin"
                            announcement={item}
                          />

                          <DeletePengumumanDialog
                            role="admin"
                            id={item.id}
                            title={item.title}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Pengumuman */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Pengumuman
            </span>

            <h3 className="text-base font-semibold sm:text-lg">
              Informasi Umum
            </h3>
          </div>

          <div className="grid gap-4">
            {pengumuman.length > 0 ? (
              pengumuman.map((item) => {
                const creator = item.created_by
                  ? profileMap.get(item.created_by)
                  : null;

                return (
                  <div
                    key={item.id}
                    className="rounded-[22px] border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <Megaphone className="h-5 w-5 text-primary" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-base font-semibold tracking-tight sm:text-lg">
                              {item.title}
                            </h4>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.tanggal_event
                                ? `Tanggal event: ${formatDate(item.tanggal_event)}`
                                : "Pengumuman"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                          {item.content}
                        </p>
                      </div>

                      <div className="w-full rounded-2xl border bg-muted/20 p-4 xl:w-[240px]">
                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Dibuat Oleh
                            </p>

                            <p className="mt-1 font-medium">
                              {creator?.nama ?? "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Waktu
                            </p>

                            <p className="mt-1 text-muted-foreground">
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <EditPengumumanDialog
                            role="admin"
                            announcement={item}
                          />

                          <DeletePengumumanDialog
                            role="admin"
                            id={item.id}
                            title={item.title}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed bg-card/40 p-10 text-center text-sm text-muted-foreground">
                Belum ada pengumuman.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}