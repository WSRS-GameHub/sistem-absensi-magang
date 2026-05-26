"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

type UpdateProfilePayload = {
  nama: string;
  email: string;
  phone: string;
};

export async function updatePesertaProfile(payload: UpdateProfilePayload) {
  const user = await requireRole(["peserta"]);
  const supabase = createAdminClient();

  const nama = payload.nama.trim();
  const email = payload.email.trim();
  const phone = payload.phone.trim();

  if (!nama) {
    throw new Error("Nama wajib diisi.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nama,
      email: email || null,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/peserta/profile");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Profile berhasil diperbarui.",
  };
}