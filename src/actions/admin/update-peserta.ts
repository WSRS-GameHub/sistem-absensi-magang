"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

type UpdatePesertaPayload = {
  id: string;
  nama: string;
  username: string;
  email: string;
  jurusan: string;
  instansi: string;
  division: "PA" | "TE" | "TEKNIK";
  mulai_magang: string;
  akhir_magang: string;
};

function internalEmail(username: string) {
  return `${username.trim().toLowerCase()}@si-magang.local`;
}

export async function updatePeserta(payload: UpdatePesertaPayload) {
  const supabase = createAdminClient();

  const id = payload.id.trim();
  const username = payload.username.trim();
  const email = payload.email.trim().toLowerCase();
  const authEmail = internalEmail(username);

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (currentProfileError || !currentProfile) {
    throw new Error("Data peserta tidak ditemukan.");
  }

  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", id)
    .maybeSingle();

  if (existingUsername) {
    throw new Error("NIM / NISN sudah terdaftar.");
  }

  const { data: existingEmail } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .neq("id", id)
    .maybeSingle();

  if (existingEmail) {
    throw new Error("Email sudah terdaftar.");
  }

  const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw new Error("Gagal memeriksa akun yang sudah ada.");
  }

  const duplicateAuthUser = allUsers.users.find(
    (user) => user.email === authEmail && user.id !== id
  );

  if (duplicateAuthUser) {
    throw new Error("NIM / NISN sudah terdaftar.");
  }

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
    email: authEmail,
    email_confirm: true,
    user_metadata: {
      username,
      role: "peserta",
    },
  });

  if (authUpdateError) {
    throw new Error(authUpdateError.message);
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      nama: payload.nama,
      username,
      email,
      jurusan: payload.jurusan,
      instansi: payload.instansi,
      division: payload.division,
      mulai_magang: payload.mulai_magang,
      akhir_magang: payload.akhir_magang,
    })
    .eq("id", id);

  if (profileUpdateError) {
    await supabase.auth.admin.updateUserById(id, {
      email: internalEmail(currentProfile.username),
      email_confirm: true,
      user_metadata: {
        username: currentProfile.username,
        role: "peserta",
      },
    });

    throw new Error(profileUpdateError.message);
  }

  revalidatePath("/admin/users");

  return {
    success: true,
  };
}