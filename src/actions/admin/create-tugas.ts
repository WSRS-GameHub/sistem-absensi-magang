"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTaskTargetUsers } from "@/lib/tasks/get-task-target-users";
import type { DivisionType } from "@/types/domain";

type CreateTugasPayload = {
  title: string;
  description: string;
  targetType: "all" | "division" | "individual";
  targetDivision: DivisionType | null;
  dueDate: string | null;
  selectedUserIds: string[];
};

export async function createTugas(payload: CreateTugasPayload) {
  const user = await requireRole(["admin"]);
  const supabase = createAdminClient();

  if (!payload.title.trim()) {
    throw new Error("Judul tugas wajib diisi.");
  }

  if (!payload.description.trim()) {
    throw new Error("Deskripsi tugas wajib diisi.");
  }

  let targetUsers;

  if (payload.targetType === "all") {
    targetUsers = await getTaskTargetUsers({
      assignType: "all",
    });
  } else if (payload.targetType === "division") {
    if (!payload.targetDivision) {
      throw new Error("Divisi wajib dipilih.");
    }

    targetUsers = await getTaskTargetUsers({
      assignType: "division",
      division: payload.targetDivision,
    });
  } else {
    if (!payload.selectedUserIds.length) {
      throw new Error("Pilih minimal 1 peserta.");
    }

    targetUsers = await getTaskTargetUsers({
      assignType: "individual",
      selectedUserIds: payload.selectedUserIds,
    });
  }

  if (!targetUsers.length) {
    throw new Error("Tidak ada peserta target untuk tugas ini.");
  }

  const { data: createdTask, error: taskError } = await supabase
    .from("tugas")
    .insert({
      title: payload.title.trim(),
      description: payload.description.trim(),
      target_type: payload.targetType,
      target_division:
        payload.targetType === "division" ? payload.targetDivision : null,
      due_date: payload.dueDate || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (taskError || !createdTask) {
    throw new Error(taskError?.message ?? "Gagal membuat tugas.");
  }

  const relationRows = targetUsers.map((target) => ({
    tugas_id: createdTask.id,
    user_id: target.id,
    status: "pending",
  }));

  const { error: relationError } = await supabase
    .from("tugas_user")
    .insert(relationRows);

  if (relationError) {
    await supabase.from("tugas").delete().eq("id", createdTask.id);
    throw new Error(relationError.message);
  }

  revalidatePath("/admin/tugas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/peserta/dashboard");
  revalidatePath("/tl/dashboard");

  return {
    success: true,
    message: "Tugas berhasil dibuat",
  };
}