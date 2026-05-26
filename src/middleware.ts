import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getDashboardPath, getRolePrefix, type UserRole } from "@/lib/auth/role";

const PUBLIC_PATHS = ["/login", "/unauthorized"];
const AUTH_PATHS = ["/change-password"];
const ROLE_PATHS: UserRole[] = ["admin", "tl", "peserta", "manager"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const isProtectedRolePath = ROLE_PATHS.some((role) =>
      pathname.startsWith(getRolePrefix(role))
    );

    if (isProtectedRolePath || AUTH_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_login")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = profile.role as UserRole;

  if (profile.first_login && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (pathname === "/" || pathname === "/login") {
    return NextResponse.redirect(
      new URL(getDashboardPath(role), request.url)
    );
  }

  const rolePrefix = getRolePrefix(role);

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/tl") && role !== "tl" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/peserta") && role !== "peserta" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/manager") && role !== "manager" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && profile.first_login === false) {
    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};