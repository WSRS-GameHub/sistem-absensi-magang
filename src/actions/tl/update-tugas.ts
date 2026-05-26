"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { getTLScope } from "@/lib/auth/get-tl-scope";
import { createAdminClient } from "@/lib/supabase/admin";

type UpdateTugasPayload = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
};

export async function updateTugasTL(payload: UpdateTugasPayload) {
  await requireRole(["tl"]);
  const { division } = await getTLScope();
  const supabase = createAdminClient();

  const { data: task, error: fetchError } = await supabase
    .from("tugas")
    .select("id, target_type, target_division")
    .eq("id", payload.id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!task) throw new Error("Tugas tidak ditemukan.");

  const isAllowed =
    (task.target_type === "division" &&
      task.target_division === division) ||
    (task.target_type === "individual" &&
      (await canTLAccessIndividualTask(supabase, payload.id, division)));

  if (!isAllowed) {
    throw new Error("Kamu tidak punya akses untuk mengubah tugas ini.");
  }

  const { error } = await supabase
    .from("tugas")
    .update({
      title: payload.title.trim(),
      description: payload.description.trim(),
      due_date: payload.dueDate || null,
    })
    .eq("id", payload.id);

  if (error) throw new Error(error.message);

  revalidatePath("/tl/tugas");
  revalidatePath(`/tl/tugas/${payload.id}`);

  return { success: true, message: "Tugas berhasil diperbarui" };
}

async function canTLAccessIndividualTask(
  supabase: ReturnType<typeof createAdminClient>,
  taskId: string,
  division: "PA" | "TE" | "TEKNIK"
) {
  const { data: taskUsers, error } = await supabase
    .from("tugas_user")
    .select("user_id")
    .eq("tugas_id", taskId);

  if (error) throw new Error(error.message);
  if (!taskUsers?.length) return false;

  const userIds = taskUsers.map((item) => item.user_id);

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, division")
    .in("id", userIds);

  if (profileError) throw new Error(profileError.message);

  return (profiles ?? []).every((item) => item.division === division);
}