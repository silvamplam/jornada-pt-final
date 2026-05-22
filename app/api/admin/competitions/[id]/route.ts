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

type UpdateCompetitionContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: UpdateCompetitionContext) {
  if (!getSupabaseServiceConfig()) {
    return redirectTo(request, "/admin/competicoes?error=missing-service");
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const name = cleanText(formData.get("name"));
  const slug = cleanText(formData.get("slug")) ?? (name ? slugify(name) : null);

  if (!id || !name || !slug) {
    return redirectTo(request, "/admin/competicoes?error=missing-fields");
  }

  try {
    await writeSupabaseAdmin(`competitions?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        slug,
        country: cleanText(formData.get("country")),
        logo_url: cleanText(formData.get("logo_url")),
        accent_color: cleanText(formData.get("accent_color")),
        is_active: cleanText(formData.get("is_active")) !== "false"
      })
    });
  } catch {
    return redirectTo(request, "/admin/competicoes?error=save");
  }

  return redirectTo(request, "/admin/competicoes?updated=1");
}
