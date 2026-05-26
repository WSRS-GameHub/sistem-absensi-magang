"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

type UpdatePengumumanPayload = {
  id: string;
  title: string;
  content: string;
  jenis: "pengumuman" | "pemberitahuan";
  tanggalEvent: string | null;
};

export async function updatePengumumanAdmin(
  payload: UpdatePengumumanPayload
) {
  await requireRole(["admin"]);
  const supabase = createAdminClient();

  if (!payload.title.trim()) {
    throw new Error("Judul wajib diisi.");
  }

  if (!payload.content.trim()) {
    throw new Error("Isi wajib diisi.");
  }

  const { error } = await supabase
    .from("pengumuman")
    .update({
      title: payload.title.trim(),
      content: payload.content.trim(),
      jenis: payload.jenis,
      tanggal_event: payload.tanggalEvent || null,
      is_important: payload.jenis === "pemberitahuan",
    })
    .eq("id", payload.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pengumuman");
  revalidatePath("/admin/dashboard");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Pengumuman berhasil diperbarui.",
  };
}