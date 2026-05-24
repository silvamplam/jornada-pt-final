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

type TeamAssetRow = {
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

type ExistingTeam = {
  id: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
};

function parseTeamAssetRows(raw: string | null) {
  const rows: TeamAssetRow[] = [];
  const seenSlugs = new Set<string>();
  let invalid = 0;

  for (const line of (raw ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const [slugValue, logoValue, colorValue] = trimmed.split(";");
    const slug = slugValue?.trim();
    const logoUrl = logoValue?.trim() || null;
    const primaryColor = colorValue?.trim() || null;

    if (!slug || (!logoUrl && !primaryColor) || seenSlugs.has(slug)) {
      invalid += 1;
      continue;
    }

    seenSlugs.add(slug);
    rows.push({ slug, logoUrl, primaryColor });
  }

  return { rows, invalid };
}

async function updateTeamAssets(request: Request, formData: FormData) {
  const { rows, invalid } = parseTeamAssetRows(cleanText(formData.get("team_assets")));

  if (rows.length === 0) {
    return redirectTo(request, `/admin/clubes?assets_updated=0&assets_existing=0&assets_missing=0&assets_invalid=${invalid}`);
  }

  const slugFilter = rows.map((row) => encodeURIComponent(row.slug)).join(",");
  const existingTeams = await fetchSupabaseAdminTable<ExistingTeam>(
    `teams?select=id,slug,logo_url,primary_color&slug=in.(${slugFilter})&limit=1000`
  );
  const teamsBySlug = new Map(existingTeams.map((team) => [team.slug, team]));
  let updated = 0;
  let alreadyHadLogo = 0;
  let notFound = 0;

  for (const row of rows) {
    const team = teamsBySlug.get(row.slug);

    if (!team) {
      notFound += 1;
      continue;
    }

    if (team.logo_url) {
      alreadyHadLogo += 1;
    }

    const payload: Record<string, string> = {};

    if (row.logoUrl && row.logoUrl !== team.logo_url) {
      payload.logo_url = row.logoUrl;
    }

    if (row.primaryColor && row.primaryColor !== team.primary_color) {
      payload.primary_color = row.primaryColor;
    }

    if (Object.keys(payload).length === 0) {
      continue;
    }

    await writeSupabaseAdmin(`teams?id=eq.${encodeURIComponent(team.id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    updated += 1;
  }

  return redirectTo(
    request,
    `/admin/clubes?assets_updated=${updated}&assets_existing=${alreadyHadLogo}&assets_missing=${notFound}&assets_invalid=${invalid}`
  );
}

export async function POST(request: Request) {
  if (!getSupabaseServiceConfig()) {
    return redirectTo(request, "/admin/clubes?error=missing-service");
  }

  const formData = await request.formData();
  const actionType = cleanText(formData.get("action_type"));

  if (actionType === "bulk_assets") {
    try {
      return await updateTeamAssets(request, formData);
    } catch {
      return redirectTo(request, "/admin/clubes?error=save");
    }
  }

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
