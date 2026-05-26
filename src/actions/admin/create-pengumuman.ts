"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAllActiveParticipants } from "@/lib/pengumuman/notify-participants";

type CreatePengumumanPayload = {
  title: string;
  content: string;
  jenis: "pengumuman" | "pemberitahuan";
  tanggalEvent: string | null;
};

export async function createPengumumanAdmin(
  payload: CreatePengumumanPayload
) {
  const user = await requireRole(["admin"]);
  const supabase = createAdminClient();

  if (!payload.title.trim()) {
    throw new Error("Judul wajib diisi.");
  }

  if (!payload.content.trim()) {
    throw new Error("Isi wajib diisi.");
  }

  const { data, error } = await supabase
    .from("pengumuman")
    .insert({
      title: payload.title.trim(),
      content: payload.content.trim(),
      jenis: payload.jenis,
      tanggal_event: payload.tanggalEvent || null,
      is_important: payload.jenis === "pemberitahuan",
      created_by: user.id,
    })
    .select("id, title, content, jenis, tanggal_event")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (payload.jenis === "pemberitahuan") {
    await notifyAllActiveParticipants({
      title: data?.title ?? payload.title.trim(),
      content: data?.content ?? payload.content.trim(),
      jenis: "pemberitahuan",
      tanggalEvent: data?.tanggal_event ?? payload.tanggalEvent,
    });
  }

  revalidatePath("/admin/pengumuman");
  revalidatePath("/admin/dashboard");
  revalidatePath("/peserta/dashboard");
  revalidatePath("/peserta/notifikasi");

  return {
    success: true,
    message:
      payload.jenis === "pemberitahuan"
        ? "Pemberitahuan berhasil dibuat dan dikirim ke peserta."
        : "Pengumuman berhasil dibuat.",
  };
}