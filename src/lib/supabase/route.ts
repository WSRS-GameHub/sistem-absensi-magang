import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export function createRouteSupabaseClient(
  request: NextRequest,
  onCookiesToSet: (cookies: CookieToSet[]) => void
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          onCookiesToSet(cookiesToSet as CookieToSet[]);
        },
      },
    }
  );
}