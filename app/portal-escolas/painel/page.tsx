import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";

export const metadata = {
  title: "Painel | Portal das Escolas | Jornada.pt",
  description: "Painel autenticado minimo do Portal das Escolas."
};

export const dynamic = "force-dynamic";

const panelStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-panel-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-panel-wrap {
    width: min(980px, 100%);
    margin: 0 auto;
  }

  .portal-panel-hero,
  .portal-panel-section,
  .portal-panel-warning {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-panel-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-panel-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-panel-hero h1 {
    margin: 0;
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-panel-text {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-panel-tag {
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

  .portal-panel-section,
  .portal-panel-warning {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-panel-section h2,
  .portal-panel-warning h2 {
    margin: 0;
    font-size: 22px;
  }

  .portal-panel-warning {
    border-color: #ffd3a3;
    background: #fff8ee;
  }

  .portal-panel-warning p {
    margin: 10px 0 0;
    color: #5b6571;
    line-height: 1.45;
  }

  .portal-panel-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .portal-panel-item {
    min-width: 0;
    padding: 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-panel-item span {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-panel-item strong {
    display: block;
    margin-top: 7px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .portal-panel-list {
    display: grid;
    gap: 10px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-panel-list li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid #d7e4ed;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-panel-list strong,
  .portal-panel-list span {
    display: block;
    overflow-wrap: anywhere;
  }

  .portal-panel-list strong {
    color: #102033;
    font-size: 14px;
  }

  .portal-panel-list span {
    margin-top: 4px;
    color: #667789;
    font-size: 13px;
  }

  .portal-panel-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-panel-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  @media (max-width: 760px) {
    .portal-panel-shell {
      padding: 16px;
    }

    .portal-panel-hero,
    .portal-panel-grid,
    .portal-panel-list li {
      grid-template-columns: 1fr;
    }

    .portal-panel-hero {
      padding: 22px;
    }
  }
`;

export default async function PortalEscolasPainelPage() {
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
      <main className="portal-panel-shell">
        <style>{panelStyles}</style>
        <div className="portal-panel-wrap">
          <section className="portal-panel-warning" aria-labelledby="portal-panel-warning-title">
            <p className="portal-panel-eyebrow">Portal das Escolas</p>
            <h1 id="portal-panel-warning-title">Acesso sem autorizacao ativa</h1>
            <p>{authorization.message}</p>
            <p>
              A sessao existe, mas o utilizador precisa de `portal_users.status = active` e de uma permissao
              `portal_permissions.status = active` com `can_view = true`.
            </p>
            <nav className="portal-panel-actions" aria-label="Navegacao do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="portal-panel-shell">
      <style>{panelStyles}</style>
      <div className="portal-panel-wrap">
        <section className="portal-panel-hero" aria-labelledby="portal-panel-title">
          <div>
            <p className="portal-panel-eyebrow">Jornada.pt</p>
            <h1 id="portal-panel-title">Painel do Portal das Escolas</h1>
            <p className="portal-panel-text">
              Acesso autenticado e validado no servidor. Esta primeira versao e apenas de leitura.
            </p>
          </div>
          <span className="portal-panel-tag">Autorizado</span>
        </section>

        <section className="portal-panel-section" aria-labelledby="portal-panel-session-title">
          <h2 id="portal-panel-session-title">Sessao</h2>
          <div className="portal-panel-grid">
            <div className="portal-panel-item">
              <span>Email</span>
              <strong>{user.email ?? "Sem email"}</strong>
            </div>
            <div className="portal-panel-item">
              <span>Utilizador portal</span>
              <strong>{authorization.portalUser.display_name ?? authorization.portalUser.invite_email ?? authorization.portalUser.id}</strong>
            </div>
            <div className="portal-panel-item">
              <span>Estado</span>
              <strong>{authorization.portalUser.status}</strong>
            </div>
          </div>
        </section>

        <section className="portal-panel-section" aria-labelledby="portal-panel-permissions-title">
          <h2 id="portal-panel-permissions-title">Escopo autorizado</h2>
          <p className="portal-panel-text">
            Permissoes ativas com leitura permitida. Nao ha criacao, edicao, upload ou publicacao nesta fase.
          </p>
          <ul className="portal-panel-list">
            {authorization.permissions.map((permission) => (
              <li key={permission.id}>
                <div>
                  <strong>Entidade: {permission.portal_entity_id}</strong>
                  <span>
                    Contexto: {permission.portal_context_id ?? "global"} | Competicao:{" "}
                    {permission.portal_competition_id ?? "global"}
                  </span>
                </div>
                <span className="portal-panel-tag">can_view</span>
              </li>
            ))}
          </ul>
        </section>

        <nav className="portal-panel-actions" aria-label="Navegacao do Portal das Escolas">
          <a href="/portal-escolas">Voltar ao portal</a>
          <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Login</a>
        </nav>
      </div>
    </main>
  );
}
