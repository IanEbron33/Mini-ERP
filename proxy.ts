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
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 1. Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const userRole = user?.user_metadata?.role || "Sales";

  // Helper to determine home dashboard for any role
  const getRoleLandingUrl = (role: string) => {
    if (role === "Admin") return "/admin/dashboard";
    if (role === "Inventory") return "/inventory/overview";
    return "/sales/overview";
  };

  // 2. If visiting root /, redirect to login or role portal
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL(getRoleLandingUrl(userRole), request.url));
  }

  // 3. Protected route definitions
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/inventory");

  // Unauthenticated users attempting to access protected routes
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Authenticated users visiting /login -> redirect to their portal home
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL(getRoleLandingUrl(userRole), request.url));
  }

  // 5. Granular Role-Based Access Control (RBAC) Guard
  if (user && isProtectedRoute) {
    // Admin has full enterprise access across all portals
    if (userRole === "Admin") {
      return response;
    }

    // Sales Representative restrictions
    if (userRole === "Sales") {
      // Cannot access admin suite -> redirect to sales overview
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/sales/overview", request.url));
      }
      // Direct access to write inventory routes (/inventory/*) -> redirect to dedicated read-only view (/sales/inventory)
      if (pathname.startsWith("/inventory")) {
        return NextResponse.redirect(new URL("/sales/inventory", request.url));
      }
    }

    // Inventory Manager restrictions
    if (userRole === "Inventory") {
      // Cannot access admin suite -> redirect to inventory overview
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/inventory/overview", request.url));
      }
      // Cannot access sales operations suite (/sales/*) -> redirect to inventory overview
      if (pathname.startsWith("/sales")) {
        return NextResponse.redirect(new URL("/inventory/overview", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
