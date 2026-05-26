import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createAdminClient } from "../src/lib/supabase/admin";

type SeedUser = {
  username: string;
  password: string;
  nama: string;
  role: "admin" | "tl" | "manager" | "peserta";
  division: "PA" | "TE" | "TEKNIK" | null;
  jurusan?: string | null;
  instansi?: string | null;
  mulai_magang?: string | null;
  akhir_magang?: string | null;
  first_login: boolean;
  must_change_password: boolean;
};

const seedUsers: SeedUser[] = [
  {
    username: "1001",
    password: "Admin123!",
    nama: "Admin Utama",
    role: "admin",
    division: null,
    first_login: false,
    must_change_password: false,
  },
  {
    username: "5001",
    password: "TlPA123!",
    nama: "Team Leader PA",
    role: "tl",
    division: "PA",
    first_login: false,
    must_change_password: false,
  },
  {
    username: "5002",
    password: "TlTE123!",
    nama: "Team Leader TE",
    role: "tl",
    division: "TE",
    first_login: false,
    must_change_password: false,
  },
  {
    username: "5003",
    password: "TlTeknik123!",
    nama: "Team Leader Teknik",
    role: "tl",
    division: "TEKNIK",
    first_login: false,
    must_change_password: false,
  },
  {
    username: "3001",
    password: "Manager123!",
    nama: "Manager Sistem",
    role: "manager",
    division: null,
    first_login: false,
    must_change_password: false,
  },
  {
    username: "4001",
    password: "Peserta123!",
    nama: "Peserta Satu",
    role: "peserta",
    division: "PA",
    jurusan: "RPL",
    instansi: "SMK Contoh",
    mulai_magang: "2026-05-01",
    akhir_magang: "2026-08-01",
    first_login: true,
    must_change_password: true,
  },
  {
    username: "4002",
    password: "Peserta123!",
    nama: "Peserta Dua",
    role: "peserta",
    division: "TE",
    jurusan: "TKJ",
    instansi: "SMK Contoh",
    mulai_magang: "2026-05-01",
    akhir_magang: "2026-08-01",
    first_login: true,
    must_change_password: true,
  },
  {
    username: "4003",
    password: "Peserta123!",
    nama: "Peserta Tiga",
    role: "peserta",
    division: "TEKNIK",
    jurusan: "Teknik Mesin",
    instansi: "SMK Contoh",
    mulai_magang: "2026-05-01",
    akhir_magang: "2026-08-01",
    first_login: true,
    must_change_password: true,
  },
];

function internalEmail(username: string) {
  return `${username}@si-magang.local`;
}

async function findUserByEmail(supabase: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (error) {
    throw new Error(`Gagal mengambil daftar user: ${error.message}`);
  }

  return data.users.find((user) => user.email === email) ?? null;
}

async function main() {
  const supabase = createAdminClient();

  for (const user of seedUsers) {
    const email = internalEmail(user.username);

    const existingUser = await findUserByEmail(supabase, email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
        email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          nama: user.nama,
          role: user.role,
          division: user.division,
          first_login: user.first_login,
          must_change_password: user.must_change_password,
        },
      });

      if (updateAuthError) {
        console.error(`Gagal update auth user ${user.username}:`, updateAuthError.message);
        continue;
      }
    } else {
      const { data: createdUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            username: user.username,
            nama: user.nama,
            role: user.role,
            division: user.division,
            first_login: user.first_login,
            must_change_password: user.must_change_password,
          },
        });

      if (createError) {
        console.error(`Gagal membuat auth user ${user.username}:`, createError.message);
        continue;
      }

      if (!createdUser.user) {
        console.error(`User ${user.username} tidak terbentuk.`);
        continue;
      }

      userId = createdUser.user.id;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      username: user.username,
      nama: user.nama,
      jurusan: user.jurusan ?? null,
      instansi: user.instansi ?? null,
      mulai_magang: user.mulai_magang ?? null,
      akhir_magang: user.akhir_magang ?? null,
      role: user.role,
      division: user.division,
      first_login: user.first_login,
      must_change_password: user.must_change_password,
      is_active: true,
    });

    if (profileError) {
      console.error(`Gagal insert/update profile ${user.username}:`, profileError.message);
      continue;
    }

    console.log(`Berhasil seed: ${user.username} (${user.role}${user.division ? ` - ${user.division}` : ""})`);
  }

  console.log("Seed selesai.");
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});