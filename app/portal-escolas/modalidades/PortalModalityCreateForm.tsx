"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

type PortalModalityCreateFormScope = {
  key: string;
  portalContextId: string;
  entityLabel: string;
  contextLabel: string;
};

type PortalModalityCreateFormCatalogItem = {
  key: string;
  code: string;
  name: string;
};

type PortalModalityCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  creationScopes: PortalModalityCreateFormScope[];
  catalog: PortalModalityCreateFormCatalogItem[];
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

export function PortalModalityCreateForm({ action, creationScopes, catalog }: PortalModalityCreateFormProps) {
  const [catalogCode, setCatalogCode] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const catalogByCode = useMemo(() => new Map(catalog.map((catalogItem) => [catalogItem.code, catalogItem])), [catalog]);

  function suggestSlug(nextCatalogCode: string, nextName: string) {
    if (nextName.trim()) {
      return slugify(nextName);
    }

    if (nextCatalogCode) {
      return slugify(nextCatalogCode);
    }

    return "";
  }

  function handleCatalogChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextCatalogCode = event.target.value;
    setCatalogCode(nextCatalogCode);

    if (!slugTouched) {
      setSlug(suggestSlug(nextCatalogCode, name));
    }
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setName(nextName);

    if (!slugTouched) {
      setSlug(suggestSlug(catalogCode, nextName));
    }
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    setSlug(slugify(event.target.value));
  }

  const selectedCatalog = catalogCode ? catalogByCode.get(catalogCode) ?? null : null;

  return (
    <form action={action} className="portal-modalities-form">
      <div className="portal-modalities-form-state" aria-label="Estado da modalidade após criação">
        <span className="portal-modalities-tag">Estado inicial: rascunho</span>
        <span className="portal-modalities-tag">Publicação: gatekeeper</span>
      </div>

      <div className="portal-modalities-form-grid">
        <div className="portal-modalities-form-field">
          <label htmlFor="portal-modality-context">Contexto</label>
          <select id="portal-modality-context" name="portal_context_id" required>
            {creationScopes.map((scope) => (
              <option key={scope.key} value={scope.portalContextId}>
                {scope.entityLabel} · {scope.contextLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="portal-modalities-form-field">
          <label htmlFor="portal-modality-catalog">Modalidade de catálogo</label>
          <select id="portal-modality-catalog" name="catalog_code" value={catalogCode} onChange={handleCatalogChange}>
            <option value="">Modalidade local/custom</option>
            {catalog.map((catalogItem) => (
              <option key={catalogItem.key} value={catalogItem.code}>
                {catalogItem.name} · {catalogItem.code}
              </option>
            ))}
          </select>
          <span className="portal-modalities-form-help">Seleciona uma modalidade do catálogo ou deixa vazio para criar uma modalidade local.</span>
        </div>

        <div className="portal-modalities-form-field">
          <label htmlFor="portal-modality-name">Nome da modalidade</label>
          <input
            id="portal-modality-name"
            name="name"
            value={name}
            onChange={handleNameChange}
            maxLength={120}
            placeholder={selectedCatalog ? `Ex.: ${selectedCatalog.name} adaptado` : "Ex.: Natação Adaptada"}
          />
          <span className="portal-modalities-form-help">Obrigatório se não escolheres catálogo; opcional para adaptar o nome de uma modalidade do catálogo.</span>
        </div>

        <div className="portal-modalities-form-field">
          <label htmlFor="portal-modality-slug">Slug / identificador</label>
          <input
            id="portal-modality-slug"
            name="slug"
            value={slug}
            onChange={handleSlugChange}
            maxLength={120}
            placeholder="Ex.: natacao-adaptada"
          />
          <span className="portal-modalities-form-help">Preenchido automaticamente a partir do nome. Podes ajustar antes de criar.</span>
        </div>

        <div className="portal-modalities-form-field portal-modalities-form-field-full">
          <label htmlFor="portal-modality-notes">Notas</label>
          <textarea
            id="portal-modality-notes"
            name="notes"
            maxLength={400}
            placeholder="Notas internas opcionais sobre esta modalidade."
          />
        </div>
      </div>

      <button type="submit">Criar modalidade em rascunho</button>
    </form>
  );
}
