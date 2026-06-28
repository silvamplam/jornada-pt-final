import { NextRequest, NextResponse } from "next/server";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasRouteHandlerClient
} from "@/lib/portal-escolas/auth";

export const dynamic = "force-dynamic";

function redirectToLogin(request: NextRequest, status: string) {
  const loginUrl = new URL(PORTAL_ESCOLAS_LOGIN_PATH, request.url);
  loginUrl.searchParams.set("status", status);

  return NextResponse.redirect(loginUrl, { status: 303 });
}

function redirectToPanel(request: NextRequest) {
  return NextResponse.redirect(new URL(PORTAL_ESCOLAS_PANEL_PATH, request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError =
    requestUrl.searchParams.get("error") ??
    requestUrl.searchParams.get("error_code") ??
    requestUrl.searchParams.get("error_description");

  if (authError) {
    return redirectToLogin(request, "callback-error");
  }

  if (!code) {
    return redirectToLogin(request, "missing-code");
  }

  const response = redirectToPanel(request);
  const supabase = createPortalEscolasRouteHandlerClient(request, response);

  if (!supabase) {
    return redirectToLogin(request, "not-configured");
  }

  let exchangeFailed = false;

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeFailed = Boolean(error);
  } catch {
    exchangeFailed = true;
  }

  if (exchangeFailed) {
    return redirectToLogin(request, "callback-error");
  }

  return response;
}
