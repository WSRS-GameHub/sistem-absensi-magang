"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

type UpdateTugasPayload = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
};

export async function updateTugas(payload: UpdateTugasPayload) {
  await requireRole(["admin"]);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("tugas")
    .update({
      title: payload.title.trim(),
      description: payload.description.trim(),
      due_date: payload.dueDate || null,
    })
    .eq("id", payload.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/tugas");
  revalidatePath(`/admin/tugas/${payload.id}`);

  return {
    success: true,
    message: "Tugas berhasil diperbarui",
  };
}