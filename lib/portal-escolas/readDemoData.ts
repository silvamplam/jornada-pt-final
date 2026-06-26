import "server-only";

const DEMO_ENTITY_SLUG = "demo-entidade-escolar";
const DEMO_COMPETITION_SLUG = "demo-torneio-interturmas";

type SupabaseServiceConfig = {
  baseUrl: string;
  serviceRoleKey: string;
};

type PortalEntityRow = {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  status: string;
};

type PortalContextRow = {
  id: string;
  portal_entity_id: string;
  label: string;
  type: string | null;
  status: string;
};

type PortalCompetitionRow = {
  id: string;
  portal_entity_id: string;
  portal_context_id: string;
  name: string;
  slug: string | null;
  modality: string | null;
  scope: string | null;
  format: string | null;
  status: string;
};

type PortalParticipantRow = {
  id: string;
  portal_entity_id: string;
  name: string;
  type: string;
  status: string;
};

type PortalCompetitionParticipantRow = {
  portal_participant_id: string;
  registration_status: string;
  group_label: string | null;
  seed_order: number | null;
};

type PortalStageRow = {
  id: string;
  name: string;
  type: string;
  stage_order: number | null;
  scheduled_date: string | null;
  status: string;
};

type PortalGameRow = {
  id: string;
  portal_stage_id: string;
  home_participant_id: string | null;
  away_participant_id: string | null;
  scheduled_at: string | null;
  venue: string | null;
  status: string;
};

type PortalResultRow = {
  id: string;
  portal_game_id: string;
  home_score: number | null;
  away_score: number | null;
  result_status: string;
};

type PortalContentSubmissionRow = {
  id: string;
  title: string;
  type: string;
  submission_status: string;
};

export type PortalDemoParticipant = {
  id: string;
  name: string;
  type: string;
  status: string;
  registrationStatus: string;
  groupLabel: string | null;
};

export type PortalDemoGame = {
  id: string;
  stageName: string;
  homeName: string;
  awayName: string;
  scheduledAt: string | null;
  venue: string | null;
  status: string;
  resultLabel: string;
};

export type PortalDemoData = {
  configured: boolean;
  errorMessage: string | null;
  entity: Pick<PortalEntityRow, "name" | "slug" | "status"> | null;
  context: Pick<PortalContextRow, "label" | "type" | "status"> | null;
  competition: Pick<PortalCompetitionRow, "name" | "slug" | "modality" | "format" | "status"> | null;
  participants: PortalDemoParticipant[];
  stages: PortalStageRow[];
  games: PortalDemoGame[];
  contentSubmissions: PortalContentSubmissionRow[];
  counts: {
    participants: number;
    stages: number;
    games: number;
    results: number;
    contentSubmissions: number;
  };
};

function emptyDemoData(errorMessage: string | null): PortalDemoData {
  return {
    configured: false,
    errorMessage,
    entity: null,
    context: null,
    competition: null,
    participants: [],
    stages: [],
    games: [],
    contentSubmissions: [],
    counts: {
      participants: 0,
      stages: 0,
      games: 0,
      results: 0,
      contentSubmissions: 0
    }
  };
}

function getServiceConfig(): SupabaseServiceConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    baseUrl: url.replace(/\/$/, ""),
    serviceRoleKey
  };
}

function restUrl(baseUrl: string, path: string) {
  return `${baseUrl}/rest/v1/${path}`;
}

async function readRows<T>(config: SupabaseServiceConfig, path: string) {
  const response = await fetch(restUrl(config.baseUrl, path), {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("portal-demo-read-failed");
  }

  return (await response.json()) as T[];
}

function byId<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

export async function readPortalEscolasDemoData(): Promise<PortalDemoData> {
  const config = getServiceConfig();

  if (!config) {
    return emptyDemoData("Dados demo indisponíveis nesta build.");
  }

  try {
    const entities = await readRows<PortalEntityRow>(
      config,
      `portal_entities?select=id,name,slug,type,status&slug=eq.${encodeURIComponent(DEMO_ENTITY_SLUG)}&limit=1`
    );
    const entity = entities[0];

    if (!entity) {
      return emptyDemoData("Dados demo indisponíveis nesta build.");
    }

    const contexts = await readRows<PortalContextRow>(
      config,
      `portal_contexts?select=id,portal_entity_id,label,type,status&portal_entity_id=eq.${encodeURIComponent(entity.id)}&limit=1`
    );
    const context = contexts[0];

    if (!context) {
      return emptyDemoData("Dados demo indisponíveis nesta build.");
    }

    const competitions = await readRows<PortalCompetitionRow>(
      config,
      `portal_competitions?select=id,portal_entity_id,portal_context_id,name,slug,modality,scope,format,status&portal_entity_id=eq.${encodeURIComponent(entity.id)}&portal_context_id=eq.${encodeURIComponent(context.id)}&slug=eq.${encodeURIComponent(DEMO_COMPETITION_SLUG)}&limit=1`
    );
    const competition = competitions[0];

    if (!competition) {
      return emptyDemoData("Dados demo indisponíveis nesta build.");
    }

    const [participantLinks, participants, stages, games, results, contentSubmissions] = await Promise.all([
      readRows<PortalCompetitionParticipantRow>(
        config,
        `portal_competition_participants?select=portal_participant_id,registration_status,group_label,seed_order&portal_entity_id=eq.${encodeURIComponent(entity.id)}&portal_context_id=eq.${encodeURIComponent(context.id)}&portal_competition_id=eq.${encodeURIComponent(competition.id)}&order=seed_order.asc`
      ),
      readRows<PortalParticipantRow>(
        config,
        `portal_participants?select=id,portal_entity_id,name,type,status&portal_entity_id=eq.${encodeURIComponent(entity.id)}&order=name.asc`
      ),
      readRows<PortalStageRow>(
        config,
        `portal_stages?select=id,name,type,stage_order,scheduled_date,status&portal_entity_id=eq.${encodeURIComponent(entity.id)}&portal_context_id=eq.${encodeURIComponent(context.id)}&portal_competition_id=eq.${encodeURIComponent(competition.id)}&order=stage_order.asc`
      ),
      readRows<PortalGameRow>(
        config,
        `portal_games?select=id,portal_stage_id,home_participant_id,away_participant_id,scheduled_at,venue,status&portal_entity_id=eq.${encodeURIComponent(entity.id)}&portal_context_id=eq.${encodeURIComponent(context.id)}&portal_competition_id=eq.${encodeURIComponent(competition.id)}&order=scheduled_at.asc`
      ),
      readRows<PortalResultRow>(
        config,
        `portal_results?select=id,portal_game_id,home_score,away_score,result_status&portal_entity_id=eq.${encodeURIComponent(entity.id)}&portal_context_id=eq.${encodeURIComponent(context.id)}&portal_competition_id=eq.${encodeURIComponent(competition.id)}`
      ),
      readRows<PortalContentSubmissionRow>(
        config,
        `portal_content_submissions?select=id,title,type,submission_status&portal_entity_id=eq.${encodeURIComponent(entity.id)}&portal_context_id=eq.${encodeURIComponent(context.id)}&portal_competition_id=eq.${encodeURIComponent(competition.id)}&order=submitted_at.asc`
      )
    ]);

    const participantsById = byId(participants);
    const stagesById = byId(stages);
    const resultsByGameId = new Map(results.map((result) => [result.portal_game_id, result]));
    const demoParticipants = participantLinks
      .map((link) => {
        const participant = participantsById.get(link.portal_participant_id);

        return participant
          ? {
              id: participant.id,
              name: participant.name,
              type: participant.type,
              status: participant.status,
              registrationStatus: link.registration_status,
              groupLabel: link.group_label
            }
          : null;
      })
      .filter((participant): participant is PortalDemoParticipant => Boolean(participant));
    const demoGames = games.map((game) => {
      const result = resultsByGameId.get(game.id);
      const resultLabel =
        result && result.home_score !== null && result.away_score !== null
          ? `${result.home_score} - ${result.away_score} · ${result.result_status}`
          : "Sem resultado";

      return {
        id: game.id,
        stageName: stagesById.get(game.portal_stage_id)?.name || "Jornada demo",
        homeName: game.home_participant_id ? participantsById.get(game.home_participant_id)?.name || "Participante demo" : "Participante demo",
        awayName: game.away_participant_id ? participantsById.get(game.away_participant_id)?.name || "Participante demo" : "Participante demo",
        scheduledAt: game.scheduled_at,
        venue: game.venue,
        status: game.status,
        resultLabel
      };
    });

    return {
      configured: true,
      errorMessage: null,
      entity: {
        name: entity.name,
        slug: entity.slug,
        status: entity.status
      },
      context: {
        label: context.label,
        type: context.type,
        status: context.status
      },
      competition: {
        name: competition.name,
        slug: competition.slug,
        modality: competition.modality,
        format: competition.format,
        status: competition.status
      },
      participants: demoParticipants,
      stages,
      games: demoGames,
      contentSubmissions,
      counts: {
        participants: demoParticipants.length,
        stages: stages.length,
        games: games.length,
        results: results.length,
        contentSubmissions: contentSubmissions.length
      }
    };
  } catch {
    return emptyDemoData("Dados demo indisponíveis nesta build.");
  }
}
