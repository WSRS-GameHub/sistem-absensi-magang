"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deletePeserta(id: string) {
  const supabase = createAdminClient();

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);

  if (authDeleteError) {
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileDeleteError) {
      throw new Error(profileDeleteError.message);
    }

    revalidatePath("/admin/users");
    return { success: true };
  }

  const { error: profileDeleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (profileDeleteError) {
    throw new Error(profileDeleteError.message);
  }

  revalidatePath("/admin/users");

  return {
    success: true,
  };
}