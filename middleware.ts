import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (
    (!isAdminPage && !isAdminApi) ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (await verifyAdminSession(session)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", isAdminApi ? "/admin/clubes" : `${pathname}${search}`);

  return NextResponse.redirect(loginUrl, { status: 303 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
