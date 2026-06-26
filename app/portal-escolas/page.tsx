export const metadata = {
  title: "Portal das Escolas | Jornada.pt",
  description:
    "Área futura para escolas, clubes, associações, núcleos e entidades parceiras prepararem competições."
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

  .school-portal-context {
    margin-top: 22px;
    padding: 20px;
    border: 1px solid #cbdce7;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 12px 28px rgba(15, 35, 52, 0.08);
  }

  .school-portal-context-header {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .school-portal-context-header h2 {
    margin: 0;
    color: #102033;
    font-size: 22px;
  }

  .school-portal-context-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .school-portal-context-item {
    min-width: 0;
    padding: 12px;
    border: 1px solid #d7e4ed;
    border-radius: 10px;
    background: #f8fbfd;
  }

  .school-portal-context-item span {
    display: block;
    color: #667789;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .school-portal-context-item strong {
    display: block;
    margin-top: 6px;
    color: #102033;
    font-size: 14px;
    line-height: 1.25;
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

  .school-portal-rounds {
    display: grid;
    gap: 12px;
    margin-top: 4px;
  }

  .school-portal-round-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid #d7e4ed;
    border-radius: 10px;
    background: #f8fbfd;
  }

  .school-portal-round-card strong {
    display: block;
    color: #102033;
    font-size: 15px;
  }

  .school-portal-round-card span {
    color: #667789;
    font-size: 13px;
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

    .school-portal-context-grid {
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

    .school-portal-context-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const participantSample = [
  "Escola Bartolomeu Perestrelo",
  "Turma 7.º A",
  "Equipa Azul",
  "Núcleo Desportivo Norte",
  "Associação Convidada"
].join("\n");

const contextSamples = [
  {
    label: "Entidade organizadora",
    value: "Agrupamento / Associação / Clube / Núcleo autorizado"
  },
  {
    label: "Ano letivo ou contexto",
    value: "2026/27"
  },
  {
    label: "Competição",
    value: "Torneio Escolar / Liga Interna / Encontro Local"
  },
  {
    label: "Modalidade / âmbito",
    value: "Futebol / Multimodalidade / Atividade local"
  },
  {
    label: "Estado",
    value: "Maquete visual / Em breve"
  }
];

const roundSamples = [
  {
    title: "Jornada 01",
    meta: "12 outubro · por preparar"
  },
  {
    title: "Jornada 02",
    meta: "19 outubro · por preparar"
  },
  {
    title: "Jornada 03",
    meta: "26 outubro · por preparar"
  }
];

const matchSamples = [
  {
    title: "Turma 7.º A vs Turma 7.º B",
    meta: "Jornada 01 · por preparar"
  },
  {
    title: "Equipa Azul vs Equipa Branca",
    meta: "Fase de grupos · por preparar"
  },
  {
    title: "Escola Bartolomeu Perestrelo vs Escola Francisco Franco",
    meta: "Jornada 02 · por preparar"
  },
  {
    title: "Núcleo Desportivo Norte vs Associação Convidada",
    meta: "Jornada 03 · por preparar"
  },
  {
    title: "Grupo A vs Grupo B",
    meta: "Fase final · por preparar"
  },
];

const resultSamples = [
  {
    title: "Turma 7.º A 2 - 1 Turma 7.º B",
    meta: "Resultado por confirmar"
  },
  {
    title: "Equipa Azul 0 - 0 Equipa Branca",
    meta: "Por validar"
  },
  {
    title: "Núcleo Desportivo Norte 3 - 2 Associação Convidada",
    meta: "Validado"
  },
];

const contentSamples = [
  {
    title: "Crónica da Jornada 01",
    meta: "Tipo: notícia / texto · Contexto: jornada",
    status: "Por rever"
  },
  {
    title: "Vídeo-resumo da competição",
    meta: "Tipo: vídeo · Contexto: competição",
    status: "Em breve"
  },
  {
    title: "Galeria de fotografias",
    meta: "Tipo: imagens · Contexto: jogo ou participante",
    status: "Por organizar"
  },
  {
    title: "Destaque de participante",
    meta: "Tipo: sugestão editorial · Contexto: participante",
    status: "Por validar"
  },
];

const accessSamples = [
  {
    title: "Entidade organizadora",
    meta: "Pode preparar participantes, jornadas e jogos da sua competição.",
    status: "Em breve"
  },
  {
    title: "Responsável de competição",
    meta: "Pode inserir jogos, resultados e conteúdos para revisão.",
    status: "Maquete visual"
  },
  {
    title: "Colaborador editorial",
    meta: "Pode preparar notícias, vídeos ou fotografias para validação.",
    status: "Por configurar"
  },
  {
    title: "Consulta limitada",
    meta: "Pode acompanhar calendário, jogos e resultados autorizados.",
    status: "Planeado"
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
              Área futura para escolas, clubes, associações, núcleos e entidades parceiras prepararem
              participantes, jornadas, jogos e conteúdos de forma simples e controlada.
            </p>
          </div>
          <span className="school-portal-status">Em breve</span>
        </section>

        <section className="school-portal-context" aria-labelledby="portal-context-title">
          <div className="school-portal-context-header">
            <div>
              <p className="school-portal-eyebrow">Contexto futuro</p>
              <h2 id="portal-context-title">Contexto autorizado</h2>
            </div>
            <span className="school-portal-tag">Maquete visual</span>
          </div>
          <div className="school-portal-context-grid" aria-label="Exemplo visual de contexto autorizado">
            {contextSamples.map((item) => (
              <div className="school-portal-context-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <p className="school-portal-module-note">
            Todos os módulos abaixo funcionarão, numa fase futura, dentro do contexto autorizado da entidade:
            competição, época/contexto, jornadas, jogos, resultados, conteúdos e acessos.
          </p>
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
              os participantes à competição, época ou contexto autorizado.
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
              <li>Associar à competição, época ou contexto autorizado</li>
            </ol>
          </aside>
        </section>

        <section className="school-portal-participants" aria-labelledby="portal-rounds-title">
          <div>
            <h2 id="portal-rounds-title">2. Jornadas</h2>
            <p className="school-portal-participants-subtitle">
              Preparar jornadas da competição, organizando datas, rondas e fases de forma simples antes da
              criação definitiva dos jogos.
            </p>
            <div className="school-portal-rounds" aria-label="Exemplo visual de jornadas">
              {roundSamples.map((round) => (
                <article className="school-portal-round-card" key={round.title}>
                  <div>
                    <strong>{round.title}</strong>
                    <span>{round.meta}</span>
                  </div>
                  <span className="school-portal-tag">Em breve</span>
                </article>
              ))}
            </div>
            <p className="school-portal-module-note">
              Esta área servirá para preparar as jornadas de uma competição escolar, local ou associativa,
              antes da criação dos jogos. Nesta fase é apenas uma pré-visualização visual do fluxo futuro.
            </p>
            <p className="school-portal-module-note">
              Este módulo ainda não grava dados. A criação real de jornadas será implementada numa fase posterior.
            </p>
          </div>
          <aside className="school-portal-flow" aria-label="Fluxo futuro de jornadas">
            <h3>Fluxo futuro</h3>
            <ol>
              <li>Escolher competição autorizada</li>
              <li>Criar jornadas</li>
              <li>Definir datas</li>
              <li>Confirmar calendário antes dos jogos</li>
            </ol>
          </aside>
        </section>

        <section className="school-portal-participants" aria-labelledby="portal-matches-title">
          <div>
            <h2 id="portal-matches-title">3. Jogos</h2>
            <p className="school-portal-participants-subtitle">
              Montar jogos entre participantes, equipas, grupos ou entidades autorizadas, sem limitar o modelo
              a escola contra escola.
            </p>
            <div className="school-portal-rounds" aria-label="Exemplo visual de jogos">
              {matchSamples.map((match) => (
                <article className="school-portal-round-card" key={match.title}>
                  <div>
                    <strong>{match.title}</strong>
                    <span>{match.meta}</span>
                  </div>
                  <span className="school-portal-tag">Em breve</span>
                </article>
              ))}
            </div>
            <p className="school-portal-module-note">
              Esta área servirá qualquer competição autorizada: interna de uma escola, entre escolas, entre
              clubes escolares, com associações convidadas ou com grupos mistos.
            </p>
            <p className="school-portal-module-note">
              Estrutura prevista: entidade organizadora, ano letivo ou contexto, competição, jornada/fase,
              jogos, resultados e conteúdos.
            </p>
          </div>
          <aside className="school-portal-flow" aria-label="Fluxo futuro de jogos">
            <h3>Fluxo futuro</h3>
            <ol>
              <li>Escolher jornada ou fase</li>
              <li>Selecionar participantes autorizados</li>
              <li>Definir data, hora e local</li>
              <li>Confirmar jogos antes dos resultados</li>
            </ol>
          </aside>
        </section>

        <section className="school-portal-participants" aria-labelledby="portal-results-title">
          <div>
            <h2 id="portal-results-title">4. Resultados</h2>
            <p className="school-portal-participants-subtitle">
              Inserir, validar e confirmar resultados de jogos entre participantes, equipas, grupos ou entidades
              autorizadas.
            </p>
            <div className="school-portal-rounds" aria-label="Exemplo visual de resultados">
              {resultSamples.map((result) => (
                <article className="school-portal-round-card" key={result.title}>
                  <div>
                    <strong>{result.title}</strong>
                    <span>{result.meta}</span>
                  </div>
                  <span className="school-portal-tag">Em breve</span>
                </article>
              ))}
            </div>
            <p className="school-portal-module-note">
              Esta área servirá para rever resultados antes de ficarem definitivos, mantendo um fluxo controlado
              para qualquer competição autorizada.
            </p>
            <p className="school-portal-module-note">
              Este módulo ainda não grava dados. A validação real de resultados será implementada numa fase
              posterior.
            </p>
          </div>
          <aside className="school-portal-flow" aria-label="Fluxo futuro de resultados">
            <h3>Fluxo futuro</h3>
            <ol>
              <li>Escolher competição</li>
              <li>Escolher jornada/fase</li>
              <li>Selecionar jogo</li>
              <li>Inserir resultado</li>
              <li>Confirmar/validar resultado</li>
              <li>Atualizar classificação ou histórico</li>
            </ol>
          </aside>
        </section>

        <section className="school-portal-participants" aria-labelledby="portal-content-title">
          <div>
            <h2 id="portal-content-title">5. Conteúdos</h2>
            <p className="school-portal-participants-subtitle">
              Preparar notícias, vídeos, fotografias, crónicas, destaques ou resumos ligados ao contexto
              autorizado da competição.
            </p>
            <div className="school-portal-rounds" aria-label="Exemplo visual de conteúdos">
              {contentSamples.map((content) => (
                <article className="school-portal-round-card" key={content.title}>
                  <div>
                    <strong>{content.title}</strong>
                    <span>{content.meta}</span>
                  </div>
                  <span className="school-portal-tag">{content.status}</span>
                </article>
              ))}
            </div>
            <p className="school-portal-module-note">
              Os conteúdos poderão ficar associados à entidade organizadora, competição, jornada/fase, jogo,
              participante ou contexto geral da competição.
            </p>
            <p className="school-portal-module-note">
              Este módulo ainda não grava dados, não envia ficheiros e não publica conteúdos. A submissão,
              revisão e validação real serão implementadas numa fase posterior.
            </p>
          </div>
          <aside className="school-portal-flow" aria-label="Fluxo futuro de conteúdos">
            <h3>Fluxo futuro</h3>
            <ol>
              <li>Escolher entidade/contexto</li>
              <li>Escolher competição</li>
              <li>Associar a jornada, jogo ou participante</li>
              <li>Escolher tipo de conteúdo</li>
              <li>Preparar texto, imagem ou vídeo</li>
              <li>Submeter para revisão</li>
              <li>Validar/publicar no local adequado</li>
            </ol>
          </aside>
        </section>

        <section className="school-portal-participants" aria-labelledby="portal-access-title">
          <div>
            <h2 id="portal-access-title">6. Acessos</h2>
            <p className="school-portal-participants-subtitle">
              Preparar, no futuro, acessos próprios para cada entidade organizadora, escola, associação,
              clube ou núcleo poder gerir apenas o seu contexto autorizado.
            </p>
            <div className="school-portal-rounds" aria-label="Exemplo visual de acessos">
              {accessSamples.map((access) => (
                <article className="school-portal-round-card" key={access.title}>
                  <div>
                    <strong>{access.title}</strong>
                    <span>{access.meta}</span>
                  </div>
                  <span className="school-portal-tag">{access.status}</span>
                </article>
              ))}
            </div>
            <p className="school-portal-module-note">
              Os acessos futuros deverão ser limitados por entidade, competição, modalidade, época/ano letivo,
              jornada ou outro contexto autorizado.
            </p>
            <p className="school-portal-module-note">
              Este módulo ainda não cria utilizadores, não autentica ninguém, não grava permissões e não liga
              ao Backoffice atual da Jornada.pt.
            </p>
          </div>
          <aside className="school-portal-flow" aria-label="Fluxo futuro de acessos">
            <h3>Fluxo futuro</h3>
            <ol>
              <li>Identificar entidade autorizada</li>
              <li>Definir competição/contexto</li>
              <li>Atribuir perfis de acesso</li>
              <li>Limitar permissões por competição, modalidade, época ou jornada</li>
              <li>Submeter conteúdos para revisão</li>
              <li>Validar acessos antes da ativação</li>
            </ol>
          </aside>
        </section>

        <aside className="school-portal-note">
          Esta página é uma base visual inicial. As ações de gravação, permissões e autenticação serão
          implementadas em fases futuras.
        </aside>
      </div>
    </main>
  );
}
