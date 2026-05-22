import type { ReactNode } from "react";
import { getAdminMatchdaysEditor, type SupabaseAdminMatchday } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const matchdayAdminStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .matchday-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .matchday-admin-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.16);
  }

  .matchday-admin-hero p,
  .matchday-admin-hero h1,
  .matchday-admin-hero span {
    margin: 0;
  }

  .matchday-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .matchday-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .matchday-admin-hero span {
    display: block;
    margin-top: 10px;
    max-width: 780px;
    color: #cdd5df;
    font-size: 16px;
  }

  .matchday-admin-hero a {
    flex: 0 0 auto;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .matchday-admin-message {
    margin-top: 18px;
    padding: 16px 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .matchday-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .matchday-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .matchday-admin-create,
  .matchday-admin-list {
    margin-top: 18px;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .matchday-admin-create header,
  .matchday-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .matchday-admin-create h2,
  .matchday-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .matchday-admin-create small,
  .matchday-admin-list small {
    color: #687380;
  }

  .matchday-create-form,
  .matchday-form {
    display: grid;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .matchday-create-form {
    grid-template-columns: minmax(220px, 1.4fr) 100px minmax(150px, 1fr) minmax(145px, 1fr) minmax(145px, 1fr) minmax(170px, 1fr) 118px;
    align-items: end;
  }

  .matchday-form {
    grid-template-columns: minmax(270px, 330px) minmax(0, 1fr);
    align-items: start;
  }

  .matchday-form:last-child {
    border-bottom: 0;
  }

  .matchday-card {
    display: grid;
    gap: 10px;
    padding: 14px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .matchday-card strong {
    font-size: 18px;
  }

  .matchday-card span,
  .matchday-card small {
    color: #5e6874;
  }

  .matchday-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .matchday-stats b {
    display: block;
    color: #e5252a;
    font-size: 22px;
  }

  .matchday-stats span {
    display: block;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .matchday-fields {
    display: grid;
    grid-template-columns: repeat(4, minmax(145px, 1fr));
    gap: 10px;
    align-items: end;
  }

  .matchday-field {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .matchday-field.wide {
    grid-column: span 2;
  }

  .matchday-field.full {
    grid-column: 1 / -1;
  }

  .matchday-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .matchday-field input,
  .matchday-field select,
  .matchday-field textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 39px;
    padding: 9px 10px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 14px;
  }

  .matchday-field textarea {
    min-height: 74px;
    resize: vertical;
  }

  .matchday-field input:focus,
  .matchday-field select:focus,
  .matchday-field textarea:focus {
    outline: 2px solid rgba(229, 37, 42, 0.16);
    border-color: #e5252a;
  }

  .matchday-check {
    display: flex;
    gap: 8px;
    align-items: center;
    min-height: 39px;
    color: #5e6874;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .matchday-check input {
    width: 18px;
    height: 18px;
  }

  .matchday-sync-badge {
    display: inline-flex;
    width: fit-content;
    padding: 6px 8px;
    border: 1px solid #dce3eb;
    border-radius: 999px;
    background: #ffffff;
    color: #44505c;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .matchday-sync-badge.api {
    border-color: #b9ddff;
    background: #eef7ff;
    color: #0b5fa5;
  }

  .matchday-sync-badge.mixed,
  .matchday-sync-badge.override {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .matchday-admin-button {
    min-height: 39px;
    padding: 10px 12px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: pointer;
  }

  .matchday-admin-button:disabled,
  .matchday-field input:disabled,
  .matchday-field select:disabled,
  .matchday-field textarea:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 1360px) {
    .matchday-create-form,
    .matchday-form {
      grid-template-columns: 1fr;
    }

    .matchday-fields {
      grid-template-columns: repeat(3, minmax(150px, 1fr));
    }
  }

  @media (max-width: 820px) {
    .matchday-admin-shell {
      padding: 16px;
    }

    .matchday-admin-hero,
    .matchday-fields {
      display: grid;
      grid-template-columns: 1fr;
    }

    .matchday-field.wide,
    .matchday-field.full {
      grid-column: 1;
    }
  }
`;

type MatchdaysPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
};

const statusOptions = [
  { value: "scheduled", label: "Agendada" },
  { value: "live", label: "Em curso" },
  { value: "finished", label: "Fechada" },
  { value: "archived", label: "Historica" }
];

function errorMessage(error?: string) {
  if (error === "missing-service") {
    return "Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel para gravar alteracoes.";
  }

  if (error === "missing-fields") {
    return "Epoca, numero e titulo da jornada sao obrigatorios.";
  }

  if (error === "missing-editorial-fields") {
    return "Ainda falta aplicar o passo 08 no Supabase para ativar os campos editoriais da jornada.";
  }

  if (error === "save") {
    return "Nao foi possivel guardar a jornada.";
  }

  return null;
}

function cleanDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function sourceLabel(matchday: SupabaseAdminMatchday, syncAvailable: boolean) {
  if (!syncAvailable) {
    return "Preparar sincronizacao";
  }

  if (matchday.manual_override || matchday.sync_status === "manual_override") {
    return "Corrigida pelo administrador";
  }

  if (matchday.data_source === "api") {
    return "Sincronizada por API";
  }

  if (matchday.data_source === "mixed") {
    return "Dados mistos";
  }

  return "Introduzida manualmente";
}

function sourceClass(matchday: SupabaseAdminMatchday) {
  if (matchday.manual_override || matchday.sync_status === "manual_override") {
    return "matchday-sync-badge override";
  }

  if (matchday.data_source === "api") {
    return "matchday-sync-badge api";
  }

  if (matchday.data_source === "mixed") {
    return "matchday-sync-badge mixed";
  }

  return "matchday-sync-badge";
}

function textField(
  id: string,
  label: string,
  name: string,
  value: string | number | null | undefined,
  disabled: boolean,
  type = "text",
  required = false,
  className = "matchday-field"
) {
  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <input disabled={disabled} id={id} name={name} required={required} type={type} defaultValue={value ?? ""} />
    </div>
  );
}

function textAreaField(
  id: string,
  label: string,
  name: string,
  value: string | null | undefined,
  disabled: boolean,
  className = "matchday-field full"
) {
  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <textarea disabled={disabled} id={id} name={name} defaultValue={value ?? ""} />
    </div>
  );
}

function selectField(
  id: string,
  label: string,
  name: string,
  value: string | null | undefined,
  options: ReactNode,
  disabled: boolean,
  required = false
) {
  return (
    <div className="matchday-field">
      <label htmlFor={id}>{label}</label>
      <select disabled={disabled} id={id} name={name} required={required} defaultValue={value ?? ""}>
        {options}
      </select>
    </div>
  );
}

export default async function AdminMatchdaysPage({ searchParams }: MatchdaysPageProps) {
  const params = await searchParams;
  const overview = await getAdminMatchdaysEditor();
  const message = errorMessage(params.error);
  const canWrite = overview.writeConfigured && !overview.error;
  const defaultSeasonId = overview.seasons[0]?.id ?? "";

  return (
    <main className="matchday-admin-shell">
      <style>{matchdayAdminStyles}</style>
      <header className="matchday-admin-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Jornadas</h1>
          <span>A jornada e a entidade onde os jogos, resultados, manchetes, noticias e memoria historica ganham contexto.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {!overview.configured ? (
        <section className="matchday-admin-message warning">Supabase ainda nao esta ligado.</section>
      ) : overview.error ? (
        <section className="matchday-admin-message warning">{overview.error}</section>
      ) : !overview.editorialFieldsAvailable ? (
        <section className="matchday-admin-message warning">
          Aplica o passo 08 no Supabase para ativar titulo editorial, resumo, imagem, video, destaque e memoria historica da jornada.
        </section>
      ) : null}

      {message ? <section className="matchday-admin-message warning">{message}</section> : null}
      {params.created ? <section className="matchday-admin-message success">Jornada criada.</section> : null}
      {params.updated ? <section className="matchday-admin-message success">Jornada atualizada.</section> : null}

      <section className="matchday-admin-create">
        <header>
          <h2>Nova jornada</h2>
          <small>Cria a unidade narrativa. Depois ligas jogos, noticias, videos, classificacao e transmissoes.</small>
        </header>
        <form action="/api/admin/matchdays" className="matchday-create-form" method="post">
          {overview.editorialFieldsAvailable ? <input name="editorial_fields_available" type="hidden" value="1" /> : null}
          {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
          {selectField(
            "new-season",
            "Epoca",
            "season_id",
            defaultSeasonId,
            overview.seasons.map((season) => {
              const competition = overview.competitions.find((item) => item.id === season.competition_id);

              return (
                <option key={season.id} value={season.id}>
                  {competition?.name ?? "Competicao"} - {season.label}
                </option>
              );
            }),
            !canWrite,
            true
          )}
          {textField("new-number", "Numero", "number", "", !canWrite, "number", true)}
          {textField("new-label", "Titulo", "label", "", !canWrite, "text", true)}
          {textField("new-starts", "Inicio", "starts_on", "", !canWrite, "date")}
          {textField("new-ends", "Fim", "ends_on", "", !canWrite, "date")}
          {selectField(
            "new-status",
            "Estado",
            "status",
            "scheduled",
            statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            )),
            !canWrite
          )}
          <button className="matchday-admin-button" disabled={!canWrite} type="submit">Criar</button>
        </form>
      </section>

      <section className="matchday-admin-list">
        <header>
          <h2>Jornadas existentes</h2>
          <small>{overview.matchdays.length} jornadas na base de dados</small>
        </header>

        {overview.matchdays.map((matchday) => (
          <form action={`/api/admin/matchdays/${matchday.id}`} className="matchday-form" key={matchday.id} method="post">
            {overview.editorialFieldsAvailable ? <input name="editorial_fields_available" type="hidden" value="1" /> : null}
            {overview.syncMetadataAvailable ? <input name="sync_metadata_available" type="hidden" value="1" /> : null}
            <input name="current_data_source" type="hidden" defaultValue={matchday.data_source ?? "manual"} />
            <div className="matchday-card">
              <strong>{matchday.editorial_title || matchday.label}</strong>
              <span>{matchday.competition?.name ?? "Competicao"} - {matchday.season?.label ?? "Epoca"}</span>
              <small>{matchday.starts_on ? cleanDate(matchday.starts_on) : "Sem data"} - {matchday.ends_on ? cleanDate(matchday.ends_on) : "Sem fim"}</small>
              <span className={sourceClass(matchday)}>{sourceLabel(matchday, overview.syncMetadataAvailable)}</span>
              {matchday.last_synced_at ? <small>Ultima sincronizacao: {new Date(matchday.last_synced_at).toLocaleString("pt-PT")}</small> : null}
              <div className="matchday-stats">
                <span><b>{matchday.matchCount}</b> jogos</span>
                <span><b>{matchday.articleCount}</b> noticias</span>
                <span><b>{matchday.headlineCount}</b> manchetes</span>
              </div>
            </div>

            <div className="matchday-fields">
              {selectField(
                `season-${matchday.id}`,
                "Epoca",
                "season_id",
                matchday.season_id,
                overview.seasons.map((season) => {
                  const competition = overview.competitions.find((item) => item.id === season.competition_id);

                  return (
                    <option key={season.id} value={season.id}>
                      {competition?.name ?? "Competicao"} - {season.label}
                    </option>
                  );
                }),
                !canWrite,
                true
              )}
              {textField(`number-${matchday.id}`, "Numero", "number", matchday.number, !canWrite, "number", true)}
              {textField(`label-${matchday.id}`, "Titulo tecnico", "label", matchday.label, !canWrite, "text", true, "matchday-field wide")}
              {selectField(
                `status-${matchday.id}`,
                "Estado",
                "status",
                matchday.status,
                statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                )),
                !canWrite
              )}
              {textField(`starts-${matchday.id}`, "Inicio", "starts_on", cleanDate(matchday.starts_on), !canWrite, "date")}
              {textField(`ends-${matchday.id}`, "Fim", "ends_on", cleanDate(matchday.ends_on), !canWrite, "date")}
              {textField(`order-${matchday.id}`, "Ordem", "display_order", matchday.display_order, !canWrite, "number")}
              <label className="matchday-check">
                <input defaultChecked={Boolean(matchday.is_featured)} disabled={!canWrite || !overview.editorialFieldsAvailable} name="is_featured" type="checkbox" value="1" />
                Destaque
              </label>
              {textField(`editorial-title-${matchday.id}`, "Titulo editorial", "editorial_title", matchday.editorial_title, !canWrite || !overview.editorialFieldsAvailable, "text", false, "matchday-field wide")}
              {textField(`hero-${matchday.id}`, "Imagem principal URL", "hero_image_url", matchday.hero_image_url, !canWrite || !overview.editorialFieldsAvailable, "url", false, "matchday-field wide")}
              {textField(`video-${matchday.id}`, "Video URL", "video_url", matchday.video_url, !canWrite || !overview.editorialFieldsAvailable, "url", false, "matchday-field wide")}
              {textField(`seo-title-${matchday.id}`, "SEO titulo", "seo_title", matchday.seo_title, !canWrite || !overview.editorialFieldsAvailable, "text", false, "matchday-field wide")}
              {textAreaField(`summary-${matchday.id}`, "Resumo contextual", "context_summary", matchday.context_summary, !canWrite)}
              {textAreaField(`editorial-summary-${matchday.id}`, "Resumo editorial", "editorial_summary", matchday.editorial_summary, !canWrite || !overview.editorialFieldsAvailable)}
              {textAreaField(`memory-${matchday.id}`, "Memoria historica", "memory_note", matchday.memory_note, !canWrite || !overview.editorialFieldsAvailable)}
              {textAreaField(`seo-description-${matchday.id}`, "SEO descricao", "seo_description", matchday.seo_description, !canWrite || !overview.editorialFieldsAvailable)}
              <button className="matchday-admin-button" disabled={!canWrite} type="submit">Guardar</button>
            </div>
          </form>
        ))}
      </section>
    </main>
  );
}
