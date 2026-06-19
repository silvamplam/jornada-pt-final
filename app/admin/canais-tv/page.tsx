import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fetchSupabaseAdminTable, writeSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ChannelsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type BroadcastChannelRow = {
  id: string;
  name: string | null;
  platform: string | null;
  country: string | null;
  logo_url: string | null;
};

type MatchBroadcastRow = {
  id: string;
  broadcast_channel_id: string | null;
};

const channelAdminStyles = `
  body {
    margin: 0;
    background: #eef2f6;
  }

  .channel-admin-shell {
    min-height: 100vh;
    padding: 28px;
    background: #eef2f6;
    color: #10151b;
    font-family: Arial, Helvetica, sans-serif;
  }

  .channel-admin-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10151b, #25303c);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(8, 15, 24, 0.16);
  }

  .channel-admin-hero p,
  .channel-admin-hero h1,
  .channel-admin-hero span {
    margin: 0;
  }

  .channel-admin-hero p {
    color: #e5252a;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .channel-admin-hero h1 {
    margin-top: 8px;
    font-size: 42px;
    line-height: 1;
  }

  .channel-admin-hero span {
    display: block;
    margin-top: 10px;
    color: #cdd5df;
    font-size: 16px;
  }

  .channel-admin-hero a {
    flex: 0 0 auto;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 6px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
  }

  .channel-admin-message {
    margin-top: 18px;
    padding: 16px 18px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #dce3eb;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .channel-admin-message.warning {
    border-color: #ffd3a3;
    background: #fff8ee;
    color: #8a3a00;
  }

  .channel-admin-message.success {
    border-color: #bfe4c9;
    background: #f0fbf3;
    color: #146b2c;
  }

  .channel-admin-create,
  .channel-admin-list {
    margin-top: 18px;
    border: 1px solid #dce3eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(12, 22, 34, 0.07);
  }

  .channel-admin-create header,
  .channel-admin-list header {
    padding: 18px 20px;
    border-bottom: 1px solid #e6ebf1;
  }

  .channel-admin-create h2,
  .channel-admin-list h2 {
    margin: 0;
    font-size: 21px;
    text-transform: uppercase;
  }

  .channel-admin-create small,
  .channel-admin-list small {
    color: #687380;
  }

  .channel-form {
    display: grid;
    grid-template-columns: 54px minmax(170px, 1fr) minmax(140px, 0.8fr) minmax(120px, 0.7fr) minmax(240px, 1.35fr) minmax(170px, auto);
    gap: 10px;
    align-items: end;
    padding: 14px 18px;
    border-bottom: 1px solid #eef2f6;
  }

  .channel-form:last-child {
    border-bottom: 0;
  }

  .channel-form figure {
    display: grid;
    place-items: center;
    width: 42px;
    height: 34px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #dce3eb;
    border-radius: 6px;
    background: #f8fafc;
    color: #5e6874;
    font-size: 11px;
    font-weight: 900;
  }

  .channel-form img {
    display: block;
    width: 36px !important;
    max-width: 36px !important;
    height: 24px !important;
    max-height: 24px !important;
    object-fit: contain;
  }

  .channel-field {
    display: grid;
    gap: 5px;
  }

  .channel-field label {
    color: #687380;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .channel-field input {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
  }

  .channel-field input:focus {
    outline: 2px solid rgba(229, 37, 42, 0.16);
    border-color: #e5252a;
  }

  .channel-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .channel-usage {
    grid-column: 1 / -1;
    color: #66717f;
    font-size: 11px;
    font-weight: 800;
  }

  .channel-form button {
    min-height: 39px;
    padding: 10px 13px;
    border: 0;
    border-radius: 6px;
    background: #e5252a;
    color: #ffffff;
    font: inherit;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: pointer;
  }

  .channel-form button.channel-danger {
    background: #7f1d1d;
  }

  .channel-form button:disabled,
  .channel-field input:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 1120px) {
    .channel-form {
      grid-template-columns: 54px repeat(2, minmax(0, 1fr));
    }

    .channel-actions {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .channel-admin-shell {
      padding: 16px;
    }

    .channel-admin-hero,
    .channel-form {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
`;

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanValue = value.trim();
  return cleanValue.length > 0 ? cleanValue : null;
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function messageFor(params: Record<string, string | string[] | undefined>) {
  if (firstSearchParam(params.created) === "1") {
    return { type: "success", text: "Canal criado." };
  }

  if (firstSearchParam(params.updated) === "1") {
    return { type: "success", text: "Canal atualizado." };
  }

  if (firstSearchParam(params.deleted) === "1") {
    return { type: "success", text: "Canal removido." };
  }

  if (firstSearchParam(params.deleteError) === "1") {
    return { type: "warning", text: "Não foi possível remover o canal. Este canal pode estar associado a jogos." };
  }

  if (firstSearchParam(params.error) === "1") {
    return { type: "warning", text: "Não foi possível guardar o canal." };
  }

  return null;
}

function idList(ids: string[]) {
  return ids.map((id) => encodeURIComponent(id)).join(",");
}

async function readChannelUsage(channelIds: string[]) {
  const usage = new Map<string, number>();
  const uniqueIds = Array.from(new Set(channelIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return usage;
  }

  try {
    const matches = await fetchSupabaseAdminTable<MatchBroadcastRow>(
      `matches?select=id,broadcast_channel_id&broadcast_channel_id=in.(${idList(uniqueIds)})&limit=5000`,
    );

    for (const match of matches) {
      if (!match.broadcast_channel_id) {
        continue;
      }

      usage.set(match.broadcast_channel_id, (usage.get(match.broadcast_channel_id) ?? 0) + 1);
    }
  } catch {
    return usage;
  }

  return usage;
}

async function readBroadcastChannels() {
  try {
    const channels = await fetchSupabaseAdminTable<BroadcastChannelRow>(
      "broadcast_channels?select=id,name,platform,country,logo_url&order=name.asc&limit=500",
    );
    const usage = await readChannelUsage(channels.map((channel) => channel.id));

    return { channels, usage, error: null as string | null };
  } catch (error) {
    return {
      channels: [] as BroadcastChannelRow[],
      usage: new Map<string, number>(),
      error: error instanceof Error ? error.message : "Não foi possível ler os canais TV.",
    };
  }
}

async function createChannel(formData: FormData) {
  "use server";

  const name = cleanText(formData.get("name"));
  if (!name) {
    redirect("/admin/canais-tv?error=1");
  }

  try {
    await writeSupabaseAdmin("broadcast_channels", {
      method: "POST",
      body: JSON.stringify({
        name,
        platform: cleanText(formData.get("platform")),
        country: cleanText(formData.get("country")),
        logo_url: cleanText(formData.get("logo_url")),
      }),
    });

    revalidatePath("/admin/canais-tv");
  } catch {
    redirect("/admin/canais-tv?error=1");
  }

  redirect("/admin/canais-tv?created=1");
}

async function updateChannel(formData: FormData) {
  "use server";

  const id = cleanText(formData.get("channel_id"));
  const name = cleanText(formData.get("name"));

  if (!id || !name) {
    redirect("/admin/canais-tv?error=1");
  }

  try {
    await writeSupabaseAdmin(`broadcast_channels?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        platform: cleanText(formData.get("platform")),
        country: cleanText(formData.get("country")),
        logo_url: cleanText(formData.get("logo_url")),
      }),
    });

    revalidatePath("/admin/canais-tv");
  } catch {
    redirect("/admin/canais-tv?error=1");
  }

  redirect("/admin/canais-tv?updated=1");
}

async function deleteChannel(formData: FormData) {
  "use server";

  const id = cleanText(formData.get("channel_id"));
  if (!id) {
    redirect("/admin/canais-tv?deleteError=1");
  }

  try {
    const usage = await readChannelUsage([id]);
    if ((usage.get(id) ?? 0) > 0) {
      redirect("/admin/canais-tv?deleteError=1");
    }

    await writeSupabaseAdmin(`broadcast_channels?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    revalidatePath("/admin/canais-tv");
  } catch {
    redirect("/admin/canais-tv?deleteError=1");
  }

  redirect("/admin/canais-tv?deleted=1");
}

export default async function AdminChannelsPage({ searchParams }: ChannelsPageProps) {
  const params = searchParams ? await searchParams : {};
  const { channels, usage, error } = await readBroadcastChannels();
  const message = messageFor(params);

  return (
    <main className="channel-admin-shell">
      <style>{channelAdminStyles}</style>

      <header className="channel-admin-hero">
        <div>
          <p>JORNADA.PT</p>
          <h1>Canais TV</h1>
          <span>Gerir onde se vê cada jogo: canal, plataforma, país e logotipo.</span>
        </div>
        <a href="/admin">Voltar ao backoffice</a>
      </header>

      {error ? <section className="channel-admin-message warning">{error}</section> : null}
      {message ? <section className={`channel-admin-message ${message.type}`}>{message.text}</section> : null}

      <section className="channel-admin-create">
        <header>
          <h2>Novo canal TV</h2>
          <small>Cria canais para associar depois aos jogos e agendas.</small>
        </header>
        <form action={createChannel} className="channel-form">
          <figure>TV</figure>
          <div className="channel-field">
            <label htmlFor="new-name">Nome</label>
            <input id="new-name" name="name" placeholder="Ex: Sport TV 1" required />
          </div>
          <div className="channel-field">
            <label htmlFor="new-platform">Plataforma</label>
            <input id="new-platform" name="platform" placeholder="Sport TV" />
          </div>
          <div className="channel-field">
            <label htmlFor="new-country">País</label>
            <input id="new-country" name="country" placeholder="Portugal" />
          </div>
          <div className="channel-field">
            <label htmlFor="new-logo-url">Logotipo URL</label>
            <input id="new-logo-url" name="logo_url" placeholder="https://..." />
          </div>
          <div className="channel-actions">
            <button type="submit">Criar</button>
          </div>
        </form>
      </section>

      <section className="channel-admin-list">
        <header>
          <h2>Canais existentes</h2>
          <small>{channels.length} canais na base de dados</small>
        </header>
        {channels.map((channel) => {
          const usedCount = usage.get(channel.id) ?? 0;

          return (
            <form action={updateChannel} className="channel-form" key={channel.id}>
              <input name="channel_id" type="hidden" value={channel.id} />
              <figure>{channel.logo_url ? <img alt="" src={channel.logo_url} /> : "TV"}</figure>
              <div className="channel-field">
                <label htmlFor={`name-${channel.id}`}>Nome</label>
                <input id={`name-${channel.id}`} name="name" required defaultValue={channel.name ?? ""} />
              </div>
              <div className="channel-field">
                <label htmlFor={`platform-${channel.id}`}>Plataforma</label>
                <input id={`platform-${channel.id}`} name="platform" defaultValue={channel.platform ?? ""} />
              </div>
              <div className="channel-field">
                <label htmlFor={`country-${channel.id}`}>País</label>
                <input id={`country-${channel.id}`} name="country" defaultValue={channel.country ?? ""} />
              </div>
              <div className="channel-field">
                <label htmlFor={`logo-${channel.id}`}>Logotipo URL</label>
                <input id={`logo-${channel.id}`} name="logo_url" defaultValue={channel.logo_url ?? ""} />
              </div>
              <div className="channel-actions">
                <span className="channel-usage">
                  {usedCount > 0 ? `Usado em ${usedCount} jogo(s)` : "Sem jogos associados"}
                </span>
                <button type="submit">Guardar</button>
                <button className="channel-danger" formAction={deleteChannel} formNoValidate type="submit">
                  Remover
                </button>
              </div>
            </form>
          );
        })}
      </section>
    </main>
  );
}
