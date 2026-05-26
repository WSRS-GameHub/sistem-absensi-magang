"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deletePengumumanTL(id: string) {
  await requireRole(["tl"]);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("pengumuman")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tl/pengumuman");
  revalidatePath("/tl/dashboard");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Pengumuman berhasil dihapus.",
  };
}