const editorialHomeStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .editorial-entry-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .editorial-entry-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.16);
  }

  .editorial-entry-hero p,
  .editorial-entry-hero h1,
  .editorial-entry-note p {
    margin: 0;
  }

  .editorial-entry-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editorial-entry-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .editorial-entry-hero span {
    display: block;
    margin-top: 10px;
    max-width: 680px;
    color: #cdd5df;
    font-size: 16px;
  }

  .editorial-entry-actions {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
  }

  .editorial-entry-actions a {
    display: inline-block;
    flex: 0 0 auto;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    background: transparent;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    text-decoration: none;
    text-transform: uppercase;
  }

  .editorial-entry-note {
    margin-top: 18px;
    padding: 22px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .editorial-entry-note p {
    color: #5b6571;
    font-size: 16px;
    line-height: 1.45;
  }

  @media (max-width: 920px) {
    .editorial-entry-shell {
      padding: 16px;
    }

    .editorial-entry-hero {
      display: grid;
      grid-template-columns: 1fr;
    }

    .editorial-entry-actions {
      justify-content: flex-start;
    }
  }
`;

export default function AdminEditorialHomePage() {
  return (
    <main className="editorial-entry-shell">
      <style>{editorialHomeStyles}</style>
      <section className="editorial-entry-hero">
        <div>
          <p>Jornada.pt</p>
          <h1>Home Editorial</h1>
          <span>Área de entrada para gestão editorial do Jornada.pt.</span>
        </div>
        <nav className="editorial-entry-actions" aria-label="Navegação editorial">
          <a href="/admin">Backoffice</a>
          <a href="/admin/gestor">Centro de Gestão</a>
          <a href="/admin/editorial/artigos">Artigos / Notícias</a>
        </nav>
      </section>

      <section className="editorial-entry-note">
        <p>Escolha uma jornada no Centro de Gestão para aceder ao Editorial da Jornada ou à Composição Editorial.</p>
      </section>
    </main>
  );
}
