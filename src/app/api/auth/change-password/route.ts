import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getDashboardPath } from "@/lib/auth/role";

const schema = z.object({
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password harus sama",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data tidak valid",
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

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sesi tidak valid, silakan login ulang.",
      },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      {
        ok: false,
        message: "Profil user tidak ditemukan.",
      },
      { status: 403 }
    );
  }

  const { error: updatePasswordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (updatePasswordError) {
    return NextResponse.json(
      {
        ok: false,
        message: updatePasswordError.message,
      },
      { status: 400 }
    );
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      first_login: false,
      must_change_password: false,
    })
    .eq("id", userData.user.id);

  if (updateProfileError) {
    return NextResponse.json(
      {
        ok: false,
        message: updateProfileError.message,
      },
      { status: 400 }
    );
  }

  const payload = {
    ok: true,
    redirectTo: getDashboardPath(profile.role),
  };

  const response = NextResponse.json(payload, { status: 200 });

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}