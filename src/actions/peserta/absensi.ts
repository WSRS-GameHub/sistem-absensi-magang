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

  if (existingAttendance) {
    const { error: updateError } = await supabase
      .from("absensi")
      .update({
        check_in_at: new Date().toISOString(),
        check_in_lat: latitude,
        check_in_lng: longitude,
        status: "checked_in",
      })
      .eq("id", existingAttendance.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await supabase.from("absensi").insert({
      user_id: user.id,
      tanggal: today,
      check_in_at: new Date().toISOString(),
      check_in_lat: latitude,
      check_in_lng: longitude,
      status: "checked_in",
    });

    if (insertError) {
      throw new Error(insertError.message);
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

  const { error: updateError } = await supabase
    .from("absensi")
    .update({
      check_out_at: new Date().toISOString(),
      check_out_lat: latitude,
      check_out_lng: longitude,
      status: "completed",
    })
    .eq("id", existingAttendance.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/peserta/absensi");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Check-out berhasil",
  };
}