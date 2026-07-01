"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function updatePesertaAvatar(formData: FormData) {
  const user = await requireRole(["peserta"]);
  const supabase = createAdminClient();

  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    throw new Error("File foto tidak ditemukan.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format file harus JPG, PNG, atau WEBP.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran file maksimal 2MB.");
  }

  const ext = file.name.split(".").pop();
  const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/peserta/profile");
  revalidatePath("/peserta/edit-profile");
  revalidatePath("/peserta/dashboard");

  return {
    success: true,
    message: "Foto profil berhasil diperbarui.",
    avatarUrl,
  };
}