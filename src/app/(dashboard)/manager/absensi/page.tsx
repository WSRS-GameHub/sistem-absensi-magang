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
      // Blue accent
      className: "",
      style: {
        background: "#0072CE12",
        color: "#0072CE",
        border: "1px solid #0072CE30",
      },
    };
  }

  return {
    label: "Belum Absen",
    // Yellow accent
    className: "",
    style: {
      background: "#FFE60025",
      color: "#7a6200",
      border: "1px solid #FFE60070",
    },
  };
}

export default async function ManagerAbsensiPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: attendanceData }, { data: participantData }] =
    await Promise.all([
      supabase
        .from("absensi")
        .select("id, user_id, tanggal, check_in_at, check_out_at, created_at")
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

  const participantMap = new Map(participants.map((item) => [item.id, item]));

  const todayAttendances = attendances.filter((item) => item.tanggal === today);
  const checkedInCount = todayAttendances.filter((item) => item.check_in_at).length;
  const checkedOutCount = todayAttendances.filter((item) => item.check_out_at).length;

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
              Monitoring Absensi
            </div>
            <p className="mt-2 text-sm text-blue-100">
              Monitoring data absensi peserta magang.
            </p>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {/* Absensi Hari Ini */}
          <div
            className="rounded-[20px] p-4 shadow-sm relative overflow-hidden border-0"
            style={{ background: "#0072CE" }}
          >
            <div
              className="absolute bottom-0 right-0 h-16 w-16 rounded-tl-full opacity-20"
              style={{ background: "#FFE600" }}
            />
            <p className="text-xs font-medium text-blue-100">Absensi Hari Ini</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {todayAttendances.length}
            </h2>
          </div>

          {/* Sudah Check-in */}
          <div
            className="rounded-[20px] p-4 shadow-sm border"
            style={{ borderColor: "#0072CE33", background: "#0072CE0d" }}
          >
            <p className="text-xs font-medium" style={{ color: "#0072CE" }}>
              Sudah Check-in
            </p>
            <h2
              className="mt-2 text-2xl font-bold tracking-tight"
              style={{ color: "#0072CE" }}
            >
              {checkedInCount}
            </h2>
          </div>

          {/* Sudah Check-out */}
          <div
            className="rounded-[20px] p-4 shadow-sm border"
            style={{ borderColor: "#FFE60055", background: "#FFE6000d" }}
          >
            <p className="text-xs font-medium text-amber-700">Sudah Check-out</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
              {checkedOutCount}
            </h2>
          </div>
        </section>

        {/* Table Section */}
        <section
          className="overflow-hidden rounded-[22px] bg-card shadow-sm"
          style={{ border: "1px solid #0072CE1a" }}
        >
          {/* Table Header */}
          <div
            className="border-b px-4 py-4 sm:px-5"
            style={{ borderColor: "#0072CE1a" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "#0072CE15" }}
              >
                <CalendarCheck2 className="h-4 w-4" style={{ color: "#0072CE" }} />
              </div>
              <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                Data Absensi Peserta
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr
                  className="text-left text-[11px] uppercase tracking-wider"
                  style={{
                    borderBottom: "1px solid #0072CE1a",
                    background: "#0072CE08",
                    color: "#0072CE",
                  }}
                >
                  <th className="px-4 py-3 font-semibold sm:px-5">Nama</th>
                  <th className="px-4 py-3 font-semibold">Divisi</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Check-in</th>
                  <th className="px-4 py-3 font-semibold">Check-out</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#0072CE0f" }}>
                {attendances.length > 0 ? (
                  attendances.map((item, index) => {
                    const participant = participantMap.get(item.user_id);
                    const status = getStatus(item.check_in_at, item.check_out_at);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-[#FFE60010] ${
                          index % 2 === 0 ? "bg-transparent" : "bg-[#0072CE04]"
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
                            <Clock3
                              className="h-4 w-4"
                              style={{ color: item.check_in_at ? "#0072CE" : undefined }}
                            />
                            {formatTime(item.check_in_at)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock3
                              className="h-4 w-4"
                              style={{ color: item.check_out_at ? "#0072CE" : undefined }}
                            />
                            {formatTime(item.check_out_at)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${status.className}`}
                            style={status.style}
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
