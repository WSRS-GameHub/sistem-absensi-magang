import { createAdminClient } from "@/lib/supabase/admin";
import type { DivisionType } from "@/types/domain";

export type TaskTargetUser = {
  id: string;
  nama: string;
  username: string;
  division: DivisionType | null;
  mulai_magang: string | null;
  akhir_magang: string | null;
};

/**
 * Peserta dianggap sedang aktif magang jika:
 * - is_active bernilai true, DAN
 * - tanggal hari ini berada di antara mulai_magang dan akhir_magang
 *   (jika salah satu tanggal kosong, dianggap tidak membatasi arah tersebut)
 */
function isCurrentlyActiveMagang(user: {
  mulai_magang: string | null;
  akhir_magang: string | null;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (user.mulai_magang) {
    const mulai = new Date(user.mulai_magang);
    if (mulai > today) return false;
  }

  if (user.akhir_magang) {
    const akhir = new Date(user.akhir_magang);
    if (akhir < today) return false;
  }

  return true;
}

export async function getTaskTargetUsers(params: {
  assignType: "all" | "division" | "individual";
  division?: DivisionType | null;
  selectedUserIds?: string[];
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("profiles")
    .select("id, nama, username, division, mulai_magang, akhir_magang")
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

  const participants = (data ?? []) as TaskTargetUser[];

  // Khusus target "Semua Peserta": hanya sertakan peserta yang benar-benar
  // sedang dalam periode magang aktif (mulai_magang <= hari ini <= akhir_magang).
  if (params.assignType === "all") {
    return participants.filter(isCurrentlyActiveMagang);
  }

  return participants;
}
