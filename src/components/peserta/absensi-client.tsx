"use client";

import { useState, useTransition } from "react";
import {
  CalendarCheck2,
  CircleCheckBig,
  Clock3,
  LogIn,
  LogOut,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import {
  checkInAttendance,
  checkOutAttendance,
} from "@/actions/peserta/absensi";

type AttendanceData = {
  check_in_at: string | null;
  check_out_at: string | null;
};

interface AbsensiClientProps {
  todayAttendance: AttendanceData | null;
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung GPS."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Izin lokasi ditolak."));
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error("Lokasi tidak dapat ditemukan."));
          return;
        }

        if (error.code === error.TIMEOUT) {
          reject(new Error("Pengambilan lokasi timeout."));
          return;
        }

        reject(new Error("Gagal mengambil lokasi."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

function formatTime(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AbsensiClient({ todayAttendance }: AbsensiClientProps) {
  const [loadingIn, startInTransition] = useTransition();
  const [loadingOut, startOutTransition] = useTransition();
  const [message, setMessage] = useState("");

  const isCheckedIn = Boolean(todayAttendance?.check_in_at);
  const isCheckedOut = Boolean(todayAttendance?.check_out_at);

  const statusLabel = !isCheckedIn
    ? "Belum Absen"
    : isCheckedIn && !isCheckedOut
      ? "Sudah Datang"
      : "Selesai";

  const handleCheckIn = async () => {
    setMessage("");

    startInTransition(async () => {
      try {
        const position = await getCurrentPosition();

        const result = await checkInAttendance(
          position.coords.latitude,
          position.coords.longitude
        );

        toast.success(result.message);
        setMessage(result.message);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Gagal check-in";

        toast.error(errorMessage);
        setMessage(errorMessage);
      }
    });
  };

  const handleCheckOut = async () => {
    setMessage("");

    startOutTransition(async () => {
      try {
        const position = await getCurrentPosition();

        const result = await checkOutAttendance(
          position.coords.latitude,
          position.coords.longitude
        );

        toast.success(result.message);
        setMessage(result.message);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Gagal check-out";

        toast.error(errorMessage);
        setMessage(errorMessage);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Absensi Hari Ini
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Lakukan absensi menggunakan lokasi GPS kantor.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loadingIn || isCheckedIn}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loadingIn ? "Memproses..." : "Datang"}
          </button>

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={loadingOut || !isCheckedIn || isCheckedOut}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border bg-background px-5 text-sm font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loadingOut ? "Memproses..." : "Pulang"}
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {message || "Pastikan GPS aktif dan berada di area kantor."}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Datang
          </p>
          <p className="mt-2 text-base font-semibold">
            {formatTime(todayAttendance?.check_in_at)}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Pulang
          </p>
          <p className="mt-2 text-base font-semibold">
            {formatTime(todayAttendance?.check_out_at)}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <CircleCheckBig className="h-3.5 w-3.5" />
            Status
          </p>
          <p className="mt-2 text-base font-semibold">{statusLabel}</p>
        </div>
      </div>

      <div className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Keterangan</h3>
        </div>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Datang dan pulang menggunakan GPS lokasi kantor.
        </p>
      </div>
    </div>
  );
}