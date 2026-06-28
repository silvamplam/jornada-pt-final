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

  .portal-login-secondary {
    margin: 12px 0 0;
    color: #66778a;
    font-size: 13px;
    line-height: 1.45;
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

  .portal-login-message h2 {
    margin: 0;
    color: #102033;
    font-size: 18px;
    line-height: 1.2;
  }

  .portal-login-message p {
    margin: 8px 0 0;
  }

  .portal-login-message a {
    display: inline-flex;
    margin-top: 10px;
    color: #0f6f8d;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
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

type LoginStatusMessage = {
  kind: "success" | "error";
  title?: string;
  text: string;
  detail?: string;
  note?: string;
  actionLabel?: string;
  actionHref?: string;
};

function getStatusMessage(status: string | undefined, reason: string | undefined) {
  if (status === "sent") {
    return {
      kind: "success",
      title: "Consulte o seu email",
      text: "Se o email indicado estiver autorizado, enviámos um link de acesso.",
      detail: "Abra a sua caixa de entrada e clique em “Entrar no Portal das Escolas” para confirmar a identidade e aceder ao painel.",
      note: "O link expira em breve e só pode ser usado uma vez.",
      actionLabel: "Alterar email",
      actionHref: PORTAL_ESCOLAS_LOGIN_PATH
    } satisfies LoginStatusMessage;
  }

  if (status === "invalid-email") {
    return {
      kind: "error",
      text: "Introduza um email válido."
    } satisfies LoginStatusMessage;
  }

  if (status === "not-configured") {
    return {
      kind: "error",
      title: "Login indisponível",
      text: "O login ainda não está configurado neste ambiente."
    } satisfies LoginStatusMessage;
  }

  if (status === "send-error") {
    const safeReason = reason ? sanitizePortalAuthErrorText(reason) : null;

    return {
      kind: "error",
      title: "Não foi possível enviar o link de acesso",
      text: "Tente novamente mais tarde.",
      detail: safeReason ? `Motivo: ${safeReason}.` : undefined
    } satisfies LoginStatusMessage;
  }

  if (status === "rate-limited") {
    return {
      kind: "error",
      title: "Muitos pedidos em pouco tempo",
      text: "Foram feitos muitos pedidos em pouco tempo. Aguarde alguns minutos antes de pedir novo link."
    } satisfies LoginStatusMessage;
  }

  if (status === "callback-error") {
    return {
      kind: "error",
      title: "Não foi possível confirmar o acesso",
      text: "Este link expirou, já foi usado ou deixou de ser válido.",
      detail: "Peça um novo link de acesso.",
      actionLabel: "Pedir novo link",
      actionHref: PORTAL_ESCOLAS_LOGIN_PATH
    } satisfies LoginStatusMessage;
  }

  if (status === "missing-code") {
    return {
      kind: "error",
      title: "Link de acesso incompleto",
      text: "O link usado não contém a informação necessária para confirmar o acesso.",
      detail: "Peça um novo link de acesso.",
      actionLabel: "Pedir novo link",
      actionHref: PORTAL_ESCOLAS_LOGIN_PATH
    } satisfies LoginStatusMessage;
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
  const statusMessage = getStatusMessage(params?.status, params?.reason);
  const configured = Boolean(getPortalSupabaseConfig());

  return (
    <main className="portal-login-shell">
      <style>{loginStyles}</style>
      <section className="portal-login-panel" aria-labelledby="portal-login-title">
        <p className="portal-login-eyebrow">Jornada.pt</p>
        <h1 id="portal-login-title">Portal das Escolas</h1>
        <p className="portal-login-text">Acesso reservado a utilizadores autorizados.</p>
        <p className="portal-login-text">
          Introduza o seu email. Se estiver associado a uma permissão ativa, enviaremos um link de acesso para confirmar
          a sua identidade.
        </p>

        <form className="portal-login-form" action={sendPortalAccessLink}>
          <label htmlFor="portal-email">Email autorizado</label>
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
            Receber link de acesso
          </button>
        </form>
        <p className="portal-login-secondary">
          O acesso ao Portal das Escolas é feito por email. Só utilizadores com permissões ativas conseguem entrar nas
          áreas protegidas.
        </p>

        {!configured ? (
          <p className="portal-login-message error">O login ainda não está configurado neste ambiente.</p>
        ) : null}

        {statusMessage ? (
          <section
            className={`portal-login-message ${statusMessage.kind === "error" ? "error" : ""}`}
            aria-live="polite"
          >
            {statusMessage.title ? <h2>{statusMessage.title}</h2> : null}
            <p>{statusMessage.text}</p>
            {statusMessage.detail ? <p>{statusMessage.detail}</p> : null}
            {statusMessage.note ? <p>{statusMessage.note}</p> : null}
            {statusMessage.actionLabel && statusMessage.actionHref ? (
              <a href={statusMessage.actionHref}>{statusMessage.actionLabel}</a>
            ) : null}
          </section>
        ) : null}

        <nav className="portal-login-actions" aria-label="Navegacao do Portal das Escolas">
          <a href="/portal-escolas">Voltar ao portal</a>
          {params?.status === "sent" ? null : <a href={PORTAL_ESCOLAS_PANEL_PATH}>Abrir painel</a>}
        </nav>
      </section>
    </main>
  );
}
