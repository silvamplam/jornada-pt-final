import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalModalities } from "@/lib/portal-escolas/readPortalModalities";
import { PortalCompetitionCreateForm } from "./PortalCompetitionCreateForm";
import { PortalEscolasInternalNav } from "../../_components/PortalEscolasInternalNav";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    competicao?: string | string[];
  }>;
};

export const metadata = {
  title: "Detalhe da modalidade | Portal das Escolas | Jornada.pt",
  description: "Leitura read-only detalhada por modalidade formal no Portal das Escolas."
};

export const dynamic = "force-dynamic";

const modalityDetailStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-modality-detail-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-modality-detail-wrap {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .portal-modality-detail-hero,
  .portal-modality-detail-section,
  .portal-modality-detail-warning,
  .portal-modality-detail-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-modality-detail-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-modality-detail-section,
  .portal-modality-detail-warning,
  .portal-modality-detail-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-modality-detail-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-modality-detail-hero h1,
  .portal-modality-detail-warning h1,
  .portal-modality-detail-section h2,
  .portal-modality-detail-notice h2 {
    margin: 0;
  }

  .portal-modality-detail-hero h1,
  .portal-modality-detail-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-modality-detail-section h2,
  .portal-modality-detail-notice h2 {
    font-size: 24px;
    line-height: 1.2;
  }

  .portal-modality-detail-text,
  .portal-modality-detail-warning p,
  .portal-modality-detail-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.55;
  }

  .portal-modality-detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 16px 0;
  }

  .portal-modality-detail-actions a {
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

  .portal-modality-detail-tag {
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

  .portal-modality-detail-section-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: start;
    margin-bottom: 16px;
  }

  .portal-modality-detail-summary-grid,
  .portal-modality-detail-competition-list,
  .portal-modality-detail-component-list,
  .portal-competition-create-grid {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .portal-modality-detail-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .portal-modality-detail-summary-card,
  .portal-modality-detail-competition,
  .portal-modality-detail-component,
  .portal-competition-create-form {
    min-width: 0;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
    padding: 14px;
  }

  .portal-modality-detail-summary-card,
  .portal-modality-detail-competition,
  .portal-modality-detail-component {
    display: grid;
    gap: 5px;
  }

  .portal-modality-detail-summary-card span,
  .portal-modality-detail-competition span,
  .portal-modality-detail-component span,
  .portal-modality-detail-label {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-modality-detail-summary-card strong,
  .portal-modality-detail-competition strong,
  .portal-modality-detail-component strong {
    color: #102033;
    overflow-wrap: anywhere;
  }

  .portal-modality-detail-component-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .portal-competition-create-form {
    display: grid;
    gap: 14px;
  }

  .portal-competition-create-state {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .portal-competition-create-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .portal-competition-create-field {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .portal-competition-create-field-full {
    grid-column: 1 / -1;
  }

  .portal-competition-create-field label {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-competition-create-field input {
    width: 100%;
    box-sizing: border-box;
    min-height: 40px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #102033;
    font: inherit;
    padding: 9px 10px;
  }

  .portal-competition-create-field input[readonly] {
    background: #edf4f8;
    color: #526274;
  }

  .portal-competition-create-field span {
    color: #526274;
    font-size: 12px;
    line-height: 1.4;
  }

  .portal-competition-create-form button {
    justify-self: start;
    min-height: 40px;
    border: 0;
    border-radius: 8px;
    background: #0f6f8d;
    color: #ffffff;
    cursor: pointer;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.02em;
    padding: 10px 14px;
    text-transform: uppercase;
  }

  .portal-modality-detail-feedback {
    margin: 0 0 14px;
    border: 1px solid #bcd7df;
    border-radius: 8px;
    background: #e7f4f8;
    color: #0f6478;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.4;
    padding: 12px 14px;
  }

  .portal-modality-detail-feedback-error {
    border-color: #f1c2c2;
    background: #fff1f1;
    color: #9a3412;
  }

  .portal-modality-detail-empty {
    margin: 0;
    padding: 14px;
    border: 1px dashed #bcd7df;
    border-radius: 8px;
    color: #526274;
    background: #f8fbfd;
    font-size: 14px;
  }

  @media (max-width: 900px) {
    .portal-modality-detail-hero,
    .portal-modality-detail-section-header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .portal-modality-detail-summary-grid,
    .portal-modality-detail-component-list,
    .portal-competition-create-grid {
      grid-template-columns: 1fr;
    }

    .portal-competition-create-field-full {
      grid-column: auto;
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

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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

function getCreateCompetitionStatusMessage(status: string | null) {
  const messages: Record<string, { kind: "success" | "error"; text: string }> = {
    criada: { kind: "success", text: "Competição criada em rascunho e associada a esta modalidade." },
    duplicada: { kind: "error", text: "Já existe uma competição com esse identificador neste contexto." },
    "dados-invalidos": { kind: "error", text: "Não foi possível criar a competição: confirma nome e identificador." },
    "sem-permissao": { kind: "error", text: "Não tens permissão estrutural ativa para criar competições neste contexto." },
    erro: { kind: "error", text: "Não foi possível criar a competição. Tenta novamente ou valida a configuração da fase SQL." }
  };

  return status ? messages[status] ?? null : null;
}

function canCreateCompetitionForModality(
  permissions: {
    portal_entity_id: string;
    portal_context_id: string | null;
    portal_competition_id: string | null;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    status: string;
  }[],
  portalEntityId: string,
  portalContextId: string
) {
  return permissions.some(
    (permission) =>
      permission.status === "active" &&
      permission.can_view &&
      permission.can_create &&
      permission.can_edit &&
      !permission.portal_competition_id &&
      permission.portal_entity_id === portalEntityId &&
      (!permission.portal_context_id || permission.portal_context_id === portalContextId)
  );
}

async function createPortalCompetition(formData: FormData) {
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

  const portalModalityId = readFormText(formData, "portal_modality_id");
  const modalitySlug = normalizeSlug(readFormText(formData, "modality_slug"));
  const name = readOptionalText(formData, "name", 120);
  const slug = normalizeSlug(readFormText(formData, "slug"));
  const scope = readOptionalText(formData, "scope", 80);
  const format = readOptionalText(formData, "format", 120);

  if (!isUuid(portalModalityId) || !name || !slug || !modalitySlug) {
    redirect(`/portal-escolas/modalidades/${modalitySlug || "multidesporto"}?competicao=dados-invalidos`);
  }

  const data = await readPortalModalities(supabase, authorization);
  const modality = data.modalities.find(
    (item) => item.source === "formal" && item.portalModalityId === portalModalityId && item.slug === modalitySlug
  );

  if (!modality) {
    redirect(`/portal-escolas/modalidades/${modalitySlug}?competicao=sem-permissao`);
  }

  if (!canCreateCompetitionForModality(authorization.permissions, modality.portalEntityId, modality.portalContextId)) {
    redirect(`/portal-escolas/modalidades/${modalitySlug}?competicao=sem-permissao`);
  }

  const { error } = await supabase.rpc("portal_create_competition", {
    p_portal_modality_id: portalModalityId,
    p_name: name,
    p_slug: slug,
    p_scope: scope,
    p_format: format,
    p_status: "draft"
  });

  if (error) {
    const errorCode = typeof error.code === "string" ? error.code : "";
    const errorMessage = typeof error.message === "string" ? error.message.toLowerCase() : "";

    if (errorCode === "23505" || errorMessage.includes("already")) {
      redirect(`/portal-escolas/modalidades/${modalitySlug}?competicao=duplicada`);
    }

    if (errorCode === "42501") {
      redirect(`/portal-escolas/modalidades/${modalitySlug}?competicao=sem-permissao`);
    }

    redirect(`/portal-escolas/modalidades/${modalitySlug}?competicao=erro`);
  }

  revalidatePath(`/portal-escolas/modalidades/${modalitySlug}`);
  revalidatePath("/portal-escolas/modalidades");
  redirect(`/portal-escolas/modalidades/${modalitySlug}?competicao=criada`);
}

export default async function PortalModalityDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const safeSlug = decodeURIComponent(slug ?? "").trim();
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
      <main className="portal-modality-detail-shell">
        <style>{modalityDetailStyles}</style>
        <div className="portal-modality-detail-wrap">
          <section className="portal-modality-detail-warning" aria-labelledby="portal-modality-detail-warning-title">
            <p className="portal-modality-detail-eyebrow">Portal das Escolas</p>
            <h1 id="portal-modality-detail-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-modality-detail-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalModalities(supabase, authorization);
  const matchingModalities = data.modalities.filter((modality) => modality.slug === safeSlug);
  const mainModality = matchingModalities[0] ?? null;
  const competitionCount = matchingModalities.reduce((total, modality) => total + modality.competitionCount, 0);
  const componentLabels = Array.from(new Set(matchingModalities.flatMap((modality) => modality.componentLabels)));
  const createCompetitionStatusMessage = getCreateCompetitionStatusMessage(readSearchParam(resolvedSearchParams?.competicao));
  const canCreateCompetition = Boolean(
    mainModality?.source === "formal" &&
      mainModality.portalModalityId &&
      mainModality.slug &&
      canCreateCompetitionForModality(authorization.permissions, mainModality.portalEntityId, mainModality.portalContextId)
  );

  return (
    <main className="portal-modality-detail-shell">
      <style>{modalityDetailStyles}</style>
      <div className="portal-modality-detail-wrap">
        <section className="portal-modality-detail-hero" aria-labelledby="portal-modality-detail-title">
          <div>
            <p className="portal-modality-detail-eyebrow">Portal das Escolas · detalhe da modalidade</p>
            <h1 id="portal-modality-detail-title">{mainModality?.name ?? "Modalidade não encontrada"}</h1>
            <p className="portal-modality-detail-text">
              Leitura read-only da modalidade como eixo funcional. A modalidade define o universo desportivo; os formatos associados definem a mecânica competitiva.
            </p>
          </div>
          <span className="portal-modality-detail-tag">
            {mainModality ? formatCountLabel(competitionCount, "competição", "competições") : "sem dados"}
          </span>
        </section>

        <PortalEscolasInternalNav current="modalidades" />

        <nav className="portal-modality-detail-actions" aria-label="Ações do detalhe da modalidade">
          <a href="/portal-escolas/modalidades">Voltar a modalidades</a>
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-modality-detail-notice" aria-labelledby="portal-modality-detail-notice-title">
            <h2 id="portal-modality-detail-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas de modalidades ainda não estão disponíveis para leitura nesta base de dados: {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        {!mainModality ? (
          <section className="portal-modality-detail-section" aria-labelledby="portal-modality-detail-empty-title">
            <h2 id="portal-modality-detail-empty-title">Sem modalidade visível neste âmbito</h2>
            <p className="portal-modality-detail-text">
              Não foi encontrada uma modalidade com o identificador <strong>{safeSlug || "sem slug"}</strong> dentro das permissões ativas deste utilizador.
            </p>
          </section>
        ) : (
          <>
            <section className="portal-modality-detail-section" aria-labelledby="portal-modality-detail-summary-title">
              <div className="portal-modality-detail-section-header">
                <div>
                  <p className="portal-modality-detail-eyebrow">Eixo formal</p>
                  <h2 id="portal-modality-detail-summary-title">Resumo da modalidade</h2>
                </div>
                <span className="portal-modality-detail-tag">{mainModality.sourceLabel}</span>
              </div>

              <div className="portal-modality-detail-summary-grid">
                <article className="portal-modality-detail-summary-card">
                  <span>Entidade</span>
                  <strong>{mainModality.entityLabel}</strong>
                  <span>Contexto</span>
                  <strong>{mainModality.contextLabel}</strong>
                </article>
                <article className="portal-modality-detail-summary-card">
                  <span>Catálogo</span>
                  <strong>{mainModality.catalogLabel}</strong>
                  <span>Código canónico</span>
                  <strong>{mainModality.catalogCode ?? "Sem código associado"}</strong>
                </article>
                <article className="portal-modality-detail-summary-card">
                  <span>Família</span>
                  <strong>{mainModality.familyLabel}</strong>
                  <span>Estado</span>
                  <strong>{mainModality.statusLabel}</strong>
                </article>
                <article className="portal-modality-detail-summary-card">
                  <span>Evento base</span>
                  <strong>{mainModality.defaultEventModelLabel}</strong>
                </article>
                <article className="portal-modality-detail-summary-card">
                  <span>Resultado base</span>
                  <strong>{mainModality.defaultResultModelLabel}</strong>
                </article>
                <article className="portal-modality-detail-summary-card">
                  <span>Slug</span>
                  <strong>{mainModality.slug ?? "Sem slug"}</strong>
                  <span>Código local</span>
                  <strong>{mainModality.localCode ?? "Sem código local"}</strong>
                </article>
              </div>
            </section>

            <section className="portal-modality-detail-section" aria-labelledby="portal-modality-detail-components-title">
              <div className="portal-modality-detail-section-header">
                <div>
                  <p className="portal-modality-detail-eyebrow">Modalidade + formato</p>
                  <h2 id="portal-modality-detail-components-title">Componentes competitivos</h2>
                  <p className="portal-modality-detail-text">
                    Estes componentes resultam do catálogo da modalidade e dos formatos formais ligados às competições associadas.
                  </p>
                </div>
                <span className="portal-modality-detail-tag">{formatCountLabel(componentLabels.length, "componente", "componentes")}</span>
              </div>

              {componentLabels.length > 0 ? (
                <div className="portal-modality-detail-component-list">
                  {componentLabels.map((component) => (
                    <article key={component} className="portal-modality-detail-component">
                      <span>Componente</span>
                      <strong>{component}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="portal-modality-detail-empty">Ainda não existem componentes competitivos formais disponíveis para esta modalidade.</p>
              )}
            </section>

            <section className="portal-modality-detail-section" aria-labelledby="portal-modality-detail-next-step-title">
              <div className="portal-modality-detail-section-header">
                <div>
                  <p className="portal-modality-detail-eyebrow">Próximo passo</p>
                  <h2 id="portal-modality-detail-next-step-title">Criar competição nesta modalidade</h2>
                  <p className="portal-modality-detail-text">
                    A competição nasce em rascunho, fica ligada a esta modalidade e só poderá ser publicada numa fase futura de gatekeeper.
                  </p>
                </div>
                <span className="portal-modality-detail-tag">Modalidade → competição</span>
              </div>

              {createCompetitionStatusMessage ? (
                <div
                  className={`portal-modality-detail-feedback${
                    createCompetitionStatusMessage.kind === "error" ? " portal-modality-detail-feedback-error" : ""
                  }`}
                  role="status"
                >
                  {createCompetitionStatusMessage.text}
                </div>
              ) : null}

              {canCreateCompetition && mainModality.portalModalityId && mainModality.slug ? (
                <PortalCompetitionCreateForm
                  action={createPortalCompetition}
                  portalModalityId={mainModality.portalModalityId}
                  modalitySlug={mainModality.slug}
                  modalityName={mainModality.name}
                />
              ) : (
                <p className="portal-modality-detail-empty">
                  A criação de competição só fica disponível em modalidades formais com permissão estrutural ativa de criação/edição no contexto.
                </p>
              )}
            </section>

            <section className="portal-modality-detail-section" aria-labelledby="portal-modality-detail-competitions-title">
              <div className="portal-modality-detail-section-header">
                <div>
                  <p className="portal-modality-detail-eyebrow">Competições associadas</p>
                  <h2 id="portal-modality-detail-competitions-title">Competições desta modalidade</h2>
                  <p className="portal-modality-detail-text">
                    A leitura continua informativa: não substitui jogos, resultados, jornadas ou a demo multidesporto existente.
                  </p>
                </div>
                <span className="portal-modality-detail-tag">{formatCountLabel(competitionCount, "competição", "competições")}</span>
              </div>

              <div className="portal-modality-detail-competition-list">
                {matchingModalities.flatMap((modality) =>
                  modality.competitions.map((competition) => (
                    <article key={`${modality.key}-${competition.key}`} className="portal-modality-detail-competition">
                      <span>{modality.contextLabel}</span>
                      <strong>{competition.name}</strong>
                      <span>Formato legacy</span>
                      <strong>{competition.formatLabel}</strong>
                      <span>Formato formal</span>
                      <strong>{competition.formalFormatLabel}</strong>
                      <span>Estado e âmbito</span>
                      <strong>{competition.statusLabel} · {competition.scopeLabel}</strong>
                    </article>
                  ))
                )}
              </div>

              {competitionCount === 0 ? (
                <p className="portal-modality-detail-empty">Ainda não existem competições associadas a esta modalidade neste âmbito autorizado.</p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
