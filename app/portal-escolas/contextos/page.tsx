import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalContexts } from "@/lib/portal-escolas/readPortalContexts";

type ContextsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Contextos | Portal das Escolas | Jornada.pt",
  description: "Listagem read-only de contextos autorizados no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const contextsStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-contexts-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-contexts-wrap {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .portal-contexts-hero,
  .portal-contexts-section,
  .portal-contexts-warning,
  .portal-contexts-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-contexts-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-contexts-section,
  .portal-contexts-warning,
  .portal-contexts-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-contexts-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-contexts-hero h1,
  .portal-contexts-warning h1,
  .portal-contexts-section h2,
  .portal-contexts-notice h2 {
    margin: 0;
  }

  .portal-contexts-hero h1,
  .portal-contexts-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-contexts-section h2,
  .portal-contexts-notice h2 {
    font-size: 22px;
    line-height: 1.2;
  }

  .portal-contexts-text,
  .portal-contexts-warning p,
  .portal-contexts-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-contexts-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .portal-contexts-actions a,
  .portal-contexts-button,
  .portal-contexts-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 9px 12px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.2;
    text-decoration: none;
    cursor: pointer;
  }

  .portal-contexts-button {
    border-color: #0f6f8d;
    background: #0f6f8d;
    color: #ffffff;
  }

  .portal-contexts-tag {
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

  .portal-contexts-section-header {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: start;
    margin-bottom: 16px;
  }

  .portal-contexts-scope-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-contexts-scope-list li {
    display: grid;
    gap: 5px;
    min-width: 0;
    padding: 14px;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-contexts-scope-list span,
  .portal-contexts-filter span,
  .portal-contexts-table th {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-contexts-scope-list strong {
    min-width: 0;
    color: #102033;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .portal-contexts-filters {
    display: grid;
    grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(145px, 1fr)) auto auto;
    gap: 10px;
    align-items: end;
    margin-bottom: 16px;
  }

  .portal-contexts-filter {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .portal-contexts-filter input,
  .portal-contexts-filter select {
    width: 100%;
    min-height: 38px;
    box-sizing: border-box;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font: inherit;
    font-size: 14px;
    padding: 8px 10px;
  }

  .portal-contexts-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
  }

  .portal-contexts-table {
    width: 100%;
    min-width: 780px;
    border-collapse: collapse;
    background: #ffffff;
  }

  .portal-contexts-table th,
  .portal-contexts-table td {
    padding: 12px;
    border-bottom: 1px solid #dbe7ef;
    text-align: left;
    vertical-align: top;
  }

  .portal-contexts-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .portal-contexts-table td {
    color: #1b2c3d;
    font-size: 14px;
  }

  .portal-contexts-title {
    display: grid;
    gap: 4px;
  }

  .portal-contexts-title strong {
    overflow-wrap: anywhere;
  }

  .portal-contexts-title span,
  .portal-contexts-muted {
    color: #66778a;
  }

  .portal-contexts-empty {
    margin: 0;
    padding: 16px;
    border: 1px dashed #b8c7d3;
    border-radius: 8px;
    background: #f8fbfd;
    color: #526274;
    font-size: 14px;
    line-height: 1.5;
  }

  .portal-contexts-notice {
    background: #fffaf0;
  }

  .portal-contexts-warning {
    background: #fff8ee;
  }

  @media (max-width: 1040px) {
    .portal-contexts-shell {
      padding: 18px;
    }

    .portal-contexts-hero,
    .portal-contexts-section-header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .portal-contexts-hero h1,
    .portal-contexts-warning h1 {
      font-size: 32px;
    }

    .portal-contexts-scope-list,
    .portal-contexts-filters {
      grid-template-columns: 1fr;
    }

    .portal-contexts-button,
    .portal-contexts-link-button {
      width: 100%;
    }
  }
`;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeFilterValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const labelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  draft: "Rascunho",
  scheduled: "Agendado",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  published: "Publicado",
  archived: "Arquivado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  completed: "Concluído",
  finished: "Concluído",
  in_progress: "Em curso",
  live: "Em curso",
  open: "Aberto",
  closed: "Fechado",
  school_year: "Ano letivo",
  season: "Época",
  tournament: "Torneio",
  event: "Evento",
  local: "Local",
  regional: "Regional",
  school: "Escola"
};

function formatLabel(value: string | null | undefined, fallback = "Por definir") {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, "_");

  return labelMap[normalized] ?? trimmed.replace(/[_-]/g, " ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sem data";
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    return value;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeZone: "Europe/Lisbon"
  }).format(date);
}

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((first, second) =>
    first.localeCompare(second, "pt")
  );
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    contextos: "contextos",
    entidades: "entidades"
  };

  return labels[section] ?? formatLabel(section);
}

function EmptyState({ message }: { message: string }) {
  return <p className="portal-contexts-empty">{message}</p>;
}

export default async function PortalEscolasContextosPage({ searchParams }: ContextsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = {
    search: firstParam(params.pesquisa).trim(),
    entity: firstParam(params.entidade).trim(),
    status: firstParam(params.estado).trim(),
    type: firstParam(params.tipo).trim()
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
      <main className="portal-contexts-shell">
        <style>{contextsStyles}</style>
        <div className="portal-contexts-wrap">
          <section className="portal-contexts-warning" aria-labelledby="portal-contexts-warning-title">
            <p className="portal-contexts-eyebrow">Portal das Escolas</p>
            <h1 id="portal-contexts-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-contexts-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalContexts(supabase, authorization);
  const contextRows = data.contexts.map((context) => ({
    ...context,
    typeLabel: formatLabel(context.type, "Tipo por definir"),
    statusLabel: formatLabel(context.status),
    startDateLabel: formatDate(context.startDate),
    endDateLabel: formatDate(context.endDate)
  }));
  const filteredContexts = contextRows.filter((context) => {
    const normalizedSearch = normalizeFilterValue(filters.search);
    const searchableText = normalizeFilterValue(`${context.label} ${context.typeLabel} ${context.entityLabel}`);

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.entity || context.entityLabel === filters.entity) &&
      (!filters.status || context.statusLabel === filters.status) &&
      (!filters.type || context.typeLabel === filters.type)
    );
  });
  const entityOptions = uniqueLabels(contextRows.map((context) => context.entityLabel));
  const statusOptions = uniqueLabels(contextRows.map((context) => context.statusLabel));
  const typeOptions = uniqueLabels(contextRows.map((context) => context.typeLabel));
  const hasFilters = Boolean(filters.search || filters.entity || filters.status || filters.type);

  return (
    <main className="portal-contexts-shell">
      <style>{contextsStyles}</style>
      <div className="portal-contexts-wrap">
        <section className="portal-contexts-hero" aria-labelledby="portal-contexts-title">
          <div>
            <p className="portal-contexts-eyebrow">Portal das Escolas</p>
            <h1 id="portal-contexts-title">Contextos</h1>
            <p className="portal-contexts-text">Listagem read-only de contextos disponíveis para os âmbitos autorizados.</p>
          </div>
          <span className="portal-contexts-tag">{formatCountLabel(data.contexts.length, "contexto", "contextos")}</span>
        </section>

        <nav className="portal-contexts-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-contexts-notice" aria-labelledby="portal-contexts-notice-title">
            <h2 id="portal-contexts-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-contexts-section" aria-labelledby="portal-contexts-scope-title">
          <div className="portal-contexts-section-header">
            <div>
              <p className="portal-contexts-eyebrow">Âmbito ativo</p>
              <h2 id="portal-contexts-scope-title">Entidade e contexto</h2>
            </div>
            <span className="portal-contexts-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-contexts-scope-list">
            {data.scopes.map((scope) => (
              <li key={scope.id}>
                <span>Entidade</span>
                <strong>{scope.entityLabel}</strong>
                <span>Contexto</span>
                <strong>{scope.contextLabel}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="portal-contexts-section" aria-labelledby="portal-contexts-list-title">
          <div className="portal-contexts-section-header">
            <div>
              <p className="portal-contexts-eyebrow">Contextos autorizados</p>
              <h2 id="portal-contexts-list-title">Contextos visíveis</h2>
            </div>
            <span className="portal-contexts-tag">
              {hasFilters ? `${filteredContexts.length} de ${data.contexts.length}` : `${data.contexts.length} total`}
            </span>
          </div>

          <form className="portal-contexts-filters" method="get">
            <label className="portal-contexts-filter">
              <span>Pesquisar contexto</span>
              <input name="pesquisa" type="search" defaultValue={filters.search} placeholder="Nome do contexto, entidade ou tipo" />
            </label>
            <label className="portal-contexts-filter">
              <span>Entidade</span>
              <select name="entidade" defaultValue={filters.entity}>
                <option value="">Todas</option>
                {entityOptions.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-contexts-filter">
              <span>Tipo</span>
              <select name="tipo" defaultValue={filters.type}>
                <option value="">Todos</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-contexts-filter">
              <span>Estado</span>
              <select name="estado" defaultValue={filters.status}>
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button className="portal-contexts-button" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <a className="portal-contexts-link-button" href="/portal-escolas/contextos">
                Limpar
              </a>
            ) : null}
          </form>

          {filteredContexts.length > 0 ? (
            <div className="portal-contexts-table-wrap">
              <table className="portal-contexts-table">
                <thead>
                  <tr>
                    <th>Contexto</th>
                    <th>Entidade</th>
                    <th>Tipo</th>
                    <th>Data de início</th>
                    <th>Data de fim</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContexts.map((context) => (
                    <tr key={context.key}>
                      <td>
                        <div className="portal-contexts-title">
                          <strong>{context.label}</strong>
                        </div>
                      </td>
                      <td>{context.entityLabel}</td>
                      <td className={context.type ? undefined : "portal-contexts-muted"}>{context.typeLabel}</td>
                      <td className={context.startDate ? undefined : "portal-contexts-muted"}>{context.startDateLabel}</td>
                      <td className={context.endDate ? undefined : "portal-contexts-muted"}>{context.endDateLabel}</td>
                      <td>
                        <span className="portal-contexts-tag">{context.statusLabel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                data.contexts.length > 0
                  ? "Não há contextos visíveis com os filtros selecionados."
                  : "Ainda não há contextos disponíveis para os âmbitos autorizados."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
