import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { readPortalProfile } from "@/lib/portal-escolas/readPortalProfile";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";

export const metadata = {
  title: "Perfil | Portal das Escolas | Jornada.pt",
  description: "Perfil read-only de acesso ao Portal das Escolas."
};

export const dynamic = "force-dynamic";

const profileStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-profile-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-profile-wrap {
    width: min(1040px, 100%);
    margin: 0 auto;
  }

  .portal-profile-hero,
  .portal-profile-section,
  .portal-profile-warning,
  .portal-profile-notice {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-profile-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-profile-section,
  .portal-profile-warning,
  .portal-profile-notice {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-profile-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-profile-hero h1,
  .portal-profile-warning h1,
  .portal-profile-section h2,
  .portal-profile-notice h2 {
    margin: 0;
  }

  .portal-profile-hero h1,
  .portal-profile-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-profile-section h2,
  .portal-profile-notice h2 {
    font-size: 22px;
    line-height: 1.2;
  }

  .portal-profile-text,
  .portal-profile-warning p,
  .portal-profile-notice p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-profile-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .portal-profile-actions a {
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
  }

  .portal-profile-tag {
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

  .portal-profile-section-header {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: start;
    margin-bottom: 16px;
  }

  .portal-profile-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .portal-profile-detail {
    display: grid;
    gap: 5px;
    min-width: 0;
    padding: 14px;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-profile-detail span,
  .portal-profile-table th {
    color: #526274;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .portal-profile-detail strong {
    min-width: 0;
    color: #102033;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .portal-profile-muted {
    color: #66778a;
  }

  .portal-profile-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #dbe7ef;
    border-radius: 8px;
  }

  .portal-profile-table {
    width: 100%;
    min-width: 780px;
    border-collapse: collapse;
    background: #ffffff;
  }

  .portal-profile-table th,
  .portal-profile-table td {
    padding: 12px;
    border-bottom: 1px solid #dbe7ef;
    text-align: left;
    vertical-align: top;
  }

  .portal-profile-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .portal-profile-table td {
    color: #1b2c3d;
    font-size: 14px;
  }

  .portal-profile-empty {
    margin: 0;
    padding: 16px;
    border: 1px dashed #b8c7d3;
    border-radius: 8px;
    background: #f8fbfd;
    color: #526274;
    font-size: 14px;
    line-height: 1.5;
  }

  .portal-profile-notice {
    background: #fffaf0;
  }

  .portal-profile-warning {
    background: #fff8ee;
  }

  @media (max-width: 760px) {
    .portal-profile-shell {
      padding: 18px;
    }

    .portal-profile-hero,
    .portal-profile-section-header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .portal-profile-hero h1,
    .portal-profile-warning h1 {
      font-size: 32px;
    }

    .portal-profile-details {
      grid-template-columns: 1fr;
    }
  }
`;

const userStatusLabelMap: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  pending: "Pendente",
  disabled: "Desativado",
  archived: "Arquivado"
};

const permissionStatusLabelMap: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  pending: "Pendente",
  disabled: "Desativada",
  archived: "Arquivada"
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

  return trimmed === value && normalized in userStatusLabelMap
    ? userStatusLabelMap[normalized]
    : trimmed.replace(/[_-]/g, " ");
}

function formatUserStatus(value: string) {
  return userStatusLabelMap[value.toLowerCase().replace(/[\s-]+/g, "_")] ?? formatLabel(value);
}

function formatPermissionStatus(value: string) {
  return permissionStatusLabelMap[value.toLowerCase().replace(/[\s-]+/g, "_")] ?? formatLabel(value);
}

function formatUnavailableSection(section: string) {
  const labels: Record<string, string> = {
    competicoes: "competições",
    contextos: "contextos",
    entidades: "entidades"
  };

  return labels[section] ?? formatLabel(section);
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function DetailItem({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="portal-profile-detail">
      <span>{label}</span>
      <strong className={muted ? "portal-profile-muted" : undefined}>{value}</strong>
    </div>
  );
}

export default async function PortalEscolasPerfilPage() {
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
      <main className="portal-profile-shell">
        <style>{profileStyles}</style>
        <div className="portal-profile-wrap">
          <section className="portal-profile-warning" aria-labelledby="portal-profile-warning-title">
            <p className="portal-profile-eyebrow">Portal das Escolas</p>
            <h1 id="portal-profile-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-profile-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  const data = await readPortalProfile(supabase, authorization);
  const portalUserLabel =
    authorization.portalUser.display_name ?? authorization.portalUser.invite_email ?? authorization.portalUser.id;
  const accountEmail = user.email ?? "Email indisponível";

  return (
    <main className="portal-profile-shell">
      <style>{profileStyles}</style>
      <div className="portal-profile-wrap">
        <section className="portal-profile-hero" aria-labelledby="portal-profile-title">
          <div>
            <p className="portal-profile-eyebrow">Portal das Escolas</p>
            <h1 id="portal-profile-title">Perfil e acesso</h1>
            <p className="portal-profile-text">Dados read-only da conta autenticada e dos âmbitos autorizados.</p>
          </div>
          <span className="portal-profile-tag">Apenas leitura</span>
        </section>

        <PortalEscolasInternalNav current="perfil" />

        <nav className="portal-profile-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        {data.unavailableSections.length > 0 ? (
          <section className="portal-profile-notice" aria-labelledby="portal-profile-notice-title">
            <h2 id="portal-profile-notice-title">Dados parcialmente disponíveis</h2>
            <p>
              Algumas áreas reais ainda não estão disponíveis para leitura nesta base de dados:{" "}
              {data.unavailableSections.map(formatUnavailableSection).join(", ")}.
            </p>
          </section>
        ) : null}

        <section className="portal-profile-section" aria-labelledby="portal-profile-account-title">
          <div className="portal-profile-section-header">
            <div>
              <p className="portal-profile-eyebrow">Conta autenticada</p>
              <h2 id="portal-profile-account-title">Dados do utilizador</h2>
            </div>
            <span className="portal-profile-tag">{formatUserStatus(authorization.portalUser.status)}</span>
          </div>
          <div className="portal-profile-details">
            <DetailItem label="Email da conta" value={accountEmail} muted={!user.email} />
            <DetailItem label="Utilizador portal" value={portalUserLabel} />
            <DetailItem label="ID do utilizador portal" value={authorization.portalUser.id} />
            <DetailItem label="Estado do utilizador portal" value={formatUserStatus(authorization.portalUser.status)} />
          </div>
        </section>

        <section className="portal-profile-section" aria-labelledby="portal-profile-access-title">
          <div className="portal-profile-section-header">
            <div>
              <p className="portal-profile-eyebrow">Âmbitos autorizados</p>
              <h2 id="portal-profile-access-title">Permissões de leitura</h2>
            </div>
            <span className="portal-profile-tag">
              {formatCountLabel(data.scopes.length, "permissão", "permissões")}
            </span>
          </div>

          {data.scopes.length > 0 ? (
            <div className="portal-profile-table-wrap">
              <table className="portal-profile-table">
                <thead>
                  <tr>
                    <th>Entidade autorizada</th>
                    <th>Contexto autorizado</th>
                    <th>Competição autorizada</th>
                    <th>Permissão</th>
                    <th>Estado da permissão</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scopes.map((scope) => (
                    <tr key={scope.id}>
                      <td>{scope.entityLabel}</td>
                      <td>{scope.contextLabel}</td>
                      <td>{scope.competitionLabel}</td>
                      <td>{scope.permissionLabel}</td>
                      <td>
                        <span className="portal-profile-tag">{formatPermissionStatus(scope.permissionStatus)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="portal-profile-empty">Ainda não há permissões disponíveis para este utilizador do Portal das Escolas.</p>
          )}
        </section>
      </div>
    </main>
  );
}
