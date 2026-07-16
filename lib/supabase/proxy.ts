import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set(["/login", "/signup", "/forgot-password", "/reset-password"]);

function isPublicPath(pathname: string) {
  return publicPaths.has(pathname) || pathname.startsWith("/auth/") || pathname.startsWith("/api/health");
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  if (!url || !key) {
    if (isPublicPath(pathname)) return NextResponse.next({ request });
    const login = new URL("/login", request.url);
    login.searchParams.set("error", "configuration");
    return NextResponse.redirect(login);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const authenticated = Boolean(data?.claims?.sub);

  if (!authenticated && !isPublicPath(pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (authenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return response;
}
