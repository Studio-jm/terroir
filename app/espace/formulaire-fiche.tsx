"use client";

import Link from "next/link";
import { useActionState } from "react";
import { enregistrerFiche } from "@/app/actions/fiche";
import {
  etatInitial,
  type EtatFiche,
  type ValeursFiche,
} from "@/lib/etat-fiche";

function lienPublic(slug: string): string | null {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  return `/e/${slug}`;
}

export function FormulaireFiche({ valeurs }: { valeurs: ValeursFiche }) {
  const [state, formAction, pending] = useActionState<EtatFiche, FormData>(
    enregistrerFiche,
    etatInitial(valeurs),
  );
  const lien = lienPublic(state.slugPublic);

  return (
    <form action={formAction} className="formulaire" noValidate>
      <input
        key={state.slugPublic}
        type="hidden"
        name="slug"
        defaultValue={state.slugPublic}
      />
      <Champ
        id="nom"
        label="Nom"
        erreur={state.erreurs.nom}
        defaultValue={state.valeurs.nom}
        maxLength={80}
        autoComplete="organization"
      />
      <Champ
        id="commune"
        label="Commune"
        erreur={state.erreurs.commune}
        defaultValue={state.valeurs.commune}
        maxLength={80}
        autoComplete="address-level2"
      />
      <Champ
        id="produits"
        label="Produits"
        aide="Séparez les produits par des virgules."
        erreur={state.erreurs.produits}
        defaultValue={state.valeurs.produits}
        maxLength={500}
      />
      <Champ
        id="contact"
        label="Contact"
        aide="E-mail, téléphone français ou adresse web."
        erreur={state.erreurs.contact}
        defaultValue={state.valeurs.contact}
        maxLength={200}
      />
      <div className="champ">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={8}
          maxLength={2000}
          defaultValue={state.valeurs.description}
          aria-invalid={state.erreurs.description ? true : undefined}
          aria-describedby={
            state.erreurs.description
              ? "description-aide description-erreur"
              : "description-aide"
          }
        />
        <p id="description-aide" className="aide">
          Les retours à la ligne créent de nouveaux paragraphes.
        </p>
        {state.erreurs.description ? (
          <p id="description-erreur" className="erreur" role="alert">
            {state.erreurs.description}
          </p>
        ) : null}
      </div>
      <div className="piege">
        <label htmlFor="site_web">Site web</label>
        <input
          id="site_web"
          name="site_web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      {state.erreurs.formulaire ? (
        <p className="erreur" role="alert">
          {state.erreurs.formulaire}
        </p>
      ) : null}
      {state.message ? (
        <p className="succes" role="status">
          {state.message}
        </p>
      ) : null}
      {lien ? (
        <p>
          <Link href={lien}>Voir la fiche publique</Link>
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la fiche"}
      </button>
    </form>
  );
}

function Champ({
  id,
  label,
  aide,
  erreur,
  defaultValue,
  maxLength,
  autoComplete,
}: {
  id: string;
  label: string;
  aide?: string;
  erreur?: string;
  defaultValue: string;
  maxLength: number;
  autoComplete?: string;
}) {
  const describedBy = [aide ? `${id}-aide` : "", erreur ? `${id}-erreur` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="champ">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type="text"
        maxLength={maxLength}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {aide ? (
        <p id={`${id}-aide`} className="aide">
          {aide}
        </p>
      ) : null}
      {erreur ? (
        <p id={`${id}-erreur`} className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
