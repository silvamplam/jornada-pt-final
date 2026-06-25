export const metadata = {
  title: "Portal das Escolas | Jornada.pt",
  description:
    "Área futura para escolas, clubes e entidades parceiras prepararem participantes, jornadas, jogos e conteúdos."
};

const portalEscolasStyles = `
  body {
    margin: 0;
    background: #eef3f8;
  }

  .school-portal-shell {
    min-height: 100vh;
    padding: 32px;
    background:
      radial-gradient(circle at top left, rgba(22, 96, 136, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fbfd 0%, #eef3f8 100%);
    color: #102033;
    font-family: Arial, Helvetica, sans-serif;
  }

  .school-portal-wrap {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .school-portal-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 28px;
    align-items: end;
    padding: 34px;
    border: 1px solid rgba(15, 35, 52, 0.1);
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 20px 45px rgba(15, 35, 52, 0.12);
  }

  .school-portal-eyebrow {
    margin: 0 0 12px;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .school-portal-hero h1 {
    margin: 0;
    font-size: clamp(34px, 5vw, 58px);
    line-height: 0.98;
    letter-spacing: 0;
  }

  .school-portal-hero p:last-child {
    max-width: 720px;
    margin: 16px 0 0;
    color: #526274;
    font-size: 17px;
    line-height: 1.55;
  }

  .school-portal-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 132px;
    padding: 10px 14px;
    border: 1px solid #bcd7df;
    border-radius: 999px;
    background: #e8f6f8;
    color: #0f6478;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .school-portal-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 22px;
  }

  .school-portal-participants {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr);
    gap: 18px;
    margin-top: 22px;
    padding: 24px;
    border: 1px solid #cbdce7;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 16px 34px rgba(15, 35, 52, 0.09);
  }

  .school-portal-participants h2,
  .school-portal-flow h3 {
    margin: 0;
    color: #102033;
  }

  .school-portal-participants-subtitle {
    margin: 8px 0 18px;
    color: #5a6979;
    font-size: 16px;
    line-height: 1.45;
  }

  .school-portal-demo-label {
    display: block;
    margin-bottom: 8px;
    color: #33465b;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .school-portal-demo-list {
    width: 100%;
    min-height: 144px;
    box-sizing: border-box;
    resize: none;
    padding: 16px;
    border: 1px solid #cbd7e2;
    border-radius: 10px;
    background: #f8fbfd;
    color: #26384c;
    font: 15px/1.6 Arial, Helvetica, sans-serif;
  }

  .school-portal-demo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-top: 14px;
  }

  .school-portal-disabled-button {
    padding: 10px 14px;
    border: 0;
    border-radius: 999px;
    background: #d9e4ec;
    color: #617184;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: not-allowed;
  }

  .school-portal-module-note {
    margin: 14px 0 0;
    color: #667789;
    font-size: 14px;
    line-height: 1.45;
  }

  .school-portal-flow {
    padding: 18px;
    border: 1px solid #d7e4ed;
    border-radius: 12px;
    background: #f6fafc;
  }

  .school-portal-flow ol {
    display: grid;
    gap: 10px;
    margin: 14px 0 0;
    padding-left: 20px;
    color: #45586d;
    font-size: 14px;
    line-height: 1.35;
  }

  .school-portal-card {
    min-width: 0;
    padding: 22px;
    border: 1px solid #d8e3eb;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%);
    box-shadow: 0 10px 24px rgba(15, 35, 52, 0.07);
  }

  .school-portal-card h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.2;
  }

  .school-portal-card p {
    margin: 10px 0 18px;
    color: #5a6979;
    font-size: 15px;
    line-height: 1.45;
  }

  .school-portal-tag {
    display: inline-flex;
    padding: 7px 10px;
    border: 1px solid #d2dde7;
    border-radius: 999px;
    background: #ffffff;
    color: #6a7684;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .school-portal-note {
    margin-top: 22px;
    padding: 18px 20px;
    border: 1px solid #ccd9e5;
    border-left: 5px solid #0f6f8d;
    border-radius: 10px;
    background: #ffffff;
    color: #415164;
    font-size: 15px;
    line-height: 1.5;
    box-shadow: 0 8px 18px rgba(15, 35, 52, 0.055);
  }

  @media (max-width: 900px) {
    .school-portal-shell {
      padding: 22px;
    }

    .school-portal-hero {
      grid-template-columns: 1fr;
      padding: 26px;
    }

    .school-portal-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .school-portal-participants {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .school-portal-shell {
      padding: 16px;
    }

    .school-portal-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const participantSample = [
  "Escola Bartolomeu Perestrelo",
  "Escola Francisco Franco",
  "Escola Gonçalves Zarco",
  "Escola Jaime Moniz"
].join("\n");

const portalCards = [
  {
    title: "Jornadas",
    text: "Criar jornadas da competição de forma guiada."
  },
  {
    title: "Jogos",
    text: "Montar calendário e jogos por jornada."
  },
  {
    title: "Resultados",
    text: "Atualizar resultados em fluxo controlado."
  },
  {
    title: "Notícias e Vídeo",
    text: "Enviar conteúdos para revisão editorial."
  },
  {
    title: "Acesso futuro",
    text: "Esta área será ligada a permissões por escola, modalidade, competição e época."
  }
];

export default function PortalEscolasPage() {
  return (
    <main className="school-portal-shell">
      <style>{portalEscolasStyles}</style>
      <div className="school-portal-wrap">
        <section className="school-portal-hero" aria-labelledby="portal-escolas-title">
          <div>
            <p className="school-portal-eyebrow">Jornada.pt</p>
            <h1 id="portal-escolas-title">Portal das Escolas</h1>
            <p>
              Área futura para escolas, clubes e entidades parceiras prepararem participantes, jornadas,
              jogos e conteúdos de forma simples e controlada.
            </p>
          </div>
          <span className="school-portal-status">Em breve</span>
        </section>

        <section className="school-portal-participants" aria-labelledby="portal-participants-title">
          <div>
            <h2 id="portal-participants-title">1. Participantes</h2>
            <p className="school-portal-participants-subtitle">Adicionar participantes por lista simples.</p>
            <label className="school-portal-demo-label" htmlFor="portal-participants-demo">
              Escreva um participante por linha:
            </label>
            <textarea
              id="portal-participants-demo"
              className="school-portal-demo-list"
              readOnly
              value={participantSample}
              aria-label="Exemplo visual de lista de participantes"
            />
            <div className="school-portal-demo-actions">
              <button className="school-portal-disabled-button" type="button" disabled>
                Em breve
              </button>
              <span className="school-portal-tag">Maquete visual</span>
            </div>
            <p className="school-portal-module-note">
              Em fase futura, o sistema irá validar nomes repetidos, reutilizar equipas existentes e associar
              os participantes à competição/época permitida.
            </p>
            <p className="school-portal-module-note">
              Este módulo ainda não grava dados. A validação e associação real serão implementadas numa fase
              posterior.
            </p>
          </div>
          <aside className="school-portal-flow" aria-label="Fluxo futuro de participantes">
            <h3>Fluxo futuro</h3>
            <ol>
              <li>Colar lista de participantes</li>
              <li>Pré-visualizar</li>
              <li>Confirmar</li>
              <li>Associar à competição/época autorizada</li>
            </ol>
          </aside>
        </section>

        <section className="school-portal-grid" aria-label="Modulos previstos">
          {portalCards.map((card) => (
            <article className="school-portal-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <span className="school-portal-tag">Planeado</span>
            </article>
          ))}
        </section>

        <aside className="school-portal-note">
          Esta página é uma base visual inicial. As ações de gravação, permissões e autenticação serão
          implementadas em fases futuras.
        </aside>
      </div>
    </main>
  );
}
