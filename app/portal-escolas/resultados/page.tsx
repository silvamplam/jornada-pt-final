import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";
import { readPortalResults } from "@/lib/portal-escolas/readPortalResults";

type ResultsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Resultados | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de resultados por evento e participante no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const resultsStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-results-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-results-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-results-hero,
  .portal-results-section,
  .portal-results-warning,
  .portal-results-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-results-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-results-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-results-hero h1,
  .portal-results-warning h1 {
    margin: 0;
    font-size: 36px;
    line-height: 1.08;
  }

  .portal-results-text,
  .portal-results-warning p,
  .portal-results-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-results-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    padding: 8px 10px;
    border: 1px solid #bcd7df;
    border-radius: 999px;
    background: #e8f6f8;
    color: #0f6478;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.2;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .portal-results-section,
  .portal-results-warning,
  .portal-results-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-results-section-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .portal-results-section h2,
  .portal-results-notice h2 {
    margin: 0;
    font-size: 22px;
  }

  .portal-results-scope-list,
  .portal-results-model-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-results-scope-list li,
  .portal-results-model-list li {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-results-scope-list span,
  .portal-results-model-list span,
  .portal-results-filter span,
  .portal-results-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-results-scope-list strong,
  .portal-results-model-list strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-results-model-list p {
    margin: 8px 0 0;
    color: #526274;
    font-size: 13px;
    line-height: 1.45;
  }

  .portal-results-filters {
    display: grid;
    grid-template-columns: minmax(190px, 1.4fr) repeat(4, minmax(135px, 1fr)) auto auto;
    gap: 12px;
    align-items: end;
    margin-top: 16px;
  }

  .portal-results-filter input,
  .portal-results-filter select {
    width: 100%;
    box-sizing: border-box;
    margin-top: 7px;
    padding: 10px 11px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font: inherit;
  }

  .portal-results-button,
  .portal-results-link-button {
    min-height: 39px;
    padding: 10px 12px;
    border: 1px solid #0f6f8d;
    border-radius: 8px;
    background: #0f6f8d;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    text-align: center;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }

  .portal-results-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-color: #cbdce7;
    background: #ffffff;
    color: #0f6f8d;
  }

  .portal-results-table-wrap {
    width: 100%;
    max-width: 100%;
    margin-top: 16px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
  }

  .portal-results-table {
    width: 100%;
    min-width: 1380px;
    border-collapse: collapse;
  }

  .portal-results-table th,
  .portal-results-table td {
    padding: 12px;
    border-bottom: 1px solid #d7e4ed;
    text-align: left;
    vertical-align: top;
  }

  .portal-results-table th {
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .portal-results-table td {
    color: #102033;
    font-size: 14px;
    line-height: 1.35;
  }

  .portal-results-table a {
    color: #0f6f8d;
    font-weight: 900;
    text-decoration: none;
  }

  .portal-results-table .portal-results-tag {
    white-space: nowrap;
  }

  .portal-results-table td:nth-child(5),
  .portal-results-table td:nth-child(6),
  .portal-results-table td:nth-child(7),
  .portal-results-table td:nth-child(8),
  .portal-results-table td:nth-child(9) {
    white-space: nowrap;
  }

  .portal-results-record strong,
  .portal-results-record span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-results-record span {
    margin-top: 4px;
    color: #667789;
    font-size: 12px;
  }

  .portal-results-muted {
    color: #667789;
  }

  .portal-results-edit-list {
    display: grid;
    gap: 14px;
    margin-top: 16px;
  }

  .portal-results-edit-card {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid #d7e4ed;
    border-radius: 10px;
    background: #f8fbfd;
  }

  .portal-results-edit-card-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .portal-results-edit-card-title {
    margin: 0;
    color: #102033;
    font-size: 17px;
    font-weight: 900;
    line-height: 1.35;
  }

  .portal-results-edit-card-title span {
    display: block;
    margin-top: 4px;
    color: #667789;
    font-size: 12px;
    font-weight: 700;
  }

  .portal-results-scoreline-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 78px;
    padding: 8px 10px;
    border: 1px solid #cbdce7;
    border-radius: 999px;
    background: #ffffff;
    color: #102033;
    font-size: 13px;
    font-weight: 900;
  }

  .portal-results-score-form {
    display: grid;
    gap: 12px;
  }

  .portal-results-scoreboard {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 12px;
    align-items: end;
  }

  .portal-results-score-participant {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 86px;
    gap: 10px;
    align-items: end;
    min-width: 0;
    padding: 12px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #ffffff;
  }

  .portal-results-score-participant strong,
  .portal-results-score-participant span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-results-score-participant span {
    margin-top: 3px;
    color: #667789;
    font-size: 12px;
  }

  .portal-results-score-separator {
    padding-bottom: 12px;
    color: #0f6f8d;
    font-size: 20px;
    font-weight: 900;
  }

  .portal-results-score-input span,
  .portal-results-edit-field span {
    display: block;
    color: #667789;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-results-score-input input,
  .portal-results-edit-field select {
    width: 100%;
    box-sizing: border-box;
    margin-top: 6px;
    padding: 9px 10px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font: inherit;
  }

  .portal-results-score-input input {
    font-size: 18px;
    font-weight: 900;
    text-align: center;
  }

  .portal-results-edit-form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: end;
    justify-content: flex-end;
  }

  .portal-results-edit-field {
    min-width: 160px;
  }

  .portal-results-auto-note {
    margin: 0;
    color: #667789;
    font-size: 12px;
    line-height: 1.45;
  }

  .portal-results-event-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-results-event-summary li {
    padding: 10px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font-size: 13px;
    line-height: 1.35;
  }

  .portal-results-event-summary strong,
  .portal-results-event-summary span {
    display: block;
  }

  .portal-results-event-summary span {
    margin-top: 3px;
    color: #667789;
    font-size: 12px;
  }

  .portal-results-empty {
    margin: 16px 0 0;
    padding: 14px;
    border: 1px dashed #c6d5e0;
    border-radius: 8px;
    background: #f8fbfd;
    line-height: 1.35;
  }

  .portal-results-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-results-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-results-warning {
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .portal-results-notice {
    border-color: #d9c69a;
    background: #fffaf0;
  }

  @media (max-width: 1020px) {
    .portal-results-filters,
    .portal-results-scope-list,
    .portal-results-model-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .portal-results-shell {
      padding: 16px;
    }

    .portal-results-hero,
    .portal-results-filters,
    .portal-results-scope-list,
    .portal-results-model-list {
      grid-template-columns: 1fr;
    }

    .portal-results-hero {
      padding: 22px;
    }

    .portal-results-scoreboard,
    .portal-results-event-summary {
      grid-template-columns: 1fr;
    }

    .portal-results-score-separator {
      display: none;
    }

    .portal-results-score-participant {
      grid-template-columns: minmax(0, 1fr) 76px;
    }
  }
`;

const labelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  validated: "Validado",
  pending_validation: "Pendente de validação",
  draft: "Rascunho",
  scheduled: "Agendado",
  under_review: "Em revisão",
  submitted: "Submetido",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
  completed: "Concluído",
  finished: "Concluído",
  in_progress: "Em curso",
  live: "Em curso",
  no_result: "Sem resultado",
  mixed: "Misto",
  unknown: "Não disponível",
  match: "Jogo",
  game: "Jogo",
  race: "Prova/corrida",
  heat: "Série",
  field_event: "Prova técnica"
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeFilterValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Por definir";
  }

  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
  const mappedLabel = labelMap[normalized];

  if (mappedLabel) {
    return mappedLabel;
  }

  if (!trimmed.includes("_") && trimmed !== trimmed.toUpperCase()) {
    return trimmed;
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) => first.localeCompare(second, "pt"));
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    competições: "competições",
    contextos: "contextos",
    entidades: "entidades",
    eventos: "eventos",
    participantes: "participantes",
    "participantes de evento": "participantes de evento",
    "resultados por participante": "resultados por participante",
    "estrutura competitiva": "estrutura competitiva"
  };

  return labels[section] ?? formatLabel(section);
}

function resultStatusOptions(canValidate: boolean) {
  return [
    { value: "draft", label: "Rascunho" },
    { value: "submitted", label: "Submetido" },
    ...(canValidate ? [{ value: "validated", label: "Validado" }] : [])
  ];
}

function readFormText(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalDecimal(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function cleanResultStatus(value: string, canValidate: boolean) {
  const allowedStatuses = resultStatusOptions(canValidate).map((option) => option.value);

  return allowedStatuses.includes(value) ? value : "submitted";
}

function resultWriteMessage(status: string) {
  if (status === "guardado") {
    return "Resultado do evento guardado no modelo novo.";
  }

  if (status === "sem-permissao") {
    return "A sessão atual não tem permissão de edição para guardar resultados.";
  }

  if (status === "dados-invalidos") {
    return "Não foi possível guardar: confirma o evento e os dois valores do marcador.";
  }

  if (status === "erro") {
    return "Não foi possível guardar o resultado. Confirma se o SQL da fase foi aplicado e se a permissão de edição está ativa.";
  }

  return null;
}

function deriveHeadToHeadResult(score: number, opponentScore: number) {
  if (score > opponentScore) {
    return { points: 3, outcome: "win" };
  }

  if (score < opponentScore) {
    return { points: 0, outcome: "loss" };
  }

  return { points: 1, outcome: "draw" };
}

async function savePortalEventResults(formData: FormData) {
  "use server";

  const supabase = await createPortalEscolasServerClient();

  if (!supabase) {
    redirect(`${PORTAL_ESCOLAS_LOGIN_PATH}?status=not-configured`);
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(PORTAL_ESCOLAS_LOGIN_PATH);
  }

  const authorization = await readPortalAuthorization(supabase, user.id);

  if (!authorization.allowed || !authorization.permissions.some((permission) => permission.can_edit)) {
    redirect("/portal-escolas/resultados?resultado=sem-permissao");
  }

  const canValidate = authorization.permissions.some((permission) => permission.can_validate);
  const eventId = readFormText(formData, "event_id");
  const participantCount = Number(readFormText(formData, "participant_count"));
  const resultStatus = cleanResultStatus(readFormText(formData, "result_status"), canValidate);

  if (!isUuid(eventId) || !Number.isInteger(participantCount) || participantCount <= 0 || participantCount > 16) {
    redirect("/portal-escolas/resultados?resultado=dados-invalidos");
  }

  const entries = Array.from({ length: participantCount }, (_, index) => {
    const participantId = readFormText(formData, `participant_id_${index}`);
    const scoreText = readFormText(formData, `score_text_${index}`).slice(0, 80);
    const scoreNumeric = readOptionalDecimal(scoreText);

    return {
      participantId,
      scoreText,
      scoreNumeric,
      points: null as number | null,
      outcome: null as string | null
    };
  }).filter((entry) => isUuid(entry.participantId) && entry.scoreText);

  if (entries.length === 0) {
    redirect("/portal-escolas/resultados?resultado=dados-invalidos");
  }

  if (entries.length === 2 && entries.every((entry) => entry.scoreNumeric !== null)) {
    const firstScore = entries[0].scoreNumeric as number;
    const secondScore = entries[1].scoreNumeric as number;
    const firstDerived = deriveHeadToHeadResult(firstScore, secondScore);
    const secondDerived = deriveHeadToHeadResult(secondScore, firstScore);

    entries[0].points = firstDerived.points;
    entries[0].outcome = firstDerived.outcome;
    entries[1].points = secondDerived.points;
    entries[1].outcome = secondDerived.outcome;
  }

  for (const entry of entries) {
    const { error } = await supabase.rpc("portal_upsert_result_entry", {
      p_portal_event_id: eventId,
      p_portal_participant_id: entry.participantId,
      p_score_text: entry.scoreText,
      p_score_numeric: entry.scoreNumeric,
      p_points: entry.points,
      p_outcome: entry.outcome,
      p_result_status: resultStatus
    });

    if (error) {
      redirect("/portal-escolas/resultados?resultado=erro");
    }
  }

  revalidatePath("/portal-escolas/resultados");
  redirect("/portal-escolas/resultados?resultado=guardado");
}
function resultRoleOrder(roleLabel: string) {
  const normalized = normalizeFilterValue(roleLabel);

  if (normalized === "casa") {
    return 0;
  }

  if (normalized === "fora") {
    return 1;
  }

  return 2;
}

function sortEventResults<T extends { participantRoleLabel: string; participantLabel: string }>(results: T[]) {
  return [...results].sort(
    (first, second) =>
      resultRoleOrder(first.participantRoleLabel) - resultRoleOrder(second.participantRoleLabel) ||
      first.participantLabel.localeCompare(second.participantLabel, "pt")
  );
}

function makeEventScoreline(results: Array<{ hasResult: boolean; scoreLabel: string }>) {
  if (results.length < 2 || !results.every((result) => result.hasResult)) {
    return "Sem resultado";
  }

  return results.map((result) => result.scoreLabel).join(" - ");
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-results-empty">{message}</p>;
}

export default async function PortalEscolasResultadosPage({ searchParams }: ResultsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    competition: firstParam(params.competicao).trim(),
    structure: firstParam(params.estrutura).trim(),
    eventType: firstParam(params.tipo).trim(),
    status: firstParam(params.estado).trim()
  };
  const resultWriteStatus = firstParam(params.resultado).trim();
  const supabase = await createPortalEscolasServerClient();

  if (!supabase) {
    redirect(`${PORTAL_ESCOLAS_LOGIN_PATH}?status=not-configured`);
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(PORTAL_ESCOLAS_LOGIN_PATH);
  }

  const authorization = await readPortalAuthorization(supabase, user.id);

  if (!authorization.allowed) {
    return (
      <main className="portal-results-shell">
        <style>{resultsStyles}</style>
        <div className="portal-results-wrap">
          <section className="portal-results-warning" aria-labelledby="portal-results-warning-title">
            <p className="portal-results-eyebrow">Portal das Escolas</p>
            <h1 id="portal-results-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-results-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const canEditResults = authorization.permissions.some((permission) => permission.can_edit);
  const canValidateResults = authorization.permissions.some((permission) => permission.can_validate);
  const data = await readPortalResults(supabase, authorization);
  const resultRows = data.results.map((result) => ({
    ...result,
    resultStatusLabel: formatLabel(result.resultStatus),
    eventStatusLabel: formatLabel(result.eventStatus)
  }));
  const normalizedSearch = normalizeFilterValue(filters.search);
  const matchesFilters = (result: (typeof resultRows)[number]) => {
    const searchableText = normalizeFilterValue(`${result.eventLabel} ${result.participantLabel} ${result.scoreLabel} ${result.outcomeLabel}`);

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.competition || result.competitionLabel === filters.competition) &&
      (!filters.structure || result.stageLabel === filters.structure) &&
      (!filters.eventType || result.eventTypeLabel === filters.eventType) &&
      (!filters.status || result.resultStatusLabel === filters.status)
    );
  };
  const competitionOptions = uniqueLabels(resultRows.map((result) => result.competitionLabel));
  const structureOptions = uniqueLabels(resultRows.map((result) => result.stageLabel));
  const eventTypeOptions = uniqueLabels(resultRows.map((result) => result.eventTypeLabel));
  const statusOptions = uniqueLabels(resultRows.map((result) => result.resultStatusLabel));
  const hasFilters = Boolean(filters.search || filters.competition || filters.structure || filters.eventType || filters.status);
  const writeNotice = resultWriteMessage(resultWriteStatus);
  const statusEditOptions = resultStatusOptions(canValidateResults);
  const allEventGroups = Array.from(
    resultRows
      .reduce((groups, result) => {
        const existingGroup = groups.get(result.eventId);

        if (existingGroup) {
          existingGroup.results.push(result);
          return groups;
        }

        groups.set(result.eventId, {
          eventId: result.eventId,
          eventLabel: result.eventLabel,
          eventTypeLabel: result.eventTypeLabel,
          stageLabel: result.stageLabel,
          competitionLabel: result.competitionLabel,
          results: [result]
        });

        return groups;
      }, new Map<string, { eventId: string; eventLabel: string; eventTypeLabel: string; stageLabel: string; competitionLabel: string; results: typeof resultRows }>())
      .values()
  ).map((group) => ({ ...group, results: sortEventResults(group.results) }));
  const eventGroups = allEventGroups.filter((group) => group.results.some(matchesFilters));

  return (
    <main className="portal-results-shell">
      <style>{resultsStyles}</style>
      <div className="portal-results-wrap">
        <section className="portal-results-hero" aria-labelledby="portal-results-title">
          <div>
            <p className="portal-results-eyebrow">Portal das Escolas · Resultados</p>
            <h1 id="portal-results-title">Resultados</h1>
            <p className="portal-results-text">
              Leitura e inserção controlada de resultados por evento e participante. A rota mantém-se em /portal-escolas/resultados
              e a escrita fica limitada ao modelo novo do Portal.
            </p>
          </div>
          <span className="portal-results-tag">{formatCountLabel(data.summary.resultEntryCount, "resultado", "resultados")}</span>
        </section>

        <PortalEscolasInternalNav current="resultados" />

        <nav className="portal-results-actions" aria-label="Ações contextuais dos resultados">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {writeNotice ? (
          <section className="portal-results-notice" aria-label="Estado da gravação de resultado">
            <p>{writeNotice}</p>
          </section>
        ) : null}

        {data.unavailableSections.length > 0 ? (
          <section className="portal-results-notice" aria-labelledby="portal-results-notice-title">
            <h2 id="portal-results-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados: {" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-results-section" aria-labelledby="portal-results-model-title">
          <div className="portal-results-section-header">
            <div>
              <p className="portal-results-eyebrow">Modelo multidesporto</p>
              <h2 id="portal-results-model-title">Resultado é valor por participante num evento</h2>
              <p className="portal-results-text">
                Um resultado não tem de ser apenas marcador de jogo. Pode ser golo, set, ponto, tempo, marca, distância,
                vitória, empate ou critério específico da modalidade.
              </p>
            </div>
            <span className="portal-results-tag">
              {formatCountLabel(data.summary.eventCount, "evento", "eventos")} · {formatCountLabel(data.summary.eventParticipantCount, "participante", "participantes")}
            </span>
          </div>
          <ul className="portal-results-model-list">
            <li>
              <span>Futebol / Voleibol</span>
              <strong>Marcador, sets ou pontos</strong>
              <p>O evento pode ser um jogo e o resultado pode alimentar classificação por pontos, golos ou sets.</p>
            </li>
            <li>
              <span>Xadrez</span>
              <strong>Pontos e desfecho</strong>
              <p>A partida pode produzir vitória, empate ou derrota, além de critérios de desempate.</p>
            </li>
            <li>
              <span>Atletismo / Natação</span>
              <strong>Tempos, marcas ou distâncias</strong>
              <p>A prova pode gerar resultado individual por participante, série, final, escalão ou escola.</p>
            </li>
          </ul>
        </section>

        <section className="portal-results-section" aria-labelledby="portal-results-scope-title">
          <div className="portal-results-section-header">
            <div>
              <p className="portal-results-eyebrow">Âmbito ativo</p>
              <h2 id="portal-results-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-results-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-results-scope-list">
            {data.scopes.map((scope) => (
              <li key={scope.id}>
                <span>Entidade</span>
                <strong>{scope.entityLabel}</strong>
                <span>Contexto</span>
                <strong>{scope.contextLabel}</strong>
                <span>Competição</span>
                <strong>{scope.competitionLabel}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="portal-results-section" aria-labelledby="portal-results-list-title">
          <div className="portal-results-section-header">
            <div>
              <p className="portal-results-eyebrow">Evento → Marcador → Registo técnico</p>
              <h2 id="portal-results-list-title">Resultados por evento</h2>
            </div>
            <span className="portal-results-tag">
              {hasFilters ? `${eventGroups.length} de ${allEventGroups.length}` : formatCountLabel(allEventGroups.length, "evento", "eventos")}
            </span>
          </div>

          <form className="portal-results-filters" method="get">
            <label className="portal-results-filter">
              <span>Pesquisar evento/participante</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Evento, participante ou resultado" />
            </label>
            <label className="portal-results-filter">
              <span>Competição</span>
              <select name="competicao" defaultValue={filters.competition}>
                <option value="">Todas</option>
                {competitionOptions.map((competition) => (
                  <option key={competition} value={competition}>
                    {competition}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-results-filter">
              <span>Estrutura</span>
              <select name="estrutura" defaultValue={filters.structure}>
                <option value="">Todas</option>
                {structureOptions.map((structure) => (
                  <option key={structure} value={structure}>
                    {structure}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-results-filter">
              <span>Tipo de evento</span>
              <select name="tipo" defaultValue={filters.eventType}>
                <option value="">Todos</option>
                {eventTypeOptions.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-results-filter">
              <span>Estado do resultado</span>
              <select name="estado" defaultValue={filters.status}>
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button className="portal-results-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-results-link-button" href="/portal-escolas/resultados">
                Limpar
              </a>
            ) : null}
          </form>

          {eventGroups.length > 0 ? (
            <div className="portal-results-edit-list" aria-label="Resultados por evento">
              {eventGroups.map((group) => {
                const isEditableEvent = canEditResults && group.results.length === 2;
                const currentStatus = group.results.find((result) => result.resultStatus !== "no_result")?.resultStatus ?? "submitted";

                return (
                  <article key={`event-result-${group.eventId}`} className="portal-results-edit-card">
                    <div className="portal-results-edit-card-header">
                      <p className="portal-results-edit-card-title">
                        {group.eventLabel}
                        <span>{group.competitionLabel} · {group.stageLabel} · {group.eventTypeLabel}</span>
                      </p>
                      <span className="portal-results-scoreline-tag">{makeEventScoreline(group.results)}</span>
                    </div>

                    {isEditableEvent ? (
                      <form className="portal-results-score-form" action={savePortalEventResults}>
                        <input type="hidden" name="event_id" value={group.eventId} />
                        <input type="hidden" name="participant_count" value={String(group.results.length)} />
                        <div className="portal-results-scoreboard">
                          <div className="portal-results-score-participant">
                            <input type="hidden" name="participant_id_0" value={group.results[0]?.participantId ?? ""} />
                            <div>
                              <strong>{group.results[0]?.participantLabel}</strong>
                              <span>{group.results[0]?.participantRoleLabel}</span>
                            </div>
                            <label className="portal-results-score-input">
                              <span>Marcador</span>
                              <input
                                name="score_text_0"
                                inputMode="decimal"
                                defaultValue={group.results[0]?.scoreTextValue ?? ""}
                                placeholder="0"
                                aria-label={`Marcador de ${group.results[0]?.participantLabel ?? "participante"}`}
                              />
                            </label>
                          </div>
                          <span className="portal-results-score-separator">-</span>
                          <div className="portal-results-score-participant">
                            <input type="hidden" name="participant_id_1" value={group.results[1]?.participantId ?? ""} />
                            <div>
                              <strong>{group.results[1]?.participantLabel}</strong>
                              <span>{group.results[1]?.participantRoleLabel}</span>
                            </div>
                            <label className="portal-results-score-input">
                              <span>Marcador</span>
                              <input
                                name="score_text_1"
                                inputMode="decimal"
                                defaultValue={group.results[1]?.scoreTextValue ?? ""}
                                placeholder="0"
                                aria-label={`Marcador de ${group.results[1]?.participantLabel ?? "participante"}`}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="portal-results-edit-form-actions">
                          <p className="portal-results-auto-note">
                            Introduz apenas o marcador. Pontos e desfecho do evento são calculados automaticamente nesta gravação.
                          </p>
                          <label className="portal-results-edit-field">
                            <span>Estado</span>
                            <select
                              name="result_status"
                              defaultValue={statusEditOptions.some((option) => option.value === currentStatus) ? currentStatus : "submitted"}
                            >
                              {statusEditOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button className="portal-results-button" type="submit">
                            Guardar resultado
                          </button>
                        </div>
                      </form>
                    ) : canEditResults ? (
                      <EmptyState message="Este evento não tem exatamente dois participantes. Nesta fase demo, a edição direta está limitada a jogos/eventos com dois participantes." />
                    ) : (
                      <section className="portal-results-notice" aria-label="Permissão de edição de resultados">
                        <p>Esta sessão tem leitura ativa, mas não tem permissão de edição de resultados.</p>
                      </section>
                    )}

                    <ul className="portal-results-event-summary" aria-label="Registo técnico do evento">
                      {group.results.map((result) => (
                        <li key={`summary-${result.key}`}>
                          <strong>{result.participantLabel}</strong>
                          <span>
                            {result.scoreLabel} · {result.pointsLabel} pontos · {result.outcomeLabel} · {result.resultStatusLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              message={
                data.results.length > 0
                  ? "Não há resultados visíveis com os filtros selecionados."
                  : "Ainda não há resultados por evento disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
