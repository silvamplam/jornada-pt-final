import Link from "next/link";

const competitions = [
  {
    name: "Liga Portugal",
    href: "/competicoes/liga-portugal/2026-27/jornadas/1",
    summary: "Calendario, jogos e leitura editorial da Liga Portugal."
  },
  {
    name: "La Liga",
    href: "/competicoes/la-liga/2026-27/jornadas/1",
    summary: "Acompanhe jornadas, resultados e contexto da liga espanhola."
  },
  {
    name: "Premier League",
    href: "/competicoes/premier-league/2026-27/jornadas/1",
    summary: "Jogos, videos, classificacao e historias da liga inglesa."
  }
];

const phases = ["Antes da jornada", "Durante a jornada", "Depois da jornada"];

export default function HomePage() {
  return (
    <main className="central-home">
      <header className="central-header">
        <Link className="central-brand" href="/" aria-label="Jornada.pt">
          Jornada<span>.pt</span>
        </Link>

        <nav className="central-nav" aria-label="Menu principal">
          <Link href="/competicoes/liga-portugal/2026-27/jornadas/1">Liga Portugal</Link>
          <Link href="/competicoes/la-liga/2026-27/jornadas/1">La Liga</Link>
          <Link href="/competicoes/premier-league/2026-27/jornadas/1">Premier League</Link>
          <Link href="/competicoes/liga-portugal/2026-27/jornadas/1#jogos">Jogos</Link>
          <Link href="/competicoes/liga-portugal/2026-27/jornadas/1#classificacao">Classificacao</Link>
        </nav>

        <div className="central-actions" aria-label="Acoes">
          <button type="button" aria-label="Pesquisar">⌕</button>
          <Link href="/admin/login">Entrar</Link>
        </div>
      </header>

      <section className="central-hero">
        <div className="central-hero-copy">
          <p className="central-kicker">Futebol em contexto</p>
          <h1>Jornada.pt</h1>
          <p className="central-subtitle">A maquina do tempo do futebol.</p>
          <p className="central-intro">
            Escolha uma competicao para acompanhar jornadas, jogos, resultados, videos,
            classificacao e leitura editorial.
          </p>
        </div>
      </section>

      <section className="central-section" aria-labelledby="competitions-title">
        <div className="central-section-heading">
          <p>Competicoes</p>
          <h2 id="competitions-title">Escolha por onde entrar</h2>
        </div>

        <div className="competition-grid">
          {competitions.map((competition) => (
            <Link className="competition-card" href={competition.href} key={competition.name}>
              <span>{competition.name}</span>
              <strong>2026-27 · Jornada 1</strong>
              <small>{competition.summary}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="phase-strip" aria-label="Momentos da jornada">
        {phases.map((phase) => (
          <span key={phase}>{phase}</span>
        ))}
      </section>

      <style>{`
        .central-home {
          min-height: 100vh;
          background: #f5f6f3;
          color: #151719;
          font-family: Arial, Helvetica, sans-serif;
        }

        .central-header {
          display: flex;
          align-items: center;
          gap: 28px;
          min-height: 76px;
          padding: 0 36px;
          border-bottom: 1px solid rgba(21, 23, 25, 0.1);
          background: rgba(245, 246, 243, 0.94);
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(14px);
        }

        .central-brand {
          color: #151719;
          font-size: 25px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }

        .central-brand span {
          color: #b5252a;
        }

        .central-nav {
          display: flex;
          align-items: center;
          gap: 18px;
          flex: 1;
          font-size: 13px;
          font-weight: 800;
        }

        .central-nav a,
        .central-actions a {
          color: #2f3439;
          text-decoration: none;
        }

        .central-nav a:hover,
        .central-actions a:hover {
          color: #b5252a;
        }

        .central-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          font-weight: 900;
        }

        .central-actions button {
          width: 34px;
          height: 34px;
          border: 1px solid rgba(21, 23, 25, 0.2);
          border-radius: 50%;
          background: #ffffff;
          color: #151719;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .central-hero {
          min-height: 430px;
          display: flex;
          align-items: flex-end;
          padding: 86px 36px 54px;
          background:
            linear-gradient(90deg, rgba(13, 16, 20, 0.86), rgba(13, 16, 20, 0.52), rgba(13, 16, 20, 0.16)),
            url("https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1800&q=80") center / cover;
          color: #ffffff;
        }

        .central-hero-copy {
          max-width: 760px;
        }

        .central-kicker,
        .central-section-heading p {
          margin: 0 0 14px;
          color: #b5252a;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .central-hero h1 {
          margin: 0;
          font-size: 88px;
          line-height: 0.95;
          letter-spacing: 0;
        }

        .central-subtitle {
          margin: 20px 0 0;
          font-size: 25px;
          font-weight: 900;
        }

        .central-intro {
          max-width: 640px;
          margin: 16px 0 0;
          color: rgba(255, 255, 255, 0.88);
          font-size: 18px;
          line-height: 1.55;
        }

        .central-section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 54px 36px 34px;
        }

        .central-section-heading h2 {
          margin: 0;
          font-size: 34px;
          letter-spacing: 0;
        }

        .competition-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 26px;
        }

        .competition-card {
          min-height: 170px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 22px;
          border: 1px solid rgba(21, 23, 25, 0.12);
          border-radius: 8px;
          background: #ffffff;
          color: #151719;
          text-decoration: none;
          box-shadow: 0 14px 34px rgba(21, 23, 25, 0.08);
        }

        .competition-card:hover {
          border-color: rgba(181, 37, 42, 0.48);
          transform: translateY(-2px);
        }

        .competition-card span {
          font-size: 24px;
          font-weight: 900;
        }

        .competition-card strong {
          color: #b5252a;
          font-size: 13px;
          text-transform: uppercase;
        }

        .competition-card small {
          color: #59626b;
          font-size: 14px;
          line-height: 1.45;
        }

        .phase-strip {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 36px 60px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .phase-strip span {
          padding: 16px 18px;
          border-top: 3px solid #b5252a;
          background: rgba(255, 255, 255, 0.68);
          color: #2f3439;
          font-size: 14px;
          font-weight: 900;
        }

        @media (max-width: 900px) {
          .central-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
            padding: 18px 22px;
          }

          .central-nav {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .central-actions {
            position: absolute;
            top: 18px;
            right: 22px;
          }

          .central-hero {
            min-height: 440px;
            padding: 72px 22px 42px;
          }

          .central-hero h1 {
            font-size: 58px;
          }

          .competition-grid,
          .phase-strip {
            grid-template-columns: 1fr;
          }

          .central-section,
          .phase-strip {
            padding-left: 22px;
            padding-right: 22px;
          }
        }
      `}</style>
    </main>
  );
}
