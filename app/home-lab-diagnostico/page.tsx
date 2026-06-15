import { fetchSupabaseAdminTable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SiteEditorial = {
  id: string;
  slug: string | null;
  status: string | null;
  headline_title: string | null;
  headline_subtitle: string | null;
  headline_image_url: string | null;
  headline_link_url: string | null;
  side_block_type: string | null;
  side_block_label: string | null;
  side_block_title: string | null;
  side_block_text: string | null;
  side_block_author: string | null;
  side_block_image_url: string | null;
  side_block_link_url: string | null;
  side_block_status: string | null;
  complementary_mode: string | null;
  complementary_label: string | null;
  complementary_title: string | null;
  complementary_text: string | null;
  complementary_image_url: string | null;
  complementary_link_url: string | null;
  complementary_status: string | null;
  complementary_roundup_item_id: string | null;
  below_headline_mode: string | null;
  below_headline_heading: string | null;
  roundup_video_heading: string | null;
  final_zone_title: string | null;
  final_zone_mode: string | null;
};

type SiteEditorialItem = {
  id: string;
  site_editorial_id: string | null;
  sort_order: number | null;
  status: string | null;
  title: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  time_label?: string | null;
  label?: string | null;
  type?: string | null;
};

type SiteFeaturedMatch = {
  id: string;
  match_id: string | null;
  sort_order: number | null;
};

type HomeLabData = {
  editorial: SiteEditorial | null;
  highlights: SiteEditorialItem[];
  latestNews: SiteEditorialItem[];
  roundupItems: SiteEditorialItem[];
  featuredMatches: SiteFeaturedMatch[];
  error: string | null;
};

function cleanText(value: string | null | undefined) {
  const cleanValue = value?.trim();
  return cleanValue ? cleanValue : null;
}

function isPublished(item: { status: string | null }) {
  return item.status === "published";
}

function hasAnyText(values: Array<string | null | undefined>) {
  return values.some((value) => Boolean(cleanText(value)));
}

function fieldState(value: string | null | undefined) {
  return cleanText(value) ? "preenchido" : "vazio";
}

function shortValue(value: string | null | undefined) {
  const cleanValue = cleanText(value);
  if (!cleanValue) return "vazio";
  return cleanValue.length > 72 ? `${cleanValue.slice(0, 69)}...` : cleanValue;
}

function complementStatus(editorial: SiteEditorial | null, hasComplement: boolean) {
  if (!editorial || !hasComplement) return "vazio";
  return cleanText(editorial.complementary_status) ?? "sem estado";
}

function complementMissingFields(editorial: SiteEditorial | null) {
  if (!editorial) return ["label", "titulo", "texto", "imagem", "link"];

  const fields: Array<[string, string | null | undefined]> = [
    ["label", editorial.complementary_label],
    ["titulo", editorial.complementary_title],
    ["texto", editorial.complementary_text],
    ["imagem", editorial.complementary_image_url],
    ["link", editorial.complementary_link_url]
  ];

  return fields.filter(([, value]) => !cleanText(value)).map(([label]) => label);
}

async function readHomeLabData(): Promise<HomeLabData> {
  try {
    const editorials = await fetchSupabaseAdminTable<SiteEditorial>("site_editorials?select=*&slug=eq.home&limit=1");
    const editorial = editorials[0] ?? null;

    if (!editorial?.id) {
      return {
        editorial: null,
        highlights: [],
        latestNews: [],
        roundupItems: [],
        featuredMatches: [],
        error: null
      };
    }

    const encodedId = encodeURIComponent(editorial.id);
    const [highlights, latestNews, roundupItems, featuredMatches] = await Promise.all([
      fetchSupabaseAdminTable<SiteEditorialItem>(
        `site_editorial_highlights?select=*&site_editorial_id=eq.${encodedId}&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteEditorialItem>(
        `site_editorial_latest_news?select=*&site_editorial_id=eq.${encodedId}&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteEditorialItem>(
        `site_editorial_roundup_items?select=*&site_editorial_id=eq.${encodedId}&order=sort_order.asc`
      ),
      fetchSupabaseAdminTable<SiteFeaturedMatch>("site_featured_matches?select=id,match_id,sort_order&order=sort_order.asc")
    ]);

    return {
      editorial,
      highlights,
      latestNews,
      roundupItems,
      featuredMatches,
      error: null
    };
  } catch (error) {
    return {
      editorial: null,
      highlights: [],
      latestNews: [],
      roundupItems: [],
      featuredMatches: [],
      error: error instanceof Error ? error.message : "Nao foi possivel ler as tabelas site_*."
    };
  }
}

function MetricCard({ label, value, help }: { label: string; value: string | number; help?: string }) {
  return (
    <article style={{ border: "1px solid #dfe3ea", borderRadius: 10, padding: 16, background: "#fff" }}>
      <span style={{ display: "block", color: "#667085", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ display: "block", color: "#111827", fontSize: 28, lineHeight: 1.1, marginTop: 8 }}>{value}</strong>
      {help ? <small style={{ display: "block", color: "#667085", marginTop: 8 }}>{help}</small> : null}
    </article>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <li style={{ display: "grid", gap: 4, padding: "10px 0", borderBottom: "1px solid #edf0f5" }}>
      <span style={{ color: "#667085", fontSize: 12, fontWeight: 700 }}>{label}</span>
      <strong style={{ color: "#111827", fontSize: 14 }}>{fieldState(value)}</strong>
      <code style={{ color: "#475467", fontSize: 12, overflowWrap: "anywhere" }}>{shortValue(value)}</code>
    </li>
  );
}

function ItemList({ items }: { items: SiteEditorialItem[] }) {
  if (items.length === 0) {
    return <p style={{ color: "#667085", margin: 0 }}>Sem itens encontrados.</p>;
  }

  return (
    <ol style={{ display: "grid", gap: 10, margin: 0, padding: 0, listStyle: "none" }}>
      {items.slice(0, 8).map((item) => (
        <li key={item.id} style={{ border: "1px solid #edf0f5", borderRadius: 10, padding: 12 }}>
          <strong style={{ display: "block", color: "#111827" }}>{shortValue(item.title)}</strong>
          <span style={{ color: "#667085", fontSize: 12 }}>
            estado: {item.status ?? "sem estado"} | ordem: {item.sort_order ?? "sem ordem"}
          </span>
          {item.link_url ? (
            <code style={{ display: "block", color: "#475467", fontSize: 12, marginTop: 6, overflowWrap: "anywhere" }}>
              {item.link_url}
            </code>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function ComplementPreview({ editorial, hasComplement }: { editorial: SiteEditorial | null; hasComplement: boolean }) {
  if (!editorial || !hasComplement) {
    return (
      <section style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
        <p style={{ margin: "0 0 8px", color: "#667085", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
          Pr&eacute;-visualiza&ccedil;&atilde;o &mdash; Complemento da Manchete
        </p>
        <h2 style={{ margin: 0, fontSize: 22 }}>Complemento da Manchete nao configurado.</h2>
      </section>
    );
  }

  const imageUrl = cleanText(editorial.complementary_image_url);
  const linkUrl = cleanText(editorial.complementary_link_url);
  const missingFields = complementMissingFields(editorial);
  const incomplete = missingFields.length > 0;

  return (
    <section style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <p style={{ margin: "0 0 8px", color: "#667085", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
            Pr&eacute;-visualiza&ccedil;&atilde;o &mdash; Complemento da Manchete
          </p>
          <h2 style={{ margin: 0, fontSize: 22 }}>Vista isolada do complemento</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span
            style={{
              border: "1px solid #dfe3ea",
              borderRadius: 999,
              color: "#344054",
              fontSize: 12,
              fontWeight: 800,
              padding: "6px 10px"
            }}
          >
            estado: {complementStatus(editorial, hasComplement)}
          </span>
          <span
            style={{
              border: "1px solid #dfe3ea",
              borderRadius: 999,
              color: "#344054",
              fontSize: 12,
              fontWeight: 800,
              padding: "6px 10px"
            }}
          >
            modo: {cleanText(editorial.complementary_mode) ?? "sem modo"}
          </span>
        </div>
      </div>

      <article
        style={{
          display: "grid",
          gridTemplateColumns: imageUrl ? "minmax(0, 1fr) minmax(220px, 340px)" : "1fr",
          gap: 16,
          marginTop: 16,
          alignItems: "start"
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {cleanText(editorial.complementary_label) ? (
            <span style={{ color: "#b42318", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
              {cleanText(editorial.complementary_label)}
            </span>
          ) : null}
          <h3 style={{ color: "#111827", fontSize: 26, lineHeight: 1.12, margin: 0 }}>
            {cleanText(editorial.complementary_title) ?? "Sem titulo preenchido"}
          </h3>
          {cleanText(editorial.complementary_text) ? (
            <p style={{ color: "#475467", fontSize: 15, lineHeight: 1.5, margin: 0 }}>{cleanText(editorial.complementary_text)}</p>
          ) : null}
          {linkUrl ? (
            <code style={{ color: "#475467", fontSize: 12, overflowWrap: "anywhere" }}>link: {linkUrl}</code>
          ) : null}
          {cleanText(editorial.complementary_roundup_item_id) ? (
            <code style={{ color: "#475467", fontSize: 12, overflowWrap: "anywhere" }}>
              roundup_item_id: {editorial.complementary_roundup_item_id}
            </code>
          ) : null}
          {incomplete ? (
            <p style={{ color: "#92400e", fontSize: 13, margin: "4px 0 0" }}>
              Complemento incompleto: faltam {missingFields.join(", ")}.
            </p>
          ) : (
            <p style={{ color: "#047857", fontSize: 13, margin: "4px 0 0" }}>Complemento com campos principais preenchidos.</p>
          )}
        </div>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={cleanText(editorial.complementary_title) ?? "Complemento da Manchete"}
            style={{
              width: "100%",
              maxHeight: 220,
              objectFit: "cover",
              borderRadius: 10,
              border: "1px solid #edf0f5",
              background: "#f2f4f7"
            }}
          />
        ) : null}
      </article>
    </section>
  );
}

function ComplementVisualPreview({ editorial, hasComplement }: { editorial: SiteEditorial | null; hasComplement: boolean }) {
  const status = complementStatus(editorial, hasComplement);
  const imageUrl = cleanText(editorial?.complementary_image_url);
  const label = cleanText(editorial?.complementary_label);
  const title = cleanText(editorial?.complementary_title);
  const text = cleanText(editorial?.complementary_text);
  const linkUrl = cleanText(editorial?.complementary_link_url);
  const mode = cleanText(editorial?.complementary_mode);
  const roundupItemId = cleanText(editorial?.complementary_roundup_item_id);
  const missingFields = complementMissingFields(editorial);
  const incomplete = hasComplement && missingFields.length > 0;

  if (!editorial || !hasComplement) {
    return (
      <section style={{ border: "1px solid #dfe3ea", borderRadius: 16, background: "#fff", padding: 22 }}>
        <p style={{ margin: "0 0 8px", color: "#667085", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
          Preview visual &mdash; Complemento da Manchete
        </p>
        <h2 style={{ margin: 0, color: "#111827", fontSize: 24, lineHeight: 1.15 }}>Complemento da Manchete nao configurado.</h2>
      </section>
    );
  }

  return (
    <section style={{ border: "1px solid #dfe3ea", borderRadius: 16, background: "#fff", padding: 22 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <p style={{ margin: "0 0 8px", color: "#667085", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            Preview visual &mdash; Complemento da Manchete
          </p>
          <h2 style={{ margin: 0, color: "#111827", fontSize: 24, lineHeight: 1.15 }}>Bloco editorial isolado</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
          <span
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 999,
              color: status === "published" ? "#027a48" : "#667085",
              background: status === "published" ? "#ecfdf3" : "#f9fafb",
              fontSize: 12,
              fontWeight: 800,
              padding: "6px 10px"
            }}
          >
            {status}
          </span>
          {mode ? (
            <span
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 999,
                color: "#475467",
                background: "#f9fafb",
                fontSize: 12,
                fontWeight: 800,
                padding: "6px 10px"
              }}
            >
              {mode}
            </span>
          ) : null}
        </div>
      </div>

      <article
        style={{
          display: "grid",
          gridTemplateColumns: imageUrl ? "minmax(0, 1.05fr) minmax(260px, 0.95fr)" : "1fr",
          gap: 22,
          alignItems: "stretch",
          border: "1px solid #edf0f5",
          borderRadius: 14,
          overflow: "hidden",
          background: "#fcfcfd"
        }}
      >
        <div style={{ display: "grid", alignContent: "center", gap: 12, padding: imageUrl ? 22 : 24 }}>
          {label ? (
            <span style={{ color: "#b42318", fontSize: 12, fontWeight: 900, letterSpacing: 0, textTransform: "uppercase" }}>{label}</span>
          ) : null}
          <h3 style={{ color: "#101828", fontSize: 30, lineHeight: 1.08, margin: 0 }}>
            {title ?? "Sem titulo preenchido"}
          </h3>
          {text ? <p style={{ color: "#475467", fontSize: 16, lineHeight: 1.5, margin: 0 }}>{text}</p> : null}
          {linkUrl ? (
            <a
              href={linkUrl}
              style={{
                color: "#175cd3",
                display: "inline-block",
                fontSize: 13,
                fontWeight: 800,
                marginTop: 4,
                maxWidth: "100%",
                overflowWrap: "anywhere",
                textDecoration: "none"
              }}
            >
              {linkUrl}
            </a>
          ) : null}
          {roundupItemId ? (
            <code style={{ color: "#667085", fontSize: 12, overflowWrap: "anywhere" }}>roundup_item_id: {roundupItemId}</code>
          ) : null}
        </div>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title ?? "Complemento da Manchete"}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 260,
              maxHeight: 360,
              objectFit: "cover",
              background: "#f2f4f7"
            }}
          />
        ) : null}
      </article>

      {incomplete ? (
        <p style={{ color: "#92400e", fontSize: 13, margin: "12px 0 0" }}>
          Aviso: complemento incompleto. Campos em falta: {missingFields.join(", ")}.
        </p>
      ) : null}
    </section>
  );
}

export default async function HomeLabDiagnosticoPage() {
  const data = await readHomeLabData();
  const { editorial, highlights, latestNews, roundupItems, featuredMatches, error } = data;
  const publishedHighlights = highlights.filter(isPublished);
  const publishedLatestNews = latestNews.filter(isPublished);
  const publishedRoundupItems = roundupItems.filter(isPublished);
  const hasComplement = Boolean(
    editorial &&
      (hasAnyText([
        editorial.complementary_label,
        editorial.complementary_title,
        editorial.complementary_text,
        editorial.complementary_image_url,
        editorial.complementary_link_url
      ]) ||
        cleanText(editorial.complementary_roundup_item_id))
  );
  const rawLinks: Array<[string, string | null | undefined]> = [
    ["Manchete", editorial?.headline_link_url],
    ["Bloco lateral", editorial?.side_block_link_url],
    ["Complemento", editorial?.complementary_link_url],
    ...highlights.map((item, index): [string, string | null | undefined] => [`Destaque ${index + 1}`, item.link_url]),
    ...latestNews.map((item, index): [string, string | null | undefined] => [`Zona final ${index + 1}`, item.link_url])
  ];
  const links: Array<[string, string]> = [];

  for (const [label, link] of rawLinks) {
    const cleanLink = cleanText(link);
    if (cleanLink) {
      links.push([label, cleanLink]);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#111827", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 20 }}>
        <header style={{ border: "1px solid #dfe3ea", borderRadius: 14, background: "#101828", color: "#fff", padding: 24 }}>
          <p style={{ margin: "0 0 8px", color: "#cbd5e1", fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>
            Home Lab Diagnostico
          </p>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>Leitura isolada das tabelas site_*</h1>
          <p style={{ margin: "12px 0 0", color: "#e5e7eb", maxWidth: 760 }}>
            Esta rota nao importa componentes da Home publica e nao grava dados. Serve apenas para confirmar que a leitura
            da Home Editorial/admin pode ser feita sem tocar na pagina publica /.
          </p>
        </header>

        {error ? (
          <section style={{ border: "1px solid #fecaca", borderRadius: 12, background: "#fff1f2", padding: 16 }}>
            <strong>Erro de leitura</strong>
            <p style={{ margin: "8px 0 0", overflowWrap: "anywhere" }}>{error}</p>
          </section>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          <MetricCard label="site_editorials home" value={editorial ? "existe" : "ausente"} help={editorial?.id ?? "sem registo"} />
          <MetricCard label="estado" value={editorial?.status ?? "sem estado"} />
          <MetricCard label="destaques publicados" value={publishedHighlights.length} help={`${highlights.length} total`} />
          <MetricCard label="ultimas noticias publicadas" value={publishedLatestNews.length} help={`${latestNews.length} total`} />
          <MetricCard label="jogos selecionados" value={featuredMatches.length} />
          <MetricCard label="roundup publicado" value={publishedRoundupItems.length} help={`${roundupItems.length} total`} />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 420px)", gap: 16 }}>
          <article style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Campos principais</h2>
            {editorial ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                <FieldRow label="Manchete - titulo" value={editorial.headline_title} />
                <FieldRow label="Manchete - subtitulo" value={editorial.headline_subtitle} />
                <FieldRow label="Manchete - imagem" value={editorial.headline_image_url} />
                <FieldRow label="Manchete - link" value={editorial.headline_link_url} />
                <FieldRow label="Bloco lateral - titulo" value={editorial.side_block_title} />
                <FieldRow label="Bloco lateral - texto" value={editorial.side_block_text} />
                <FieldRow label="Bloco lateral - link" value={editorial.side_block_link_url} />
                <FieldRow label="Complemento - modo" value={editorial.complementary_mode} />
                <FieldRow label="Complemento - titulo" value={editorial.complementary_title} />
                <FieldRow label="Complemento - texto" value={editorial.complementary_text} />
                <FieldRow label="Complemento - link" value={editorial.complementary_link_url} />
                <FieldRow label="Destaques - titulo da zona" value={editorial.below_headline_heading} />
                <FieldRow label="Zona final - titulo" value={editorial.final_zone_title} />
                <FieldRow label="Zona final - modo" value={editorial.final_zone_mode} />
              </ul>
            ) : (
              <p style={{ color: "#667085" }}>Nao existe registo site_editorials com slug home.</p>
            )}
          </article>

          <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <article style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Complemento</h2>
              <p style={{ color: "#475467", margin: 0 }}>
                Existe conteudo de complemento: <strong>{hasComplement ? "sim" : "nao"}</strong>
              </p>
              <p style={{ color: "#475467", margin: "8px 0 0" }}>
                Estado: <strong>{editorial?.complementary_status ?? "sem estado"}</strong>
              </p>
            </article>

            <article style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Links encontrados</h2>
              {links.length > 0 ? (
                <ul style={{ display: "grid", gap: 10, margin: 0, padding: 0, listStyle: "none" }}>
                  {links.slice(0, 12).map(([label, link]) => (
                    <li key={`${label}-${link}`}>
                      <strong style={{ display: "block", fontSize: 13 }}>{label}</strong>
                      <code style={{ color: "#475467", fontSize: 12, overflowWrap: "anywhere" }}>{link}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#667085", margin: 0 }}>Sem links preenchidos.</p>
              )}
            </article>
          </aside>
        </section>

        <ComplementPreview editorial={editorial} hasComplement={hasComplement} />
        <ComplementVisualPreview editorial={editorial} hasComplement={hasComplement} />

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <article style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Destaques publicados</h2>
            <ItemList items={publishedHighlights} />
          </article>
          <article style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Ultimas noticias publicadas</h2>
            <ItemList items={publishedLatestNews} />
          </article>
          <article style={{ border: "1px solid #dfe3ea", borderRadius: 12, background: "#fff", padding: 18 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Jogos selecionados</h2>
            {featuredMatches.length > 0 ? (
              <ol style={{ display: "grid", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
                {featuredMatches.slice(0, 12).map((item) => (
                  <li key={item.id} style={{ borderBottom: "1px solid #edf0f5", paddingBottom: 8 }}>
                    <strong style={{ display: "block", fontSize: 13 }}>ordem {item.sort_order ?? "sem ordem"}</strong>
                    <code style={{ color: "#475467", fontSize: 12, overflowWrap: "anywhere" }}>{item.match_id ?? "sem match_id"}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{ color: "#667085", margin: 0 }}>Sem jogos selecionados.</p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
