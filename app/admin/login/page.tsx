import { isAdminPasswordConfigured } from "@/lib/admin-session";

const adminLoginStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .admin-login-shell {
    display: grid;
    place-items: center;
    min-height: 100vh;
    padding: 24px;
    background:
      radial-gradient(circle at top left, rgba(229, 37, 42, 0.12), transparent 28%),
      linear-gradient(135deg, #eef2f6, #ffffff);
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .admin-login-card {
    width: min(100%, 430px);
    padding: 28px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 24px 58px rgba(8, 15, 24, 0.14);
  }

  .admin-login-card p,
  .admin-login-card h1,
  .admin-login-card span {
    margin: 0;
  }

  .admin-login-card p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .admin-login-card h1 {
    margin-top: 8px;
    font-size: 34px;
    line-height: 1;
  }

  .admin-login-card span {
    display: block;
    margin-top: 10px;
    color: #5e6874;
    font-size: 15px;
  }

  .admin-login-error,
  .admin-login-success {
    display: block;
    margin-top: 18px;
    padding: 11px 12px;
    border-radius: 6px;
    font-size: 13px;
  }

  .admin-login-error {
    border: 1px solid #ffd3a3;
    background: #fff8ee;
    color: #9a3b00;
  }

  .admin-login-success {
    border: 1px solid #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .admin-login-card form {
    display: grid;
    gap: 10px;
    margin-top: 22px;
  }

  .admin-login-card label {
    color: #5e6874;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .admin-login-card input {
    width: 100%;
    box-sizing: border-box;
    padding: 13px 14px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    font: inherit;
  }

  .admin-login-card input:focus {
    outline: 2px solid rgba(229, 37, 42, 0.18);
    border-color: #e5252a;
  }

  .admin-login-card button {
    padding: 13px 14px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: pointer;
  }

  .admin-login-card button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .admin-login-card > a {
    display: inline-block;
    margin-top: 16px;
    color: #5e6874;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }
`;

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    loggedOut?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const isConfigured = isAdminPasswordConfigured();
  const hasInvalidPassword = params.error === "invalid";
  const isMissingConfig = params.error === "missing" || !isConfigured;

  return (
    <main className="admin-login-shell">
      <style>{adminLoginStyles}</style>
      <section className="admin-login-card">
        <p>Jornada.pt</p>
        <h1>Entrar no backoffice</h1>
        <span>Area reservada para gestao editorial e dados do projeto.</span>

        {params.loggedOut ? <strong className="admin-login-success">Sessao terminada.</strong> : null}
        {hasInvalidPassword ? <strong className="admin-login-error">Password incorreta.</strong> : null}
        {isMissingConfig ? (
          <strong className="admin-login-error">Falta configurar ADMIN_PASSWORD na Vercel.</strong>
        ) : null}

        <form action="/api/admin/login" method="post">
          <input type="hidden" name="next" value={params.next ?? "/admin"} />
          <label htmlFor="admin-password">Password</label>
          <input
            autoComplete="current-password"
            disabled={!isConfigured}
            id="admin-password"
            name="password"
            placeholder="Password do administrador"
            required
            type="password"
          />
          <button disabled={!isConfigured} type="submit">
            Entrar
          </button>
        </form>

        <a href="/">Voltar ao site</a>
      </section>
    </main>
  );
}
