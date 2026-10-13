"use client";

import { CATEGORIES, MODES } from "@/lib/fiche-lot1";

export function ChampRecherche({
  value,
  categorie = "",
  mode = "",
  readOnly = false,
  onValue,
  onCategorie,
  onMode,
  onClear,
}: {
  value: string;
  categorie?: string;
  mode?: string;
  readOnly?: boolean;
  onValue?: (value: string) => void;
  onCategorie?: (value: string) => void;
  onMode?: (value: string) => void;
  onClear?: () => void;
}) {
  return (
    <form
      className="mt-4 w-full max-w-xl"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <label
        htmlFor="recherche-exploitation"
        className="text-sm font-semibold text-encre"
      >
        Rechercher par nom, description, lieu ou produit
      </label>
      <div className="mt-1 flex w-full flex-wrap items-center gap-2">
        <input
          id="recherche-exploitation"
          name="q"
          type="search"
          readOnly={readOnly}
          value={readOnly ? undefined : value}
          defaultValue={readOnly ? "" : undefined}
          onChange={
            onValue ? (event) => onValue(event.target.value) : undefined
          }
          aria-describedby="annonce-resultats"
          autoComplete="off"
          className="min-w-0 flex-1 basis-48 rounded border-2 border-encre bg-papier px-3 py-2 text-base text-encre"
        />
        <button
          type="button"
          onClick={onClear}
          disabled={readOnly || value.length === 0}
          className="rounded border-2 border-encre bg-creme-fonce px-3 py-2 text-base text-encre disabled:cursor-default disabled:opacity-40"
        >
          Effacer
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="text-sm font-semibold text-encre" htmlFor="filtre-categorie">
          Catégorie
          <select
            id="filtre-categorie"
            name="categorie"
            className="mt-1 block rounded border-2 border-encre bg-papier px-3 py-2 text-base font-normal text-encre"
            value={readOnly ? "" : categorie}
            disabled={readOnly}
            onChange={onCategorie ? (event) => onCategorie(event.target.value) : undefined}
          >
            <option value="">Toutes</option>
            {CATEGORIES.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-encre" htmlFor="filtre-mode">
          Mode de vente
          <select
            id="filtre-mode"
            name="mode"
            className="mt-1 block rounded border-2 border-encre bg-papier px-3 py-2 text-base font-normal text-encre"
            value={readOnly ? "" : mode}
            disabled={readOnly}
            onChange={onMode ? (event) => onMode(event.target.value) : undefined}
          >
            <option value="">Tous</option>
            {MODES.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
