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
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Pemberitahuan
            </div>
            <p className="text-sm text-muted-foreground sm:text-[15px]">
              Informasi penting dan pemberitahuan terbaru untuk peserta magang.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total Notifikasi</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {notifications.length}
            </h2>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Belum Dibaca</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {unreadCount}
            </h2>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Sudah Dibaca</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {notifications.length - unreadCount}
            </h2>
          </div>
        </section>

        <section className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-[22px] border bg-card p-4 shadow-sm transition-all sm:p-5 ${
                  item.is_read
                    ? "hover:bg-muted/20"
                    : "border-primary/20 bg-primary/[0.03]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      item.is_read
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <BellRing className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold tracking-tight sm:text-[15px]">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.message ?? "-"}
                        </p>
                      </div>

                      {!item.is_read ? (
                        <span className="inline-flex w-fit shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                          Baru
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              Belum ada pemberitahuan.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}