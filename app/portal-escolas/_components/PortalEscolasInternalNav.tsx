type PortalEscolasNavKey =
  | "painel"
  | "funcionamento"
  | "perfil"
  | "contextos"
  | "modalidades"
  | "competicoes"
  | "multidesporto"
  | "participantes"
  | "jornadas"
  | "jogos"
  | "resultados"
  | "conteudos";

const portalEscolasInternalNavStyles = `
  .portal-escolas-internal-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .portal-escolas-internal-nav a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 8px 10px;
    border: 1px solid #cbdce7;
    border-radius: 8px;
    background: #ffffff;
    color: #0f6f8d;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.2;
    text-decoration: none;
    text-transform: uppercase;
  }

  .portal-escolas-internal-nav a[aria-current="page"] {
    border-color: #0f6f8d;
    background: #0f6f8d;
    color: #ffffff;
  }

  @media (max-width: 760px) {
    .portal-escolas-internal-nav a {
      flex: 1 1 140px;
    }
  }
`;

const portalEscolasNavItems: Array<{ key: PortalEscolasNavKey; label: string; href: string }> = [
  { key: "painel", label: "Painel", href: "/portal-escolas/painel" },
  { key: "funcionamento", label: "Funcionamento", href: "/portal-escolas/funcionamento" },
  { key: "perfil", label: "Perfil", href: "/portal-escolas/perfil" },
  { key: "contextos", label: "Contextos", href: "/portal-escolas/contextos" },
  { key: "modalidades", label: "Modalidades", href: "/portal-escolas/modalidades" },
  { key: "competicoes", label: "Competições", href: "/portal-escolas/competicoes" },
  { key: "participantes", label: "Participantes", href: "/portal-escolas/participantes" },
  { key: "jornadas", label: "Estrutura", href: "/portal-escolas/jornadas" },
  { key: "jogos", label: "Eventos", href: "/portal-escolas/jogos" },
  { key: "resultados", label: "Resultados", href: "/portal-escolas/resultados" },
  { key: "conteudos", label: "Conteúdos", href: "/portal-escolas/conteudos" }
];

export function PortalEscolasInternalNav({ current }: { current: PortalEscolasNavKey }) {
  return (
    <>
      <style>{portalEscolasInternalNavStyles}</style>
      <nav className="portal-escolas-internal-nav" aria-label="Navegação interna do Portal das Escolas">
        {portalEscolasNavItems.map((item) => (
          <a key={item.key} href={item.href} aria-current={item.key === current ? "page" : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
    </>
  );
}
