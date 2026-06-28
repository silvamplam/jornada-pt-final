import { redirect } from "next/navigation";
import {
  PORTAL_ESCOLAS_LOGIN_PATH,
  PORTAL_ESCOLAS_PANEL_PATH,
  createPortalEscolasServerClient,
  readPortalAuthorization
} from "@/lib/portal-escolas/auth";
import { PortalEscolasInternalNav } from "../_components/PortalEscolasInternalNav";

export const metadata = {
  title: "Funcionamento | Portal das Escolas | Jornada.pt",
  description: "Guia permanente e read-only sobre o funcionamento do Portal das Escolas."
};

export const dynamic = "force-dynamic";

const funcionamentoStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .portal-functioning-shell {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(15, 111, 141, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .portal-functioning-wrap {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .portal-functioning-hero,
  .portal-functioning-section,
  .portal-functioning-warning {
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .portal-functioning-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    padding: 28px;
  }

  .portal-functioning-section,
  .portal-functioning-warning {
    margin-top: 18px;
    padding: 22px;
  }

  .portal-functioning-eyebrow {
    margin: 0 0 10px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .portal-functioning-hero h1,
  .portal-functioning-warning h1,
  .portal-functioning-section h2 {
    margin: 0;
  }

  .portal-functioning-hero h1,
  .portal-functioning-warning h1 {
    font-size: 38px;
    line-height: 1.05;
  }

  .portal-functioning-section h2 {
    font-size: 22px;
    line-height: 1.2;
  }

  .portal-functioning-text,
  .portal-functioning-warning p,
  .portal-functioning-section p {
    margin: 12px 0 0;
    color: #526274;
    font-size: 15px;
    line-height: 1.55;
  }

  .portal-functioning-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .portal-functioning-actions a {
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

  .portal-functioning-tag {
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

  .portal-functioning-flow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 18px 0 0;
    padding: 0;
    list-style: none;
  }

  .portal-functioning-flow li,
  .portal-functioning-card,
  .portal-functioning-module {
    border: 1px solid #dbe7ef;
    border-radius: 8px;
    background: #f8fbfd;
  }

  .portal-functioning-flow li {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 8px 10px;
    color: #102033;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.2;
  }

  .portal-functioning-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .portal-functioning-grid-two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .portal-functioning-card,
  .portal-functioning-module {
    min-width: 0;
    padding: 14px;
  }

  .portal-functioning-card h3,
  .portal-functioning-module strong {
    margin: 0;
    color: #102033;
    font-size: 15px;
    line-height: 1.25;
  }

  .portal-functioning-card p {
    margin-top: 8px;
    font-size: 14px;
  }

  .portal-functioning-module {
    display: grid;
    gap: 4px;
  }

  .portal-functioning-module span {
    color: #526274;
    font-size: 13px;
    line-height: 1.35;
  }

  .portal-functioning-warning {
    background: #fff8ee;
  }

  @media (max-width: 900px) {
    .portal-functioning-shell {
      padding: 18px;
    }

    .portal-functioning-hero {
      grid-template-columns: 1fr;
    }

    .portal-functioning-hero h1,
    .portal-functioning-warning h1 {
      font-size: 32px;
    }

    .portal-functioning-grid,
    .portal-functioning-grid-two {
      grid-template-columns: 1fr;
    }
  }
`;

const informationFlow = [
  "Entidade",
  "Contexto",
  "Competição",
  "Jornadas/Fases",
  "Participantes",
  "Jogos",
  "Resultados",
  "Conteúdos",
  "Validação",
  "Publicação"
];

const structureItems = [
  {
    title: "Entidade",
    text: "Escola, agrupamento, clube, associação, município ou outro organismo autorizado a trabalhar no Portal."
  },
  {
    title: "Contexto",
    text: "Ano letivo, projeto, programa, época, torneio ou enquadramento operacional onde a atividade decorre."
  },
  {
    title: "Competição",
    text: "Torneio, liga, fase competitiva, encontro ou outra organização desportiva ligada ao contexto autorizado."
  }
];

const activityItems = [
  {
    title: "Participantes e equipas",
    text: "Representam os grupos, equipas ou inscrições associadas a uma competição e ao respetivo contexto."
  },
  {
    title: "Jornadas e fases",
    text: "Organizam a atividade em momentos de calendário, etapas competitivas ou blocos de acompanhamento."
  },
  {
    title: "Jogos e resultados",
    text: "Ligam participantes, calendário e dados estruturados que suportam consulta, classificação e narrativa editorial."
  }
];

const contentItems = [
  {
    title: "Conteúdos",
    text: "Podem documentar a atividade com notícias, vídeos, reportagens, notas, resumos ou outros formatos editoriais."
  },
  {
    title: "Validação",
    text: "Garante qualidade, enquadramento, coerência e responsabilidade antes de a informação avançar no processo."
  },
  {
    title: "Publicação",
    text: "Transforma informação interna validada em conteúdo público organizado e contextualizado na Jornada.pt."
  }
];

const roleItems = [
  {
    title: "Plataforma",
    text: "Define regras globais, estrutura, segurança e separação de responsabilidades."
  },
  {
    title: "Entidade",
    text: "Acede ao seu contexto autorizado e acompanha a atividade que lhe está associada."
  },
  {
    title: "Organizador",
    text: "Estrutura competições, participantes, jornadas, jogos e resultados."
  },
  {
    title: "Colaborador/editor",
    text: "Prepara informação e conteúdos para acompanhamento, revisão e comunicação."
  },
  {
    title: "Gatekeeper/validador",
    text: "Revê e autoriza a progressão da informação, protegendo qualidade, coerência e responsabilidade editorial."
  },
  {
    title: "Público",
    text: "Consulta a informação publicada, já enquadrada e contextualizada."
  }
];

const availableModules = [
  ["Painel", "Resumo operacional dos dados autorizados."],
  ["Perfil e acesso", "Dados da conta, âmbitos e permissões de leitura."],
  ["Contextos", "Contextos de trabalho associados às permissões existentes."],
  ["Competições", "Competições autorizadas e respetiva organização."],
  ["Participantes", "Participantes e equipas visíveis nos âmbitos autorizados."],
  ["Jornadas/fases", "Etapas, fases e jornadas ligadas à atividade."],
  ["Jogos", "Calendário e jogos associados às competições."],
  ["Resultados", "Dados de resultados disponíveis para consulta."],
  ["Conteúdos", "Submissões e conteúdos disponíveis em modo protegido."]
];

function Card({ title, text }: { title: string; text: string }) {
  return (
    <article className="portal-functioning-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export default async function PortalEscolasFuncionamentoPage() {
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
      <main className="portal-functioning-shell">
        <style>{funcionamentoStyles}</style>
        <div className="portal-functioning-wrap">
          <section className="portal-functioning-warning" aria-labelledby="portal-functioning-warning-title">
            <p className="portal-functioning-eyebrow">Portal das Escolas</p>
            <h1 id="portal-functioning-warning-title">Acesso sem autorização ativa</h1>
            <p>{authorization.message}</p>
            <p>A sessão existe, mas o utilizador precisa de estado ativo no Portal e de uma permissão de leitura autorizada.</p>
            <nav className="portal-functioning-actions" aria-label="Navegação do Portal das Escolas">
              <a href={PORTAL_ESCOLAS_LOGIN_PATH}>Voltar ao login</a>
              <a href="/portal-escolas">Voltar ao portal</a>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="portal-functioning-shell">
      <style>{funcionamentoStyles}</style>
      <div className="portal-functioning-wrap">
        <section className="portal-functioning-hero" aria-labelledby="portal-functioning-title">
          <div>
            <p className="portal-functioning-eyebrow">Portal das Escolas</p>
            <h1 id="portal-functioning-title">Funcionamento do Portal das Escolas</h1>
            <p className="portal-functioning-text">
              O Portal organiza a atividade desportiva escolar e local por entidades, contextos, competições, jornadas,
              jogos, resultados e conteúdos, com acesso protegido e validação adequada antes da publicação.
            </p>
          </div>
          <span className="portal-functioning-tag">Guia do portal</span>
        </section>

        <PortalEscolasInternalNav current="funcionamento" />

        <nav className="portal-functioning-actions" aria-label="Navegação do Portal das Escolas">
          <a href={PORTAL_ESCOLAS_PANEL_PATH}>Voltar ao painel</a>
          <a href="/portal-escolas">Voltar ao portal</a>
        </nav>

        <section className="portal-functioning-section" aria-labelledby="portal-functioning-organization-title">
          <p className="portal-functioning-eyebrow">Modelo operacional</p>
          <h2 id="portal-functioning-organization-title">Como a informação é organizada</h2>
          <ul className="portal-functioning-flow" aria-label="Cadeia de organização da informação">
            {informationFlow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            A informação no Portal das Escolas é organizada por níveis. Cada entidade pode estar associada a um ou mais
            contextos de trabalho. Dentro desses contextos podem existir competições, fases, jornadas, participantes,
            jogos, resultados e conteúdos. Esta estrutura permite que a informação seja consultada, preparada, validada e
            publicada de forma coerente.
          </p>
        </section>

        <section className="portal-functioning-section" aria-labelledby="portal-functioning-structure-title">
          <p className="portal-functioning-eyebrow">Estrutura</p>
          <h2 id="portal-functioning-structure-title">Entidades, contextos e competições</h2>
          <div className="portal-functioning-grid">
            {structureItems.map((item) => (
              <Card key={item.title} title={item.title} text={item.text} />
            ))}
          </div>
        </section>

        <section className="portal-functioning-section" aria-labelledby="portal-functioning-activity-title">
          <p className="portal-functioning-eyebrow">Atividade</p>
          <h2 id="portal-functioning-activity-title">Participantes, jornadas, jogos e resultados</h2>
          <div className="portal-functioning-grid">
            {activityItems.map((item) => (
              <Card key={item.title} title={item.title} text={item.text} />
            ))}
          </div>
        </section>

        <section className="portal-functioning-section" aria-labelledby="portal-functioning-content-title">
          <p className="portal-functioning-eyebrow">Fluxo editorial</p>
          <h2 id="portal-functioning-content-title">Conteúdos, validação e publicação</h2>
          <div className="portal-functioning-grid">
            {contentItems.map((item) => (
              <Card key={item.title} title={item.title} text={item.text} />
            ))}
          </div>
        </section>

        <section className="portal-functioning-section" aria-labelledby="portal-functioning-roles-title">
          <p className="portal-functioning-eyebrow">Responsabilidades</p>
          <h2 id="portal-functioning-roles-title">Perfis de utilização</h2>
          <div className="portal-functioning-grid portal-functioning-grid-two">
            {roleItems.map((item) => (
              <Card key={item.title} title={item.title} text={item.text} />
            ))}
          </div>
        </section>

        <section className="portal-functioning-section" aria-labelledby="portal-functioning-available-title">
          <p className="portal-functioning-eyebrow">Modo protegido</p>
          <h2 id="portal-functioning-available-title">O que está disponível no Portal</h2>
          <p>Estas áreas permitem consultar a estrutura e os dados autorizados em modo protegido e read-only.</p>
          <div className="portal-functioning-grid portal-functioning-grid-two">
            {availableModules.map(([title, text]) => (
              <div className="portal-functioning-module" key={title}>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="portal-functioning-section" aria-labelledby="portal-functioning-evolution-title">
          <p className="portal-functioning-eyebrow">Evolução</p>
          <h2 id="portal-functioning-evolution-title">Evolução operacional</h2>
          <p>
            O mesmo modelo pode evoluir para módulos de gestão, submissão, revisão, validação e publicação, mantendo a
            separação entre quem organiza, quem contribui, quem valida e o que é publicado.
          </p>
        </section>
      </div>
    </main>
  );
}
