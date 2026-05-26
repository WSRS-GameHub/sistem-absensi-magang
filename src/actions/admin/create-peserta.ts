"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCredentialPdf } from "@/lib/pdf/generate-credential-pdf";

type CreatePesertaPayload = {
  nama: string;
  username: string;
  jurusan: string;
  instansi: string;
  mulaiMagang: string;
  akhirMagang: string;
  division: "PA" | "TE" | "TEKNIK";
};

function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
  const bytes = randomBytes(length);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }

  return password;
}

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function buildAuthEmail(username: string) {
  const safeUsername = normalizeUsername(username);

  if (!safeUsername) {
    throw new Error("Username tidak valid.");
  }

  return `${safeUsername}@si-magang.local`;
}

export async function createPeserta(payload: CreatePesertaPayload) {
  await requireRole(["admin"]);
  const supabase = createAdminClient();

  const nama = payload.nama.trim();
  const username = normalizeUsername(payload.username);
  const jurusan = payload.jurusan.trim();
  const instansi = payload.instansi.trim();
  const mulaiMagang = payload.mulaiMagang.trim();
  const akhirMagang = payload.akhirMagang.trim();
  const division = payload.division;

  if (!nama) throw new Error("Nama wajib diisi.");
  if (!username) throw new Error("Username wajib diisi.");
  if (!jurusan) throw new Error("Jurusan wajib diisi.");
  if (!instansi) throw new Error("Instansi wajib diisi.");
  if (!mulaiMagang) throw new Error("Tanggal mulai magang wajib diisi.");
  if (!akhirMagang) throw new Error("Tanggal akhir magang wajib diisi.");

  const password = generateRandomPassword(10);
  const email = buildAuthEmail(username);

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingProfile) {
    throw new Error("Username sudah digunakan.");
  }

  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nama,
        username,
        role: "peserta",
        division,
      },
    });

  if (authError || !authUser.user) {
    throw new Error(authError?.message ?? "Gagal membuat akun auth.");
  }

  const userId = authUser.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    nama,
    username,
    email,
    jurusan,
    instansi,
    mulai_magang: mulaiMagang,
    akhir_magang: akhirMagang,
    division,
    role: "peserta",
    first_login: true,
    is_active: true,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  const pdfBuffer = generateCredentialPdf({
    nama,
    username,
    password,
    email,
    division,
    instansi,
  });

  const pdfBytes = Array.from(new Uint8Array(pdfBuffer));

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: "Akun peserta berhasil dibuat.",
    data: {
      userId,
      nama,
      username,
      email,
      password,
      division,
      pdfBytes,
    },
  };
}