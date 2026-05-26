"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

type ApproveTugasPayload = {
  taskUserId: string;
  taskId: string;
  role: "admin" | "tl";
};

export async function approveTugas(payload: ApproveTugasPayload) {
  await requireRole([payload.role]);
  const supabase = createAdminClient();

  const { data: currentRow, error: fetchError } = await supabase
    .from("tugas_user")
    .select("id, status")
    .eq("id", payload.taskUserId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!currentRow) {
    throw new Error("Data tugas tidak ditemukan.");
  }

  if (currentRow.status !== "submitted") {
    throw new Error("Hanya tugas yang sudah dikirim yang bisa diselesaikan.");
  }

  const { error: updateError } = await supabase
    .from("tugas_user")
    .update({
      status: "selesai",
      selesai_at: new Date().toISOString(),
    })
    .eq("id", payload.taskUserId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/tugas");
  revalidatePath("/tl/tugas");
  revalidatePath("/peserta/tugas");
  revalidatePath(`/admin/tugas/${payload.taskId}`);
  revalidatePath(`/tl/tugas/${payload.taskId}`);
  revalidatePath(`/peserta/tugas/${payload.taskId}`);

  return {
    success: true,
    message: "Tugas berhasil diselesaikan.",
  };
}