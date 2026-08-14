import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value)
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. If visiting root /, redirect to login or overview
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    } else {
      const role = user.user_metadata?.role || "Sales";
      const target =
        role === "Admin"
          ? "/admin/dashboard"
          : role === "Inventory"
          ? "/inventory/overview"
          : "/sales/overview";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // 2. Protected Routes Guard: /admin, /sales, /inventory
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/inventory");

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Prevent logged-in users from visiting /login page
  if (pathname === "/login" && user) {
    const role = user.user_metadata?.role || "Sales";
    const target =
      role === "Admin"
        ? "/admin/dashboard"
        : role === "Inventory"
        ? "/inventory/overview"
        : "/sales/overview";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 4. Role-based Route Restriction
  if (user && isProtectedRoute) {
    const userRole = user.user_metadata?.role || "Sales";

    if (pathname.startsWith("/admin") && userRole !== "Admin") {
      const fallback =
        userRole === "Inventory" ? "/inventory/overview" : "/sales/overview";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
