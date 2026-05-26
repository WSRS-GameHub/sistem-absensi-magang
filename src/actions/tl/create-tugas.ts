"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { getTLScope } from "@/lib/auth/get-tl-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTaskTargetUsers } from "@/lib/tasks/get-task-target-users";
import type { DivisionType } from "@/types/domain";

type CreateTugasPayload = {
  title: string;
  description: string;
  targetType: "division" | "individual";
  targetDivision: DivisionType | null;
  dueDate: string | null;
  selectedUserIds: string[];
};

export async function createTugasTL(payload: CreateTugasPayload) {
  const user = await requireRole(["tl"]);
  const { division } = await getTLScope();
  const supabase = createAdminClient();

  if (!payload.title.trim()) {
    throw new Error("Judul tugas wajib diisi.");
  }

  if (!payload.description.trim()) {
    throw new Error("Deskripsi tugas wajib diisi.");
  }

  let targetUsers;

  if (payload.targetType === "division") {
    targetUsers = await getTaskTargetUsers({
      assignType: "division",
      division,
    });
  } else {
    if (!payload.selectedUserIds.length) {
      throw new Error("Pilih minimal 1 peserta.");
    }

    targetUsers = await getTaskTargetUsers({
      assignType: "individual",
      selectedUserIds: payload.selectedUserIds,
    });

    const invalidUser = targetUsers.find(
      (target) => target.division !== division
    );

    if (invalidUser) {
      throw new Error("Peserta yang dipilih harus dari divisi TL sendiri.");
    }
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
      target_division: payload.targetType === "division" ? division : null,
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

  revalidatePath("/tl/tugas");
  revalidatePath("/tl/dashboard");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Tugas berhasil dibuat",
  };
}