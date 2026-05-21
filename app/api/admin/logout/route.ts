import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

function redirectToLogin(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login?loggedOut=1", request.url), { status: 303 });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    maxAge: 0,
    path: "/"
  });

  return response;
}

export async function GET(request: Request) {
  return redirectToLogin(request);
}

export async function POST(request: Request) {
  return redirectToLogin(request);
}
