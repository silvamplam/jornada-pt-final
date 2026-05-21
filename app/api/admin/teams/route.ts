import { NextResponse } from "next/server";
import { getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

function cleanText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function POST(request: Request) {
  if (!getSupabaseServiceConfig()) {
    return redirectTo(request, "/admin/clubes?error=missing-service");
  }

  const formData = await request.formData();
  const name = cleanText(formData.get("name"));
  const shortName = cleanText(formData.get("short_name"))?.toUpperCase();
  const slug = cleanText(formData.get("slug")) ?? (name ? slugify(name) : null);

  if (!name || !shortName || !slug) {
    return redirectTo(request, "/admin/clubes?error=missing-fields");
  }

  try {
    await writeSupabaseAdmin("teams", {
      method: "POST",
      body: JSON.stringify({
        name,
        short_name: shortName,
        slug,
        country: cleanText(formData.get("country")),
        logo_url: cleanText(formData.get("logo_url")),
        primary_color: cleanText(formData.get("primary_color"))
      })
    });
  } catch {
    return redirectTo(request, "/admin/clubes?error=save");
  }

  return redirectTo(request, "/admin/clubes?created=1");
}
