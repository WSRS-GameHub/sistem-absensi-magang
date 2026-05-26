import { CalendarCheck2, Clock3 } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { managerNavigation } from "@/constants/navigation";

type AttendanceRow = {
  id: string;
  user_id: string;
  tanggal: string;
  check_in_at: string | null;
  check_out_at: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(checkIn: string | null, checkOut: string | null) {
  if (checkIn && checkOut) {
    return {
      label: "Selesai",
      className: "bg-emerald-500/10 text-emerald-600",
    };
  }

  if (checkIn) {
    return {
      label: "Sudah Check-in",
      className: "bg-blue-500/10 text-blue-600",
    };
  }

  return {
    label: "Belum Absen",
    className: "bg-amber-500/10 text-amber-600",
  };
}

export default async function ManagerAbsensiPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: attendanceData },
    { data: participantData },
  ] = await Promise.all([
    supabase
      .from("absensi")
      .select(
        "id, user_id, tanggal, check_in_at, check_out_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("profiles")
      .select("id, nama, division")
      .eq("role", "peserta")
      .eq("is_active", true),
  ]);

  const attendances = (attendanceData ?? []) as AttendanceRow[];

  const participants = (participantData ?? []) as ProfileRow[];

  const participantMap = new Map(
    participants.map((item) => [item.id, item])
  );

  const todayAttendances = attendances.filter(
    (item) => item.tanggal === today
  );

  const checkedInCount = todayAttendances.filter(
    (item) => item.check_in_at
  ).length;

  const checkedOutCount = todayAttendances.filter(
    (item) => item.check_out_at
  ).length;

  return (
    <DashboardLayout navigation={managerNavigation}>
      <div className="space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Monitoring Absensi
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Monitoring data absensi peserta magang.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Absensi Hari Ini
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {todayAttendances.length}
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Sudah Check-in
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {checkedInCount}
            </h2>
          </div>

          <div className="rounded-[20px] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Sudah Check-out
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {checkedOutCount}
            </h2>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border bg-card shadow-sm">
          <div className="border-b border-border/40 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-primary" />

              <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                Data Absensi Peserta
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold sm:px-5">
                    Nama
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Divisi
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Tanggal
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Check-in
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Check-out
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/20">
                {attendances.length > 0 ? (
                  attendances.map((item, index) => {
                    const participant =
                      participantMap.get(item.user_id);

                    const status = getStatus(
                      item.check_in_at,
                      item.check_out_at
                    );

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-muted/20 ${
                          index % 2 === 0
                            ? "bg-background"
                            : "bg-muted/[0.02]"
                        }`}
                      >
                        <td className="px-4 py-4 sm:px-5">
                          <div className="font-medium tracking-tight">
                            {participant?.nama ?? "Peserta"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {participant?.division ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(item.tanggal)}
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />

                            {formatTime(item.check_in_at)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />

                            {formatTime(item.check_out_at)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-sm text-muted-foreground"
                    >
                      Belum ada data absensi.
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