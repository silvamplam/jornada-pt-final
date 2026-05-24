"use client";

import { useMemo, useRef, useState } from "react";
import type { SupabaseBroadcastChannel, SupabaseCompetition, SupabaseSeason } from "@/lib/supabase";

type BulkBroadcastToolProps = {
  canWrite: boolean;
  competitions: SupabaseCompetition[];
  seasons: SupabaseSeason[];
  broadcastChannels: SupabaseBroadcastChannel[];
};

type PreviewRow = {
  line: number;
  matchday: string;
  home: string;
  away: string;
  channel: string;
  matchLabel: string;
  channelLabel: string;
  status: "update" | "unchanged" | "match_not_found" | "channel_not_found" | "invalid" | "conflict";
  note: string;
};

type PreviewResponse = {
  rows: PreviewRow[];
  summary: {
    update: number;
    unchanged: number;
    missingMatch: number;
    missingChannel: number;
    invalid: number;
    conflict: number;
  };
  applied: number;
  error?: string;
};

const statusLabels: Record<PreviewRow["status"], string> = {
  update: "Será atualizado",
  unchanged: "Já tinha este canal",
  match_not_found: "Jogo não encontrado",
  channel_not_found: "Canal não encontrado",
  invalid: "Linha inválida",
  conflict: "Conflito"
};

export function BulkBroadcastTool({ canWrite, competitions, seasons, broadcastChannels }: BulkBroadcastToolProps) {
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? "");
  const [rows, setRows] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const competitionsById = useMemo(() => new Map(competitions.map((competition) => [competition.id, competition])), [competitions]);

  async function submit(action: "preview" | "apply") {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/matches/broadcast-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, seasonId, rows })
      });
      const result = (await response.json()) as PreviewResponse;

      if (!response.ok || result.error) {
        setMessage("Não foi possível processar a lista de TV.");
        return;
      }

      setPreview(result);
      setMessage(action === "apply" ? `${result.applied} transmissões aplicadas.` : "Pré-visualização concluída.");
    } catch {
      setMessage("Não foi possível processar a lista de TV.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setRows(await file.text());
    setPreview(null);
    setMessage("Lista carregada. Revê o conteúdo e pré-visualiza antes de aplicar.");
  }

  const canApply = canWrite && Boolean(preview?.summary.update) && !loading;

  return (
    <section className="match-tv-bulk">
      <header>
        <h2>Atualizar TV dos jogos em lote</h2>
        <small>Cola ou carrega uma lista no formato Jornada;Casa;Fora;Canal. Só é alterado o canal TV do jogo.</small>
      </header>

      <div className="match-tv-bulk-body">
        <div className="match-tv-bulk-controls">
          <label>
            <span>Época</span>
            <select disabled={!canWrite || seasons.length === 0} value={seasonId} onChange={(event) => setSeasonId(event.target.value)}>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {competitionsById.get(season.competition_id)?.name ?? "Competição"} · {season.label}
                </option>
              ))}
            </select>
          </label>
          <div className="match-tv-bulk-actions">
            <input
              accept=".txt,.csv,text/plain,text/csv"
              hidden
              onChange={(event) => loadFile(event.target.files?.[0])}
              ref={fileInputRef}
              type="file"
            />
            <button className="match-tv-secondary" disabled={!canWrite} onClick={() => fileInputRef.current?.click()} type="button">
              Carregar .txt/.csv
            </button>
          </div>
        </div>

        <textarea
          disabled={!canWrite}
          onChange={(event) => {
            setRows(event.target.value);
            setPreview(null);
          }}
          placeholder={"Jornada;Casa;Fora;Canal\n1;Girona FC;Rayo Vallecano;DAZN\n1;Villarreal CF;Real Oviedo;Sport TV 1"}
          value={rows}
        />

        <div className="match-tv-bulk-actions">
          <button disabled={!canWrite || !rows.trim() || !seasonId || loading} onClick={() => submit("preview")} type="button">
            Pré-visualizar TV
          </button>
          {preview ? (
            <button disabled={!canApply} onClick={() => submit("apply")} type="button">
              Aplicar TV validada
            </button>
          ) : null}
        </div>

        {message ? <p className="match-tv-bulk-message">{message}</p> : null}

        {preview ? (
          <div className="match-tv-preview">
            <div className="match-tv-preview-summary">
              <span>{preview.summary.update} serão atualizados</span>
              <span>{preview.summary.unchanged} já tinham este canal</span>
              <span>{preview.summary.missingMatch} jogos não encontrados</span>
              <span>{preview.summary.missingChannel} canais não encontrados</span>
              <span>{preview.summary.invalid} inválidas</span>
              <span>{preview.summary.conflict} conflitos</span>
            </div>
            <div className="match-tv-preview-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Jornada</th>
                    <th>Casa</th>
                    <th>Fora</th>
                    <th>Canal</th>
                    <th>Jogo encontrado</th>
                    <th>Canal encontrado</th>
                    <th>Estado</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={`${row.line}-${row.home}-${row.away}`}>
                      <td>{row.line}</td>
                      <td>{row.matchday}</td>
                      <td>{row.home}</td>
                      <td>{row.away}</td>
                      <td>{row.channel}</td>
                      <td>{row.matchLabel}</td>
                      <td>{row.channelLabel}</td>
                      <td>{statusLabels[row.status]}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <p className="match-tv-bulk-help">
          Canais disponíveis: {broadcastChannels.map((channel) => channel.name).join(", ") || "nenhum canal registado"}.
        </p>
      </div>
    </section>
  );
}
