import { createAdminClient } from "@/lib/supabase/admin";

type AnnouncementKind = "pengumuman" | "pemberitahuan";

type NotifyPayload = {
  title: string;
  content: string;
  jenis: AnnouncementKind;
  tanggalEvent: string | null;
};

function formatTanggal(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function notifyAllActiveParticipants(payload: NotifyPayload) {
  const supabase = createAdminClient();

  const { data: participants, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "peserta")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  if (!participants?.length) {
    return;
  }

  const eventText = payload.tanggalEvent
    ? ` (${formatTanggal(payload.tanggalEvent)})`
    : "";

  const message =
    payload.jenis === "pemberitahuan"
      ? `${payload.title}${eventText}`
      : payload.content;

  const rows = participants.map((participant) => ({
    user_id: participant.id,
    type: "pemberitahuan",
    title: "Pemberitahuan baru",
    message,
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase
    .from("notifikasi")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}