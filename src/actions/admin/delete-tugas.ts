"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteTugas(id: string) {
  await requireRole(["admin"]);
  const supabase = createAdminClient();

  const { error } = await supabase.from("tugas").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/tugas");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: "Tugas berhasil dihapus",
  };
}