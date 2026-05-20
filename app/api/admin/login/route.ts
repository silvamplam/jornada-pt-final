import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession
} from "@/lib/admin-session";

function getSafeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/admin") || value.startsWith("/admin/login")) {
    return "/admin";
  }

  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");
  const nextPath = getSafeNext(formData.get("next"));
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.redirect(new URL("/admin/login?error=missing", request.url), { status: 303 });
  }

  if (typeof password !== "string" || password !== expectedPassword) {
    const loginUrl = new URL("/admin/login?error=invalid", request.url);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  const session = await createAdminSession();

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: session,
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
