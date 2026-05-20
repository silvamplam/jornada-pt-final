import Link from "next/link";
import type { Competition } from "@/lib/jornada";

type SiteHeaderProps = {
  competitions: Competition[];
  activeSlug?: string;
};

export function SiteHeader({ competitions, activeSlug }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <img className="brand-logo" src="/assets/jornada-logo-header.png" alt="Jornada.pt - a máquina do tempo do futebol" />
      </Link>

      <nav className="main-nav" aria-label="Competições">
        {competitions.map((competition) => (
          <Link
            className={competition.slug === activeSlug ? "active" : undefined}
            href={`/competicao/${competition.slug}`}
            key={competition.id}
          >
            {competition.name}
          </Link>
        ))}
        <a href="#" aria-disabled="true">
          Champions
        </a>
        <a href="#" aria-disabled="true">
          Liga Europa
        </a>
      </nav>

      <div className="header-actions" aria-label="Ações">
        <button className="header-icon" type="button" aria-label="Pesquisar">
          ⌕
        </button>
        <button className="header-icon" type="button" aria-label="Entrar">
          ♙
        </button>
        <button className="header-icon" type="button" aria-label="Definições">
          ⚙
        </button>
      </div>
    </header>
  );
}
