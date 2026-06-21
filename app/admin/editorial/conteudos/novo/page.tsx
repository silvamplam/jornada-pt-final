import { fetchSupabaseAdminTable } from "@/lib/supabase";

import {
  EditorialContentForm,
  adminEditorialContentsStyles,
  type EditorialContentCompetition,
  type EditorialContentMatchday,
  type EditorialContentSeason
} from "../_contentForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function pageMessage(error?: string) {
  const messages: Record<string, string> = {
    "missing-title": "Indique um titulo.",
    "missing-slug": "Nao foi possivel gerar um slug.",
    "invalid-status": "Estado invalido.",
    "invalid-scope": "Ambito invalido.",
    "invalid-content-type": "Tipo de conteudo invalido.",
    "invalid-action": "Acao invalida para este formulario.",
    "save-failed": "Nao foi possivel criar o conteudo.",
  };

  return error ? messages[error] ?? "Nao foi possivel criar o conteudo." : null;
}

async function readContentContextOptions() {
  const [competitions, seasons, matchdays] = await Promise.all([
    fetchSupabaseAdminTable<EditorialContentCompetition>(
      "competitions?select=id,country_id,country,name,slug,is_active&order=name.asc"
    ).catch(() => []),
    fetchSupabaseAdminTable<EditorialContentSeason>(
      "seasons?select=id,competition_id,label,is_current,starts_on,ends_on&order=label.desc"
    ).catch(() => []),
    fetchSupabaseAdminTable<EditorialContentMatchday>(
      "matchdays?select=id,season_id,number,label,starts_on,ends_on,status&order=number.asc"
    ).catch(() => [])
  ]);

  return { competitions, seasons, matchdays };
}

export default async function NewEditorialContentPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const contextOptions = await readContentContextOptions();

  return (
    <main className="content-admin-shell">
      <style>{adminEditorialContentsStyles}</style>

      <section className="content-admin-header">
        <div>
          <p className="content-admin-eyebrow">Editorial</p>
          <h1>Novo conteudo audiovisual</h1>
          <p>
            Criacao basica de conteudo editorial audiovisual. Nao liga a Home, Jornada, Composicao ou areas fixas de
            video nesta fase.
          </p>
        </div>
      </section>

      <EditorialContentForm
        mode="create"
        message={pageMessage(params.error)}
        competitions={contextOptions.competitions}
        seasons={contextOptions.seasons}
        matchdays={contextOptions.matchdays}
      />
    </main>
  );
}
