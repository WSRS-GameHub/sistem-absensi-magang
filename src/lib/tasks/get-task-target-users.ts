import { createAdminClient } from "@/lib/supabase/admin";
import type { DivisionType } from "@/types/domain";

export type TaskTargetUser = {
  id: string;
  nama: string;
  username: string;
  division: DivisionType | null;
};

export async function getTaskTargetUsers(params: {
  assignType: "all" | "division" | "individual";
  division?: DivisionType | null;
  selectedUserIds?: string[];
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("profiles")
    .select("id, nama, username, division")
    .eq("role", "peserta")
    .eq("is_active", true);

  if (params.assignType === "division" && params.division) {
    query = query.eq("division", params.division);
  }

  if (
    params.assignType === "individual" &&
    params.selectedUserIds &&
    params.selectedUserIds.length > 0
  ) {
    query = query.in("id", params.selectedUserIds);
  }

  const { data, error } = await query.order("nama", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TaskTargetUser[];
}