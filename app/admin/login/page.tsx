import { isAdminPasswordConfigured } from "@/lib/admin-session";

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
