import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = ["/dashboard", "/booking", "/tracking", "/history", "/payment", "/worker", "/admin"].some(p => pathname.startsWith(p));
  const isAuth = ["/login", "/register", "/verify"].some(p => pathname.startsWith(p));

  // Публичные страницы (лендинг, pricing, telegram и т.д.) не нуждаются в
  // проверке авторизации — пропускаем без похода к Supabase, иначе каждый
  // переход по сайту тратил бы лишний сетевой round-trip впустую
  if (!isProtected && !isAuth) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → to login
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in → redirect away from auth pages based on role
  if (isAuth && user) {
    const role = user.user_metadata?.role ?? "USER";
    if (role === "WORKER") return NextResponse.redirect(new URL("/worker", request.url));
    if (role === "ADMIN")  return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based route protection
  if (user) {
    const role = user.user_metadata?.role ?? "USER";
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/worker") && role !== "WORKER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
