import { NextResponse } from "next/server";
import { getSupabaseServiceConfig, writeSupabaseAdmin } from "@/lib/supabase";

function cleanText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

type UpdateStandingContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: UpdateStandingContext) {
  if (!getSupabaseServiceConfig()) {
    return redirectTo(request, "/admin/classificacoes?error=missing-service");
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const competitionId = cleanText(formData.get("competition_id"));
  const seasonId = cleanText(formData.get("season_id"));

  if (!id || !competitionId || !seasonId) {
    return redirectTo(request, "/admin/classificacoes?error=missing-fields");
  }

  try {
    const syncMetadataAvailable = cleanText(formData.get("sync_metadata_available")) === "1";
    const currentDataSource = cleanText(formData.get("current_data_source")) ?? "manual";
    const becomesMixed = currentDataSource === "api" || currentDataSource === "mixed";
    const body: Record<string, string | boolean | null> = {
      competition_id: competitionId,
      season_id: seasonId,
      matchday_id: cleanText(formData.get("matchday_id")),
      moment_label: cleanText(formData.get("moment_label"))
    };

    if (syncMetadataAvailable) {
      body.data_source = becomesMixed ? "mixed" : "manual";
      body.sync_status = becomesMixed ? "manual_override" : "manual";
      body.manual_override = becomesMixed;
    }

    await writeSupabaseAdmin(`standings?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  } catch {
    return redirectTo(request, "/admin/classificacoes?error=save");
  }

  return redirectTo(request, "/admin/classificacoes?updated=1");
}
