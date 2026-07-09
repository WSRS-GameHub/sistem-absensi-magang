"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { getDistanceInMeters } from "@/lib/location/haversine";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getOfficeLocation() {
  const lat = Number(process.env.NEXT_PUBLIC_OFFICE_LAT);
  const lng = Number(process.env.NEXT_PUBLIC_OFFICE_LNG);
  const radius = Number(process.env.NEXT_PUBLIC_ABSENCE_RADIUS ?? 100);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("Koordinat kantor belum diatur.");
  }

  return { lat, lng, radius };
}

function getJakartaTimeNow() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return { hour, minute };
}

function toMinutes(hour: number, minute: number) {
  return hour * 60 + minute;
}

function isBeforeStartTime(hour: number, minute: number, startHour: number, startMinute: number) {
  return toMinutes(hour, minute) < toMinutes(startHour, startMinute);
}

function isBeforeCheckOutTime(hour: number, minute: number) {
  return toMinutes(hour, minute) < toMinutes(16, 0);
}

type AttendanceResult = {
  success: boolean;
  message: string;
};

export async function checkInAttendance(
  latitude: number,
  longitude: number
): Promise<AttendanceResult> {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();
  const today = getToday();

  const { hour, minute } = getJakartaTimeNow();

  if (isBeforeStartTime(hour, minute, 7, 30)) {
    throw new Error("Check-in hanya bisa dimulai pukul 07:30.");
  }

  const { lat: officeLat, lng: officeLng, radius } = getOfficeLocation();

  const distance = getDistanceInMeters(
    latitude,
    longitude,
    officeLat,
    officeLng
  );

  if (distance > radius) {
    throw new Error(
      `Lokasi di luar radius absensi (${Math.round(distance)}m dari kantor).`
    );
  }

  const { data: existingAttendance, error: fetchError } = await supabase
    .from("absensi")
    .select("*")
    .eq("user_id", user.id)
    .eq("tanggal", today)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existingAttendance?.check_in_at) {
    throw new Error("Kamu sudah check-in hari ini.");
  }

  if (existingAttendance?.status === "izin") {
    throw new Error("Kamu sudah mengajukan izin hari ini.");
  }

  if (existingAttendance) {
    const { data: updated, error: updateError } = await supabase
      .from("absensi")
      .update({
        check_in_at: new Date().toISOString(),
        check_in_lat: latitude,
        check_in_lng: longitude,
        status: "checked_in",
      })
      .eq("id", existingAttendance.id)
      .select();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!updated || updated.length === 0) {
      throw new Error(
        "Check-in gagal: data tidak dapat diperbarui (kemungkinan diblokir RLS)."
      );
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("absensi")
      .insert({
        user_id: user.id,
        tanggal: today,
        check_in_at: new Date().toISOString(),
        check_in_lat: latitude,
        check_in_lng: longitude,
        status: "checked_in",
      })
      .select();

    if (insertError) {
      throw new Error(insertError.message);
    }

    if (!inserted || inserted.length === 0) {
      throw new Error(
        "Check-in gagal: data tidak dapat disimpan (kemungkinan diblokir RLS)."
      );
    }
  }

  revalidatePath("/peserta/absensi");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Check-in berhasil",
  };
}

export async function checkOutAttendance(
  latitude: number,
  longitude: number
): Promise<AttendanceResult> {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();
  const today = getToday();

  const { hour, minute } = getJakartaTimeNow();

  if (isBeforeCheckOutTime(hour, minute)) {
    throw new Error("Check-out hanya bisa dimulai pukul 16:00.");
  }

  const { lat: officeLat, lng: officeLng, radius } = getOfficeLocation();

  const distance = getDistanceInMeters(
    latitude,
    longitude,
    officeLat,
    officeLng
  );

  if (distance > radius) {
    throw new Error(
      `Lokasi di luar radius absensi (${Math.round(distance)}m dari kantor).`
    );
  }

  const { data: existingAttendance, error: fetchError } = await supabase
    .from("absensi")
    .select("*")
    .eq("user_id", user.id)
    .eq("tanggal", today)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existingAttendance?.check_in_at) {
    throw new Error("Kamu belum check-in hari ini.");
  }

  if (existingAttendance.check_out_at) {
    throw new Error("Kamu sudah check-out hari ini.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("absensi")
    .update({
      check_out_at: new Date().toISOString(),
      check_out_lat: latitude,
      check_out_lng: longitude,
      status: "completed",
    })
    .eq("id", existingAttendance.id)
    .select();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!updated || updated.length === 0) {
    throw new Error(
      "Check-out gagal: data tidak dapat diperbarui (kemungkinan diblokir RLS)."
    );
  }

  revalidatePath("/peserta/absensi");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Check-out berhasil",
  };
}

// ---- Izin ------------------------------------------------------

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function submitIzin(formData: FormData): Promise<AttendanceResult> {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();
  const today = getToday();

  const keterangan = formData.get("keterangan");
  const file = formData.get("file");

  if (typeof keterangan !== "string" || keterangan.trim().length < 5) {
    throw new Error("Keterangan wajib diisi (minimal 5 karakter).");
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("File bukti izin wajib diunggah.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file maksimal 5MB.");
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error("Format file harus JPG, PNG, WEBP, atau PDF.");
  }

  const { data: existingAttendance, error: fetchError } = await supabase
    .from("absensi")
    .select("*")
    .eq("user_id", user.id)
    .eq("tanggal", today)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existingAttendance?.check_in_at) {
    throw new Error("Kamu sudah check-in hari ini, tidak bisa mengajukan izin.");
  }

  if (existingAttendance?.status === "izin") {
    throw new Error("Kamu sudah mengajukan izin hari ini.");
  }

  // ---- Upload file ke storage (bucket privat) ----
  const fileExt = file.name.split(".").pop();
  const fileName = `${today}-${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("bukti-izin")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error("Gagal mengunggah file: " + uploadError.message);
  }

  // Catatan: bucket "bukti-izin" bersifat PRIVAT.
  // Yang disimpan di kolom bukti_url di sini adalah PATH file
  // (bukan URL langsung), karena bucket privat tidak punya public URL.
  // Signed URL (link sementara yang bisa dibuka) di-generate on-demand
  // saat halaman menampilkan riwayat — lihat catatan di page.tsx.

  if (existingAttendance) {
    const { data: updated, error: updateError } = await supabase
      .from("absensi")
      .update({
        status: "izin",
        keterangan: keterangan.trim(),
        bukti_url: filePath,
      })
      .eq("id", existingAttendance.id)
      .select();

    if (updateError) {
      throw new Error("Gagal menyimpan pengajuan izin: " + updateError.message);
    }

    if (!updated || updated.length === 0) {
      throw new Error(
        "Pengajuan izin gagal: data tidak dapat diperbarui (kemungkinan diblokir RLS)."
      );
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("absensi")
      .insert({
        user_id: user.id,
        tanggal: today,
        status: "izin",
        keterangan: keterangan.trim(),
        bukti_url: filePath,
      })
      .select();

    if (insertError) {
      throw new Error("Gagal menyimpan pengajuan izin: " + insertError.message);
    }

    if (!inserted || inserted.length === 0) {
      throw new Error(
        "Pengajuan izin gagal: data tidak dapat disimpan (kemungkinan diblokir RLS)."
      );
    }
  }

  revalidatePath("/peserta/absensi");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Pengajuan izin berhasil dikirim.",
  };
}
