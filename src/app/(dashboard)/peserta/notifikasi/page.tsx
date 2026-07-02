import { BellRing, CalendarDays, Clock } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { pesertaNavigation } from "@/constants/navigation";

const TIMEZONE = "Asia/Jakarta";

// Baris pemberitahuan langsung dari tabel `pengumuman`.
// is_important = true  -> Pemberitahuan
// is_important = false -> Pengumuman biasa
type PengumumanRow = {
  id: string;
  title: string;
  content: string | null;
  is_important: boolean;
  jenis: "pengumuman" | "pemberitahuan";
  tanggal_event: string | null;
  created_at: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

export default async function PesertaNotifikasiPage() {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();

  // Ambil hanya yang berjenis pemberitahuan (is_important = true).
  const { data: pengumumanData, error: pengumumanError } = await supabase
    .from("pengumuman")
    .select("id, title, content, is_important, jenis, tanggal_event, created_at")
    .eq("is_important", true)
    .order("created_at", { ascending: false });

  if (pengumumanError) {
    throw new Error(pengumumanError.message);
  }

  const items = (pengumumanData ?? []) as PengumumanRow[];

  // Status baca personal peserta untuk setiap pemberitahuan.
  const ids = items.map((item) => item.id);

  const { data: readStatusData, error: readStatusError } = ids.length
    ? await supabase
        .from("pengumuman_dibaca")
        .select("pengumuman_id")
        .eq("user_id", user.id)
        .in("pengumuman_id", ids)
    : { data: [] as { pengumuman_id: string }[], error: null };

  if (readStatusError) {
    throw new Error(readStatusError.message);
  }

  const readIds = new Set((readStatusData ?? []).map((row) => row.pengumuman_id));

  const notifications = items.map((item) => ({
    ...item,
    is_read: readIds.has(item.id),
  }));

  // Tandai semua yang baru dilihat sebagai sudah dibaca (upsert di background,
  // dilakukan setelah data diambil untuk render supaya badge "Baru" pada
  // kunjungan ini masih akurat).
  const unreadIds = items.map((item) => item.id).filter((id) => !readIds.has(id));

  if (unreadIds.length > 0) {
    await supabase.from("pengumuman_dibaca").upsert(
      unreadIds.map((pengumuman_id) => ({
        pengumuman_id,
        user_id: user.id,
      })),
      { onConflict: "pengumuman_id,user_id" }
    );
  }

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">

        {/* ── Hero Banner ── */}
        <section className="relative overflow-hidden rounded-[22px] bg-[#0072CE] p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[#FFE600]/10" />
          <div className="pointer-events-none absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-[#FFE600]/5" />
          <div className="relative flex flex-col gap-2">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFE600] px-3 py-1 text-xs font-bold tracking-wide text-[#0072CE]">
              <BellRing className="h-3 w-3" />
              Pemberitahuan
            </div>
            <p className="text-sm text-blue-100 sm:text-[15px]">
              Informasi penting dan pemberitahuan terbaru untuk peserta magang.
            </p>
          </div>
        </section>

        {/* ── Notification List ── */}
        <section className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((item) => {
              const eventDate = formatDate(item.tanggal_event);

              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Aksen kiri: kuning solid untuk yang belum dibaca, biru tipis untuk yang sudah */}
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: item.is_read ? "#CBD5E1" : "#FFE600" }}
                  />

                  <div className="flex items-start gap-3.5 py-4 pl-5 pr-4 sm:py-5 sm:pl-6 sm:pr-5">
                    {/* Icon */}
                    <div
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: item.is_read ? "#EEF6FF" : "#FFF8DB",
                        color: item.is_read ? "#0072CE" : "#B45309",
                      }}
                    >
                      <BellRing className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-[15px] font-bold leading-snug text-[#0F1D2A]">
                          {item.title}
                        </h3>

                        {!item.is_read && (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-[#FFE600] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#5C4A00]">
                            Baru
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        {item.content ?? "-"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(item.created_at)}
                        </span>

                        {eventDate && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0072CE]">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Event: {eventDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-14 text-center">
              <BellRing className="h-6 w-6 text-slate-300" />
              <p className="text-sm text-slate-400">Belum ada pemberitahuan.</p>
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
