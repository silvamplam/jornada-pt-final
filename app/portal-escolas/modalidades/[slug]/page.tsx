import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalModalities } from "@/lib/portal-escolas/readPortalModalities";
import { PortalEscolasInternalNav } from "../../_components/PortalEscolasInternalNav";

type PageProps = {
  params: Promise<{
    slug: string;
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
  .portal-modality-detail-component-list {
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
  .portal-modality-detail-component {
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
    .portal-modality-detail-component-list {
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

export default async function PortalModalityDetailPage({ params }: PageProps) {
  const { slug } = await params;
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

        <nav className="portal-modality-detail-actions" aria-label="Navegação do detalhe da modalidade">
          <a href="/portal-escolas/modalidades">Voltar a modalidades</a>
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas/competicoes">Competições</a>
          <a href="/portal-escolas/multidesporto-demo">Multidesporto demo</a>
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
