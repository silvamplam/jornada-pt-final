import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_CALLBACK_PATH,
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  getSafePortalAuthError,
  getPortalSupabaseConfig,
  sanitizePortalAuthErrorText
} from "@/lib/portal-escolas/auth";

export const metadata = {
  title: "Login | Portal das Escolas | Jornada.pt",
  description: "Acesso por magic link ao Portal das Escolas."
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string;
    reason?: string;
    status?: string;
  }>;
};

const loginStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-login-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.13), transparent 34%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-login-panel {
    width: min(440px, 100%);
    padding: 28px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 18px 42px rgba(15, 35, 52, 0.12);
  }

  .portal-login-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-login-panel h1 {
    margin: 0;
    font-size: 32px;
    line-height: 1.05;
  }

  .portal-login-text {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.5;
  }

  .portal-login-form {
    display: grid;
    gap: 12px;
    margin-top: 22px;
  }

  .portal-login-form label {
    color: #33465b;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .portal-login-form input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 13px;
    border: 1px solid #c7d6e3;
    border-radius: 6px;
    color: #102033;
    font: 16px/1.3 Arial, Helvetica, sans-serif;
  }

  .portal-login-form button {
    width: 100%;
    padding: 12px 14px;
    border: 0;
    border-radius: 6px;
    background: #0f6f8d;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: pointer;
  }

  .portal-login-form button:disabled {
    background: #b8c7d3;
    cursor: not-allowed;
  }

  .portal-login-message {
    margin: 18px 0 0;
    padding: 12px 14px;
    border: 1px solid #cbdce7;
    border-radius: 6px;
    background: #f6fafc;
    color: #415164;
    font-size: 14px;
    line-height: 1.45;
  }

  .portal-login-message.error {
    border-color: #f0c1bf;
    background: #fff6f5;
    color: #8b2c29;
  }

  .portal-login-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .portal-login-actions a {
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  @media (max-width: 560px) {
    .portal-login-shell {
      padding: 16px;
      place-items: start center;
    }

    .portal-login-panel {
      padding: 22px;
    }
  }
`;

function getStatusMessage(status: string | undefined, email: string | undefined, reason: string | undefined) {
  if (status === "sent") {
    return {
      kind: "success",
      text: email
        ? `Link de acesso enviado para ${email}. Verifique o email para entrar.`
        : "Link de acesso enviado. Verifique o email para entrar."
    };
  }

  if (status === "invalid-email") {
    return {
      kind: "error",
      text: "Indique um email valido para receber o link de acesso."
    };
  }

  if (status === "not-configured") {
    return {
      kind: "error",
      text: "O login ainda nao esta configurado neste ambiente."
    };
  }

  if (status === "send-error") {
    const safeReason = reason ? sanitizePortalAuthErrorText(reason) : null;

    return {
      kind: "error",
      text: safeReason
        ? `Nao foi possivel enviar o link de acesso. Motivo: ${safeReason}.`
        : "Nao foi possivel enviar o link de acesso. Tente novamente mais tarde."
    };
  }

  if (status === "rate-limited") {
    const safeReason = reason ? sanitizePortalAuthErrorText(reason) : null;

    return {
      kind: "error",
      text: safeReason
        ? `Limite temporario no envio do link. Aguarde alguns minutos antes de tentar novamente. Motivo: ${safeReason}.`
        : "Limite temporario no envio do link. Aguarde alguns minutos antes de tentar novamente."
    };
  }

  if (status === "callback-error") {
    return {
      kind: "error",
      text: "Nao foi possivel concluir o acesso. Peca um novo link."
    };
  }

  if (status === "missing-code") {
    return {
      kind: "error",
      text: "O link de acesso esta incompleto. Peca um novo link."
    };
  }

  return null;
}

async function getRequestOrigin() {
  const normalizeOrigin = (value: string | undefined, defaultProtocol = "https") => {
    const trimmed = value?.trim().replace(/\/+$/, "");

    if (!trimmed) {
      return null;
    }

    return /^https?:\/\//i.test(trimmed) ? trimmed : `${defaultProtocol}://${trimmed}`;
  };
  const configuredOrigin =
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? normalizeOrigin(process.env.SITE_URL);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const vercelOrigin = normalizeOrigin(process.env.VERCEL_URL);

  if (vercelOrigin) {
    return vercelOrigin;
  }

  const headersList = await headers();
  const explicitOrigin = headersList.get("origin");

  if (explicitOrigin) {
    return normalizeOrigin(explicitOrigin);
  }

  const host = (headersList.get("x-forwarded-host") ?? headersList.get("host"))?.split(",")[0]?.trim();

  if (host) {
    const forwardedProto = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const isLocalHost = host.startsWith("localhost") || host.startsWith("127.") || host.startsWith("[::1]");
    const protocol = forwardedProto ?? (process.env.VERCEL ? "https" : isLocalHost ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

async function sendPortalAccessLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    redirect(`${PORTAL_ESCOLAS_LOGIN_PATH}?status=invalid-email`);
  }

  const supabase = await createPortalEscolasServerClient();

  if (!supabase) {
    redirect(`${PORTAL_ESCOLAS_LOGIN_PATH}?status=not-configured`);
  }

  const origin = await getRequestOrigin();
  let authError: ReturnType<typeof getSafePortalAuthError> | null = null;

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}${PORTAL_ESCOLAS_CALLBACK_PATH}`
      }
    });

    if (error) {
      authError = getSafePortalAuthError(error);
    }
  } catch (error) {
    authError = getSafePortalAuthError(error);
  }

  if (authError) {
    console.error("portal-escolas-magic-link-send-error", {
      name: authError.name,
      code: authError.code,
      status: authError.status,
      message: authError.message
    });

    const params = new URLSearchParams({
      status: authError.isRateLimited ? "rate-limited" : "send-error",
      reason: authError.reason
    });

    redirect(`${PORTAL_ESCOLAS_LOGIN_PATH}?${params.toString()}`);
  }

  const params = new URLSearchParams({
    status: "sent",
    email
  });

  redirect(`${PORTAL_ESCOLAS_LOGIN_PATH}?${params.toString()}`);
}

export default async function PortalEscolasLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const statusMessage = getStatusMessage(params?.status, params?.email, params?.reason);
  const configured = Boolean(getPortalSupabaseConfig());

  return (
    <main className="portal-login-shell">
      <style>{loginStyles}</style>
      <section className="portal-login-panel" aria-labelledby="portal-login-title">
        <p className="portal-login-eyebrow">Jornada.pt</p>
        <h1 id="portal-login-title">Portal das Escolas</h1>
        <p className="portal-login-text">
          Introduza o email autorizado para receber um link de acesso. O painel so fica disponivel depois da
          validacao da sessao e das permissoes do portal.
        </p>

        <form className="portal-login-form" action={sendPortalAccessLink}>
          <label htmlFor="portal-email">Email</label>
          <input
            id="portal-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="email@exemplo.pt"
            defaultValue={params?.email ?? ""}
            required
          />
          <button type="submit" disabled={!configured}>
            Enviar link de acesso
          </button>
        </form>

        {!configured ? (
          <p className="portal-login-message error">O login ainda nao esta configurado neste ambiente.</p>
        ) : null}

        {statusMessage ? (
          <p className={`portal-login-message ${statusMessage.kind === "error" ? "error" : ""}`}>
            {statusMessage.text}
          </p>
        ) : null}

        <nav className="portal-login-actions" aria-label="Navegacao do Portal das Escolas">
          <a href="/portal-escolas">Voltar ao portal</a>
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Abrir painel</a>
        </nav>
      </section>
    </main>
  );
}
