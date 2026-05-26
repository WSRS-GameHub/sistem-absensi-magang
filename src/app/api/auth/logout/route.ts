import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function POST(request: NextRequest) {
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  const supabase = createRouteSupabaseClient(request, (cookies) => {
    cookiesToSet.push(...cookies);
  });

  await supabase.auth.signOut();

  const response = NextResponse.json({
    ok: true,
  });

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}