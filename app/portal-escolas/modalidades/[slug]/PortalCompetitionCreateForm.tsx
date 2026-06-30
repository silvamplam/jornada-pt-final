"use client";

import { type ChangeEvent, useState } from "react";

type PortalCompetitionCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  portalModalityId: string;
  modalitySlug: string;
  modalityName: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function PortalCompetitionCreateForm({
  action,
  portalModalityId,
  modalitySlug,
  modalityName
}: PortalCompetitionCreateFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setName(nextName);

    if (!slugTouched) {
      setSlug(slugify(nextName));
    }
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    setSlug(slugify(event.target.value));
  }

  return (
    <form action={action} className="portal-competition-create-form">
      <input type="hidden" name="portal_modality_id" value={portalModalityId} />
      <input type="hidden" name="modality_slug" value={modalitySlug} />

      <div className="portal-competition-create-state" aria-label="Estado da competição após criação">
        <span className="portal-modality-detail-tag">Estado inicial: rascunho</span>
        <span className="portal-modality-detail-tag">Publicação: gatekeeper</span>
      </div>

      <div className="portal-competition-create-grid">
        <div className="portal-competition-create-field">
          <label htmlFor="portal-competition-modality">Modalidade</label>
          <input id="portal-competition-modality" value={modalityName} readOnly />
          <span>Esta competição ficará associada à modalidade atual.</span>
        </div>

        <div className="portal-competition-create-field">
          <label htmlFor="portal-competition-name">Nome da competição</label>
          <input
            id="portal-competition-name"
            name="name"
            value={name}
            onChange={handleNameChange}
            maxLength={120}
            placeholder="Ex.: Torneio Interturmas 7.º Ano"
            required
          />
          <span>Nome visível no Portal das Escolas.</span>
        </div>

        <div className="portal-competition-create-field">
          <label htmlFor="portal-competition-slug">Slug / identificador</label>
          <input
            id="portal-competition-slug"
            name="slug"
            value={slug}
            onChange={handleSlugChange}
            maxLength={120}
            placeholder="Ex.: torneio-interturmas-7-ano"
            required
          />
          <span>Preenchido automaticamente a partir do nome. Podes ajustar antes de criar.</span>
        </div>

        <div className="portal-competition-create-field">
          <label htmlFor="portal-competition-scope">Âmbito</label>
          <input
            id="portal-competition-scope"
            name="scope"
            maxLength={80}
            placeholder="Opcional · Ex.: 7.º ano"
          />
          <span>Campo opcional para descrever o âmbito interno da competição.</span>
        </div>

        <div className="portal-competition-create-field portal-competition-create-field-full">
          <label htmlFor="portal-competition-format">Formato</label>
          <input
            id="portal-competition-format"
            name="format"
            maxLength={120}
            placeholder="Opcional · Ex.: fase de grupos, todos contra todos"
          />
          <span>Campo opcional. A configuração formal do formato competitivo fica para uma fase posterior.</span>
        </div>
      </div>

      <button type="submit">Criar competição em rascunho</button>
    </form>
  );
}
