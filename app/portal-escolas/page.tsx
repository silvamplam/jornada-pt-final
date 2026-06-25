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

const portalCards = [
  {
    title: "Participantes",
    text: "Adicionar equipas ou participantes por lista simples."
  },
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
