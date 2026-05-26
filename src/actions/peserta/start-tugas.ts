"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export async function startTugas(taskId: string) {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();

  const { data: taskUser, error: fetchError } = await supabase
    .from("tugas_user")
    .select("id, status")
    .eq("tugas_id", taskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!taskUser) {
    throw new Error("Tugas tidak ditemukan.");
  }

  if (taskUser.status === "submitted" || taskUser.status === "selesai") {
    throw new Error("Tugas sudah diproses.");
  }

  if (taskUser.status === "in_progress") {
    return {
      success: true,
      message: "Tugas sudah ditandai sedang dikerjakan.",
    };
  }

  const { error: updateError } = await supabase
    .from("tugas_user")
    .update({
      status: "in_progress",
    })
    .eq("id", taskUser.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/peserta/tugas");
  revalidatePath(`/peserta/tugas/${taskId}`);
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Tugas ditandai sedang dikerjakan.",
  };
}