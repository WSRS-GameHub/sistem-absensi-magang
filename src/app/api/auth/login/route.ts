import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getDashboardPath, usernameToEmail } from "@/lib/auth/role";

const loginSchema = z.object({
  username: z.string().min(3, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
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