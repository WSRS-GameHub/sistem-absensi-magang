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
  status: string;
  keterangan: string | null;
  bukti_url: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  nama: string;
  division: "PA" | "TE" | "TEKNIK" | null;
  // Kolom foto profil. Sesuaikan nama kolom ini jika berbeda di tabel `profiles` kamu
  // (misalnya "photo_url" atau "foto").
  avatar_url: string | null;
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

function getStatus(
  status: string,
  checkIn: string | null,
  checkOut: string | null
) {
  if (status === "izin") {
    return {
      label: "Izin",
      className: "",
      style: {
        background: "#F9731615",
        color: "#c2410c",
        border: "1px solid #F9731640",
      },
    };
  }

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

function getInitials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Avatar peserta: pakai foto profil jika sudah diganti, fallback ke inisial jika belum ada.
function ParticipantAvatar({ profile }: { profile: ProfileRow | undefined }) {
  if (profile?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.nama}
        className="h-8 w-8 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: "#0072CE" }}
    >
      {profile ? getInitials(profile.nama) : "?"}
    </div>
  );
}

export default async function ManagerAbsensiPage() {
  await requireRole(["manager"]);

  const supabase = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: attendanceData }, { data: participantData }] =
    await Promise.all([
      supabase
        .from("absensi")
        .select(
          "id, user_id, tanggal, check_in_at, check_out_at, status, keterangan, bukti_url, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("profiles")
        .select("id, nama, division, avatar_url")
        .eq("role", "peserta")
        .eq("is_active", true),
    ]);

  const rawAttendances = (attendanceData ?? []) as AttendanceRow[];
  const participants = (participantData ?? []) as ProfileRow[];

  // Bucket "bukti-izin" bersifat privat, jadi path yang tersimpan di
  // bukti_url perlu diubah jadi signed URL (link sementara, 1 jam)
  // sebelum ditampilkan di tabel.
  const attendances = await Promise.all(
    rawAttendances.map(async (row) => {
      if (!row.bukti_url) return row;

      const { data: signed } = await supabase.storage
        .from("bukti-izin")
        .createSignedUrl(row.bukti_url, 3600);

      return { ...row, bukti_url: signed?.signedUrl ?? null };
    })
  );

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

          <div className="w-full">
            <table className="w-full table-fixed">
              <thead>
                <tr
                  className="text-left text-[11px] uppercase tracking-wider"
                  style={{
                    borderBottom: "1px solid #0072CE1a",
                    background: "#0072CE08",
                    color: "#0072CE",
                  }}
                >
                  <th className="w-[22%] px-4 py-3 font-semibold sm:px-5">Nama</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Divisi</th>
                  <th className="w-[13%] px-4 py-3 font-semibold">Tanggal</th>
                  <th className="w-[11%] px-4 py-3 font-semibold">Check-in</th>
                  <th className="w-[11%] px-4 py-3 font-semibold">Check-out</th>
                  <th className="w-[11%] px-4 py-3 font-semibold">Status</th>
                  <th className="w-[22%] px-4 py-3 font-semibold">Keterangan</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#0072CE0f" }}>
                {attendances.length > 0 ? (
                  attendances.map((item, index) => {
                    const participant = participantMap.get(item.user_id);
                    const status = getStatus(item.status, item.check_in_at, item.check_out_at);
                    const isIzin = item.status === "izin";

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-[#FFE60010] ${
                          index % 2 === 0 ? "bg-transparent" : "bg-[#0072CE04]"
                        }`}
                      >
                        <td className="px-4 py-4 sm:px-5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <ParticipantAvatar profile={participant} />
                            <div className="truncate font-medium tracking-tight">
                              {participant?.nama ?? "Peserta"}
                            </div>
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

                        <td className="px-4 py-4">
                          {isIzin ? (
                            <div className="flex w-full min-w-0 items-center gap-2">
                              <span
                                className="truncate text-sm text-muted-foreground"
                                title={item.keterangan ?? ""}
                              >
                                {item.keterangan || "-"}
                              </span>
                              {item.bukti_url ? (
                                <a
                                  href={item.bukti_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex shrink-0 items-center gap-1 text-xs font-bold"
                                  style={{ color: "#0072CE" }}
                                >
                                  Bukti
                                </a>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">–</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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
