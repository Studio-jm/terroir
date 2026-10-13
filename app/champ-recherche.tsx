"use client";

export function ChampRecherche({
  value,
  readOnly = false,
  onValue,
  onClear,
}: {
  value: string;
  readOnly?: boolean;
  onValue?: (value: string) => void;
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
    </form>
  );
}
