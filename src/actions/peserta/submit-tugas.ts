"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

type SubmitTugasPayload = {
  taskId: string;
  submissionText: string;
};

export async function submitTugas(payload: SubmitTugasPayload) {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();

  const { data: taskUser, error: fetchError } = await supabase
    .from("tugas_user")
    .select("id, status")
    .eq("tugas_id", payload.taskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!taskUser) {
    throw new Error("Tugas tidak ditemukan.");
  }

  if (taskUser.status === "pending") {
    throw new Error("Silakan mulai kerjakan tugas terlebih dahulu.");
  }

  if (taskUser.status === "submitted" || taskUser.status === "selesai") {
    throw new Error("Tugas sudah dikirim atau selesai.");
  }

  const { error: updateError } = await supabase
    .from("tugas_user")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submission_text: payload.submissionText.trim(),
    })
    .eq("id", taskUser.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/peserta/tugas");
  revalidatePath(`/peserta/tugas/${payload.taskId}`);
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Tugas berhasil dikirim.",
  };
}