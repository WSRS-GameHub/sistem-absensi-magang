import { BellRing } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { pesertaNavigation } from "@/constants/navigation";

type NotificationRow = {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PesertaNotifikasiPage() {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifikasi")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const notifications = (data ?? []) as NotificationRow[];
  const unreadCount = notifications.filter((item) => !item.is_read).length;

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

        {/* ── Stat Cards ── */}
        <section className="grid gap-3 sm:grid-cols-3">
          {/* Total */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0072CE] p-4 shadow-sm">
            <div className="pointer-events-none absolute -right-3 -bottom-3 h-14 w-14 rounded-full bg-white/10" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Total Notifikasi
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {notifications.length}
            </h2>
          </div>

          {/* Belum Dibaca */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FFE600] p-4 shadow-sm">
            <div className="pointer-events-none absolute -right-3 -bottom-3 h-14 w-14 rounded-full bg-white/20" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0072CE]/60">
              Belum Dibaca
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0072CE]">
              {unreadCount}
            </h2>
          </div>

          {/* Sudah Dibaca */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
            <div className="pointer-events-none absolute -right-3 -bottom-3 h-14 w-14 rounded-full bg-[#0072CE]/5" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0072CE]/50">
              Sudah Dibaca
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0072CE]">
              {notifications.length - unreadCount}
            </h2>
          </div>
        </section>

        {/* ── Notification List ── */}
        <section className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-[22px] border p-4 shadow-sm transition-all sm:p-5 ${
                  item.is_read
                    ? "border-blue-100 bg-white hover:bg-blue-50/40"
                    : "border-[#FFE600]/60 bg-[#FFFDE7]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      item.is_read
                        ? "bg-blue-100 text-[#0072CE]"
                        : "bg-[#FFE600] text-[#0072CE]"
                    }`}
                  >
                    <BellRing className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold tracking-tight text-[#0072CE] sm:text-[15px]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.message ?? "-"}
                        </p>
                      </div>

                      {!item.is_read && (
                        <span className="inline-flex w-fit shrink-0 rounded-full bg-[#FFE600] px-2.5 py-1 text-[10px] font-bold text-[#0072CE]">
                          Baru
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center text-sm text-[#0072CE]/60 shadow-sm">
              Belum ada pemberitahuan.
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
