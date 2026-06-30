import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalModalities } from "@/lib/portal-escolas/readPortalModalities";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";

export const metadata = {
  title: "Modalidades | Portal das Escolas | Jornada.pt",
  description: "Leitura read-only de modalidades disponíveis no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const modalitiesStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-modalities-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-modalities-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-modalities-hero,
  .portal-modalities-section,
  .portal-modalities-warning,
  .portal-modalities-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-modalities-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-modalities-section,
  .portal-modalities-warning,
  .portal-modalities-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-modalities-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-modalities-hero h1,
  .portal-modalities-warning h1,
  .portal-modalities-section h2,
  .portal-modalities-notice h2 {
    margin: 0;
  }

  .portal-modalities-hero h1,
  .portal-modalities-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-modalities-section h2,
  .portal-modalities-notice h2 {
    font-size: 24px;
    line-height: 1.2;
  }

  .portal-modalities-text,
  .portal-modalities-warning p,
  .portal-modalities-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.55;
  }

  .portal-modalities-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 16px 0;
  }

  .portal-modalities-actions a,
  .portal-modalities-card-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 8px 12px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.2;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-modalities-card-link {
    margin-top: 12px;
    border-color: #0f6f8d;
  }

  .portal-modalities-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    min-height: 30px;
    padding: 6px 10px;
    border: 1px solid #bcd7df;
    border-radius: 999px;
    background: #e7f4f8;
    color: #0f6478;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.2;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .portal-modalities-section-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: start;
    margin-bottom: 16px;
  }

  .portal-modalities-scope-list,
  .portal-modalities-grid,
  .portal-modalities-catalog-grid {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-modalities-scope-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .portal-modalities-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .portal-modalities-catalog-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .portal-modalities-card,
  .portal-modalities-scope-list li,
  .portal-modalities-catalog-card {
    min-width: 0;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-modalities-scope-list li,
  .portal-modalities-catalog-card {
    display: grid;
    gap: 5px;
    padding: 14px;
  }

  .portal-modalities-card {
    padding: 16px;
  }

  .portal-modalities-card-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
    margin-bottom: 12px;
  }

  .portal-modalities-card h3,
  .portal-modalities-catalog-card h3 {
    margin: 0;
    color: #102033;
    font-size: 18px;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .portal-modalities-card-meta,
  .portal-modalities-component-list,
  .portal-modalities-competition-list {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin: 10px 0 0;
  }

  .portal-modalities-scope-list span,
  .portal-modalities-card-label,
  .portal-modalities-catalog-card span {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-modalities-scope-list strong,
  .portal-modalities-catalog-card strong,
  .portal-modalities-card strong {
    color: #102033;
    overflow-wrap: anywhere;
  }

  .portal-modalities-competition-list {
    display: grid;
  }

  .portal-modalities-competition {
    display: grid;
    gap: 5px;
    padding: 10px;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #ffffff;
  }

  .portal-modalities-form {
    display: grid;
    gap: 14px;
    margin-top: 16px;
  }

  .portal-modalities-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .portal-modalities-form-field {
    display: grid;
    gap: 7px;
    min-width: 0;
  }

  .portal-modalities-form-field-full {
    grid-column: 1 / -1;
  }

  .portal-modalities-form-field label {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-modalities-form-field input,
  .portal-modalities-form-field select,
  .portal-modalities-form-field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font: inherit;
    font-size: 14px;
    line-height: 1.35;
    padding: 10px 11px;
  }

  .portal-modalities-form-field textarea {
    min-height: 92px;
    resize: vertical;
  }

  .portal-modalities-form-help {
    color: #667789;
    font-size: 12px;
    line-height: 1.45;
  }

  .portal-modalities-form button {
    justify-self: start;
    min-height: 40px;
    padding: 10px 14px;
    border: 1px solid #0f6f8d;
    border-radius: 8px;
    background: #0f6f8d;
    color: #ffffff;
    cursor: pointer;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .portal-modalities-feedback {
    margin-top: 14px;
    padding: 12px;
    border: 1px solid #bcd7df;
    border-radius: 8px;
    background: #e7f4f8;
    color: #0f6478;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.45;
  }

  .portal-modalities-feedback-error {
    border-color: #e6c7c7;
    background: #fff5f5;
    color: #8a2d2d;
  }

  .portal-modalities-empty {
    margin: 0;
    padding: 14px;
    border: 1px dashed #bcd7df;
    border-radius: 8px;
    color: #526274;
    background: #f8fbfd;
    font-size: 14px;
  }

  @media (max-width: 900px) {
    .portal-modalities-hero,
    .portal-modalities-section-header,
    .portal-modalities-card-header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .portal-modalities-scope-list,
    .portal-modalities-grid,
    .portal-modalities-catalog-grid,
    .portal-modalities-form-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    entidades: "Entidades",
    contextos: "Contextos",
    "catálogo de modalidades": "Catálogo de modalidades",
    "modalidades formais": "Modalidades formais",
    competições: "Competições",
    "formatos multidesporto": "Formatos multidesporto"
  };

  return labels[section] ?? section;
}

type ModalitiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CreateStatusMessage = {
  kind: "success" | "error";
  text: string;
};

function readSearchParam(searchParams: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = searchParams?.[key];

  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function getCreateStatusMessage(status: string | null): CreateStatusMessage | null {
  if (status === "criada") {
    return {
      kind: "success",
      text: "Modalidade criada como rascunho. A lista foi atualizada e a auditoria ficou registada no Portal."
    };
  }

  if (status === "sem-permissao") {
    return {
      kind: "error",
      text: "Não foi possível criar a modalidade: a sessão não tem permissão estrutural ativa para criar modalidades neste contexto."
    };
  }

  if (status === "duplicada") {
    return {
      kind: "error",
      text: "Não foi possível criar a modalidade: já existe uma modalidade com esse catálogo ou identificador neste contexto."
    };
  }

  if (status === "dados-invalidos") {
    return {
      kind: "error",
      text: "Não foi possível criar a modalidade: confirma o contexto e indica uma modalidade do catálogo ou um nome local."
    };
  }

  if (status === "erro") {
    return {
      kind: "error",
      text: "Não foi possível criar a modalidade. Confirma se a função SQL da fase está aplicada e se a permissão estrutural está ativa."
    };
  }

  return null;
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function readOptionalText(formData: FormData, key: string, maxLength: number) {
  const value = readFormText(formData, key).slice(0, maxLength);

  return value || null;
}

async function createPortalModality(formData: FormData) {
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

  if (!authorization.allowed) {
    redirect("/portal-escolas/modalidades?modalidade=sem-permissao");
  }

  const portalContextId = readFormText(formData, "portal_context_id");
  const catalogCode = readOptionalText(formData, "catalog_code", 80);
  const name = readOptionalText(formData, "name", 120);
  const localCode = normalizeSlug(readFormText(formData, "local_code")).slice(0, 80) || null;
  const notes = readOptionalText(formData, "notes", 400);
  const slug = normalizeSlug(catalogCode ?? name ?? "");

  if (!isUuid(portalContextId) || (!catalogCode && !name) || !slug) {
    redirect("/portal-escolas/modalidades?modalidade=dados-invalidos");
  }

  const hasStructuralPermission = authorization.permissions.some(
    (permission) =>
      permission.status === "active" &&
      permission.can_view &&
      permission.can_create &&
      permission.can_edit &&
      !permission.portal_competition_id &&
      (!permission.portal_context_id || permission.portal_context_id === portalContextId)
  );

  if (!hasStructuralPermission) {
    redirect("/portal-escolas/modalidades?modalidade=sem-permissao");
  }

  const { error } = await supabase.rpc("portal_create_modality", {
    p_portal_context_id: portalContextId,
    p_catalog_code: catalogCode,
    p_name: name,
    p_slug: slug,
    p_local_code: localCode,
    p_status: "draft",
    p_notes: notes
  });

  if (error) {
    const errorCode = typeof error.code === "string" ? error.code : "";
    const errorMessage = typeof error.message === "string" ? error.message.toLowerCase() : "";

    if (errorCode === "23505" || errorMessage.includes("already")) {
      redirect("/portal-escolas/modalidades?modalidade=duplicada");
    }

    if (errorCode === "42501") {
      redirect("/portal-escolas/modalidades?modalidade=sem-permissao");
    }

    redirect("/portal-escolas/modalidades?modalidade=erro");
  }

  revalidatePath("/portal-escolas/modalidades");
  redirect("/portal-escolas/modalidades?modalidade=criada");
}

export default async function PortalModalitiesPage({ searchParams }: ModalitiesPageProps) {
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
      <main className="portal-modalities-shell">
        <style>{modalitiesStyles}</style>
        <div className="portal-modalities-wrap">
          <section className="portal-modalities-warning" aria-labelledby="portal-modalities-warning-title">
            <p className="portal-modalities-eyebrow">Portal das Escolas</p>
            <h1 id="portal-modalities-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-modalities-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const resolvedSearchParams = await searchParams;
  const createStatusMessage = getCreateStatusMessage(readSearchParam(resolvedSearchParams, "modalidade"));
  const data = await readPortalModalities(supabase, authorization);
  const canCreateModalities = data.creationScopes.length > 0;
  const formalCount = data.modalities.filter((modality) => modality.source === "formal").length;
  const legacyCount = data.modalities.filter((modality) => modality.source === "legacy").length;
  const competitionCount = data.modalities.reduce((total, modality) => total + modality.competitionCount, 0);

  return (
    <main className="portal-modalities-shell">
      <style>{modalitiesStyles}</style>
      <div className="portal-modalities-wrap">
        <section className="portal-modalities-hero" aria-labelledby="portal-modalities-title">
          <div>
            <p className="portal-modalities-eyebrow">Portal das Escolas · modalidades</p>
            <h1 id="portal-modalities-title">Modalidades</h1>
            <p className="portal-modalities-text">
              Leitura read-only por modalidade. Esta página organiza o Portal por modalidade e mostra a ligação a competições e formatos, sem substituir as páginas atuais.
            </p>
          </div>
          <span className="portal-modalities-tag">{formatCountLabel(data.modalities.length, "modalidade", "modalidades")}</span>
        </section>

        <PortalEscolasInternalNav current="modalidades" />

        <nav className="portal-modalities-actions" aria-label="Ações da página de modalidades">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-modalities-notice" aria-labelledby="portal-modalities-notice-title">
            <h2 id="portal-modalities-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas de modalidades ainda não estão disponíveis para leitura nesta base de dados: {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        {canCreateModalities ? (
          <section className="portal-modalities-section" aria-labelledby="portal-modalities-create-title">
            <div className="portal-modalities-section-header">
              <div>
                <p className="portal-modalities-eyebrow">Criação auditada</p>
                <h2 id="portal-modalities-create-title">Criar modalidade</h2>
                <p className="portal-modalities-text">
                  Cria uma modalidade formal no contexto autorizado. A modalidade fica em rascunho e a auditoria é registada automaticamente pela função SQL validada.
                </p>
              </div>
              <span className="portal-modalities-tag">{formatCountLabel(data.creationScopes.length, "contexto disponível", "contextos disponíveis")}</span>
            </div>

            {createStatusMessage ? (
              <div
                className={`portal-modalities-feedback${createStatusMessage.kind === "error" ? " portal-modalities-feedback-error" : ""}`}
                role="status"
              >
                {createStatusMessage.text}
              </div>
            ) : null}

            <form action={createPortalModality} className="portal-modalities-form">
              <div className="portal-modalities-form-grid">
                <div className="portal-modalities-form-field">
                  <label htmlFor="portal-modality-context">Contexto</label>
                  <select id="portal-modality-context" name="portal_context_id" required>
                    {data.creationScopes.map((scope) => (
                      <option key={scope.key} value={scope.portalContextId}>
                        {scope.entityLabel} · {scope.contextLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="portal-modalities-form-field">
                  <label htmlFor="portal-modality-catalog">Modalidade de catálogo</label>
                  <select id="portal-modality-catalog" name="catalog_code">
                    <option value="">Modalidade local/custom</option>
                    {data.catalog.map((catalog) => (
                      <option key={catalog.key} value={catalog.code}>
                        {catalog.name} · {catalog.code}
                      </option>
                    ))}
                  </select>
                  <span className="portal-modalities-form-help">Seleciona uma modalidade do catálogo ou deixa vazio para criar uma modalidade local.</span>
                </div>

                <div className="portal-modalities-form-field">
                  <label htmlFor="portal-modality-name">Nome local</label>
                  <input
                    id="portal-modality-name"
                    name="name"
                    maxLength={120}
                    placeholder="Ex.: Natação Adaptada"
                  />
                  <span className="portal-modalities-form-help">Obrigatório se não escolheres catálogo; opcional para adaptar o nome de uma modalidade do catálogo.</span>
                </div>

                <div className="portal-modalities-form-field">
                  <label htmlFor="portal-modality-local-code">Código local</label>
                  <input
                    id="portal-modality-local-code"
                    name="local_code"
                    maxLength={80}
                    placeholder="Ex.: natacao-adaptada"
                  />
                  <span className="portal-modalities-form-help">Opcional. Usado apenas como referência técnica local.</span>
                </div>

                <div className="portal-modalities-form-field portal-modalities-form-field-full">
                  <label htmlFor="portal-modality-notes">Notas</label>
                  <textarea
                    id="portal-modality-notes"
                    name="notes"
                    maxLength={400}
                    placeholder="Notas internas opcionais sobre esta modalidade."
                  />
                </div>
              </div>

              <button type="submit">Criar modalidade em rascunho</button>
            </form>
          </section>
        ) : null}

        <section className="portal-modalities-section" aria-labelledby="portal-modalities-scope-title">
          <div className="portal-modalities-section-header">
            <div>
              <p className="portal-modalities-eyebrow">Âmbito ativo</p>
              <h2 id="portal-modalities-scope-title">Entidade, contexto e competição</h2>
            </div>
            <span className="portal-modalities-tag">{formatCountLabel(data.scopes.length, "âmbito", "âmbitos")}</span>
          </div>
          <ul className="portal-modalities-scope-list">
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

        <section className="portal-modalities-section" aria-labelledby="portal-modalities-list-title">
          <div className="portal-modalities-section-header">
            <div>
              <p className="portal-modalities-eyebrow">Entrada por modalidade</p>
              <h2 id="portal-modalities-list-title">Modalidades visíveis</h2>
              <p className="portal-modalities-text">
                Mostra modalidades formais quando existem e usa compatibilidade por competição enquanto a ligação formal ainda não estiver completa.
              </p>
            </div>
            <span className="portal-modalities-tag">
              {formalCount} formais · {legacyCount} compatibilidade · {competitionCount} competições
            </span>
          </div>

          {data.modalities.length > 0 ? (
            <div className="portal-modalities-grid">
              {data.modalities.map((modality) => (
                <article key={modality.key} className="portal-modalities-card">
                  <div className="portal-modalities-card-header">
                    <div>
                      <p className="portal-modalities-eyebrow">{modality.contextLabel}</p>
                      <h3>{modality.name}</h3>
                    </div>
                    <span className="portal-modalities-tag">{modality.sourceLabel}</span>
                  </div>

                  <div className="portal-modalities-card-meta" aria-label={`Dados da modalidade ${modality.name}`}>
                    <span className="portal-modalities-tag">{modality.statusLabel}</span>
                    <span className="portal-modalities-tag">{modality.familyLabel}</span>
                    <span className="portal-modalities-tag">Catálogo: {modality.catalogLabel}</span>
                    {modality.catalogCode ? <span className="portal-modalities-tag">{modality.catalogCode}</span> : null}
                  </div>

                  <p className="portal-modalities-text">
                    <span className="portal-modalities-card-label">Evento base</span><br />
                    <strong>{modality.defaultEventModelLabel}</strong>
                  </p>
                  <p className="portal-modalities-text">
                    <span className="portal-modalities-card-label">Resultado base</span><br />
                    <strong>{modality.defaultResultModelLabel}</strong>
                  </p>

                  {modality.componentLabels.length > 0 ? (
                    <div className="portal-modalities-component-list" aria-label={`Componentes de ${modality.name}`}>
                      {modality.componentLabels.map((component) => (
                        <span key={component} className="portal-modalities-tag">{component}</span>
                      ))}
                    </div>
                  ) : null}

                  <p className="portal-modalities-text">
                    <span className="portal-modalities-card-label">Competições associadas</span>
                  </p>
                  {modality.competitions.length > 0 ? (
                    <div className="portal-modalities-competition-list">
                      {modality.competitions.map((competition) => (
                        <div key={competition.key} className="portal-modalities-competition">
                          <strong>{competition.name}</strong>
                          <span>{competition.formatLabel} · {competition.statusLabel} · {competition.scopeLabel}</span>
                          <span>{competition.formalFormatLabel}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="portal-modalities-empty">Ainda não existem competições associadas a esta modalidade neste âmbito.</p>
                  )}

                  {modality.slug ? (
                    <a className="portal-modalities-card-link" href={`/portal-escolas/modalidades/${encodeURIComponent(modality.slug)}`}>
                      Abrir detalhe da modalidade
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="portal-modalities-empty">Ainda não existem modalidades visíveis para o âmbito autorizado.</p>
          )}
        </section>

        <section className="portal-modalities-section" aria-labelledby="portal-modalities-catalog-title">
          <div className="portal-modalities-section-header">
            <div>
              <p className="portal-modalities-eyebrow">Catálogo canónico</p>
              <h2 id="portal-modalities-catalog-title">Modalidades de referência</h2>
              <p className="portal-modalities-text">
                Este catálogo confirma que o Portal não nasce dependente do futebol: cada modalidade pode apontar para modelos próprios de evento e resultado.
              </p>
            </div>
            <span className="portal-modalities-tag">{formatCountLabel(data.catalog.length, "modalidade no catálogo", "modalidades no catálogo")}</span>
          </div>

          {data.catalog.length > 0 ? (
            <div className="portal-modalities-catalog-grid">
              {data.catalog.map((catalog) => (
                <article key={catalog.key} className="portal-modalities-catalog-card">
                  <h3>{catalog.name}</h3>
                  <span>Código</span>
                  <strong>{catalog.code}</strong>
                  <span>Família</span>
                  <strong>{catalog.familyLabel}</strong>
                  <span>Evento base</span>
                  <strong>{catalog.defaultEventModelLabel}</strong>
                  <span>Resultado base</span>
                  <strong>{catalog.defaultResultModelLabel}</strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="portal-modalities-empty">O catálogo de modalidades ainda não está disponível para leitura nesta base de dados.</p>
          )}
        </section>
      </div>
    </main>
  );
}
