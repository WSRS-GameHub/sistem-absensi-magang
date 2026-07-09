import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getDashboardPath, usernameToEmail } from "@/lib/auth/role";

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  tl: "Team Leader",
  manager: "Manager",
  peserta: "Peserta Magang",
};

const loginSchema = z.object({
  username: z.string().min(3, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  role: z.enum(["admin", "tl", "peserta", "manager"], {
    error: "Peran tidak valid. Silakan pilih peran dari halaman awal.",
  }),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data login tidak valid",
      },
      { status: 400 }
    );
  }

  const cookiesToSet: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  const supabase = createRouteSupabaseClient(request, (cookies) => {
    cookiesToSet.push(...cookies);
  });

  const normalizedUsername = parsed.data.username.trim().toLowerCase();
  const email = usernameToEmail(normalizedUsername);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      {
        ok: false,
        message: "Username atau password salah",
      },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, first_login")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      {
        ok: false,
        message: "Profil user belum ditemukan. Hubungi admin.",
      },
      { status: 403 }
    );
  }

  // ---- Validasi: role yang dipilih di halaman awal harus sama
  //      dengan role asli akun ini di database. ----
  if (profile.role !== parsed.data.role) {
    // Batalkan sesi yang baru dibuat supaya tidak ada cookie/token
    // tersisa untuk akun yang gagal validasi role.
    await supabase.auth.signOut();

    const akunLabel = roleLabels[profile.role] ?? profile.role;

    return NextResponse.json(
      {
        ok: false,
        message: `Akun ini terdaftar sebagai ${akunLabel}. Silakan login melalui halaman peran ${akunLabel}.`,
      },
      { status: 403 }
    );
  }

  const payload = {
    ok: true,
    needsPasswordChange: profile.first_login,
    role: profile.role,
    redirectTo: profile.first_login
      ? "/change-password"
      : getDashboardPath(profile.role),
  };

  const response = NextResponse.json(payload, { status: 200 });

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
