import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalParticipants } from "@/lib/portal-escolas/readPortalParticipants";

type ParticipantsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Participantes | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de participantes autorizados no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const participantsStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-participants-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-participants-wrap {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .portal-participants-hero,
  .portal-participants-section,
  .portal-participants-warning,
  .portal-participants-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-participants-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-participants-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-participants-hero h1,
  .portal-participants-warning h1 {
    margin: 0;
    font-size: 36px;
    line-height: 1.08;
  }

  .portal-participants-text,
  .portal-participants-warning p,
  .portal-participants-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-participants-tag {
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

  .portal-participants-section,
  .portal-participants-warning,
  .portal-participants-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-participants-section-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .portal-participants-section h2,
  .portal-participants-notice h2 {
    margin: 0;
    font-size: 22px;
  }

  .portal-participants-scope-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-participants-scope-list li {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-participants-scope-list span,
  .portal-participants-filter label span,
  .portal-participants-empty {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-participants-scope-list strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-participants-filters {
    display: grid;
    grid-template-columns: minmax(180px, 1.4fr) repeat(3, minmax(140px, 1fr)) auto auto;
    gap: 12px;
    align-items: end;
    margin-top: 16px;
  }

  .portal-participants-filter input,
  .portal-participants-filter select {
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

  .portal-participants-button,
  .portal-participants-link-button {
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

  .portal-participants-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-color: #cbdce7;
    background: #ffffff;
    color: #0f6f8d;
  }

  .portal-participants-table-wrap {
    width: 100%;
    margin-top: 16px;
    overflow-x: auto;
  }

  .portal-participants-table {
    width: 100%;
    min-width: 820px;
    border-collapse: collapse;
  }

  .portal-participants-table th,
  .portal-participants-table td {
    padding: 12px;
    border-bottom: 1px solid #d7e4ed;
    text-align: left;
    vertical-align: top;
  }

  .portal-participants-table th {
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-participants-table td {
    color: #102033;
    font-size: 14px;
    line-height: 1.35;
  }

  .portal-participants-muted {
    color: #667789;
  }

  .portal-participants-empty {
    margin: 16px 0 0;
    padding: 14px;
    border: 1px dashed #c6d5e0;
    border-radius: 8px;
    background: #f8fbfd;
    line-height: 1.35;
  }

  .portal-participants-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-participants-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-participants-warning {
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .portal-participants-notice {
    border-color: #d9c69a;
    background: #fffaf0;
  }

  @media (max-width: 980px) {
    .portal-participants-filters,
    .portal-participants-scope-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .portal-participants-shell {
      padding: 16px;
    }

    .portal-participants-hero,
    .portal-participants-filters,
    .portal-participants-scope-list {
      grid-template-columns: 1fr;
    }

    .portal-participants-hero {
      padding: 22px;
    }
  }
`;

const labelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  disabled: "Inativo",
  validated: "Validado",
  pending_validation: "Pendente de validação",
  draft: "Rascunho",
  scheduled: "Agendado",
  under_review: "Em revisão",
  submitted: "Submetido",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
  demo_class: "Turma",
  class: "Turma",
  classroom: "Turma",
  demo_team: "Equipa",
  team: "Equipa",
  demo_center: "Núcleo",
  center: "Núcleo",
  demo_association: "Associação",
  association: "Associação",
  school: "Escola",
  student: "Aluno",
  player: "Jogador",
  group: "Grupo"
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
    competicoes: "competições",
    contextos: "contextos",
    entidades: "entidades",
    inscricoes: "inscrições",
    participantes: "participantes"
  };

  return labels[section] ?? formatLabel(section);
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-participants-empty">{message}</p>;
}

export default async function PortalEscolasParticipantesPage({ searchParams }: ParticipantsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    competition: firstParam(params.competicao).trim(),
    registration: firstParam(params.estado).trim(),
    group: firstParam(params.grupo).trim()
  };
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
      <main className="portal-participants-shell">
        <style>{participantsStyles}</style>
        <div className="portal-participants-wrap">
          <section className="portal-participants-warning" aria-labelledby="portal-participants-warning-title">
            <p className="portal-participants-eyebrow">Portal das Escolas</p>
            <h1 id="portal-participants-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-participants-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalParticipants(supabase, authorization);
  const participantRows = data.participants.map((participant) => ({
    ...participant,
    typeLabel: formatLabel(participant.type),
    statusLabel: formatLabel(participant.status),
    registrationLabel: formatLabel(participant.registrationStatus),
    groupLabelText: participant.groupLabel ?? "Sem grupo"
  }));
  const filteredParticipants = participantRows.filter((participant) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const participantName = normalizeFilterValue(participant.name);

    return (
      (!normalizedSearch || participantName.includes(normalizedSearch)) &&
      (!filters.competition || participant.competitionLabel === filters.competition) &&
      (!filters.registration || participant.registrationLabel === filters.registration) &&
      (!filters.group || participant.groupLabelText === filters.group)
    );
  });
  const competitionOptions = uniqueLabels(participantRows.map((participant) => participant.competitionLabel));
  const registrationOptions = uniqueLabels(participantRows.map((participant) => participant.registrationLabel));
  const groupOptions = uniqueLabels(participantRows.map((participant) => participant.groupLabelText));
  const hasFilters = Boolean(filters.search || filters.competition || filters.registration || filters.group);

  return (
    <main className="portal-participants-shell">
      <style>{participantsStyles}</style>
      <div className="portal-participants-wrap">
        <section className="portal-participants-hero" aria-labelledby="portal-participants-title">
          <div>
            <p className="portal-participants-eyebrow">Portal das Escolas</p>
            <h1 id="portal-participants-title">Participantes</h1>
            <p className="portal-participants-text">
              Listagem read-only dos participantes disponíveis para os âmbitos autorizados.
            </p>
          </div>
          <span className="portal-participants-tag">
            {formatCountLabel(data.participants.length, "participante", "participantes")}
          </span>
        </section>

        <nav className="portal-participants-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-participants-notice" aria-labelledby="portal-participants-notice-title">
            <h2 id="portal-participants-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-participants-section" aria-labelledby="portal-participants-scope-title">
          <div className="portal-participants-section-header">
            <div>
              <p className="portal-participants-eyebrow">Âmbito ativo</p>
              <h2 id="portal-participants-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-participants-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-participants-scope-list">
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

        <section className="portal-participants-section" aria-labelledby="portal-participants-list-title">
          <div className="portal-participants-section-header">
            <div>
              <p className="portal-participants-eyebrow">Inscrições</p>
              <h2 id="portal-participants-list-title">Participantes visíveis</h2>
            </div>
            <span className="portal-participants-tag">
              {hasFilters ? `${filteredParticipants.length} de ${data.participants.length}` : `${data.participants.length} total`}
            </span>
          </div>

          <form className="portal-participants-filters" method="get">
            <label className="portal-participants-filter">
              <span>Pesquisar por nome</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Nome do participante" />
            </label>
            <label className="portal-participants-filter">
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
            <label className="portal-participants-filter">
              <span>Estado da inscrição</span>
              <select name="estado" defaultValue={filters.registration}>
                <option value="">Todos</option>
                {registrationOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-participants-filter">
              <span>Grupo</span>
              <select name="grupo" defaultValue={filters.group}>
                <option value="">Todos</option>
                {groupOptions.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <button className="portal-participants-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-participants-link-button" href="/portal-escolas/participantes">
                Limpar
              </a>
            ) : null}
          </form>

          {filteredParticipants.length > 0 ? (
            <div className="portal-participants-table-wrap">
              <table className="portal-participants-table">
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>Tipo</th>
                    <th>Competição</th>
                    <th>Grupo/turma/série</th>
                    <th>Inscrição</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.key}>
                      <td>{participant.name}</td>
                      <td>{participant.typeLabel}</td>
                      <td>{participant.competitionLabel}</td>
                      <td className={participant.groupLabel ? undefined : "portal-participants-muted"}>{participant.groupLabelText}</td>
                      <td>
                        <span className="portal-participants-tag">{participant.registrationLabel}</span>
                      </td>
                      <td>
                        <span className="portal-participants-tag">{participant.statusLabel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                data.participants.length > 0
                  ? "Não há participantes visíveis com os filtros selecionados."
                  : "Ainda não há participantes disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
