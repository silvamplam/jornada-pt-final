import { NextResponse } from "next/server";
import { fetchSupabaseAdminTable, getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

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

async function hasRows(path: string) {
  const rows = await fetchSupabaseAdminTable<{ id: string }>(`${path}&limit=1`);
  return rows.length > 0;
}

type UpdateTeamContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: UpdateTeamContext) {
  if (!getSupabaseServiceConfig()) {
    return redirectTo(request, "/admin/clubes?error=missing-service");
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const actionType = cleanText(formData.get("action_type"));

  if (actionType === "delete") {
    if (!id) {
      return redirectTo(request, "/admin/clubes?error=missing-fields#clubes-existentes");
    }

    const encodedId = encodeURIComponent(id);

    try {
      const hasDependencies =
        (await hasRows(`season_teams?select=id&team_id=eq.${encodedId}`)) ||
        (await hasRows(`matches?select=id&or=(home_team_id.eq.${encodedId},away_team_id.eq.${encodedId})`)) ||
        (await hasRows(`standing_rows?select=id&team_id=eq.${encodedId}`));

      if (hasDependencies) {
        return redirectTo(request, "/admin/clubes?error=team-has-dependencies#clubes-existentes");
      }

      await writeSupabaseAdmin(`teams?id=eq.${encodedId}`, {
        method: "DELETE"
      });
    } catch {
      return redirectTo(request, "/admin/clubes?error=delete#clubes-existentes");
    }

    return redirectTo(request, "/admin/clubes?deleted=1#clubes-existentes");
  }

  const name = cleanText(formData.get("name"));
  const shortName = cleanText(formData.get("short_name"))?.toUpperCase();
  const slug = cleanText(formData.get("slug")) ?? (name ? slugify(name) : null);

  if (!id || !name || !shortName || !slug) {
    return redirectTo(request, "/admin/clubes?error=missing-fields");
  }

  try {
    await writeSupabaseAdmin(`teams?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
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

  return redirectTo(request, "/admin/clubes?updated=1");
}
