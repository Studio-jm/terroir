"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ChampPiege } from "@/app/champ-piege";
import { ChampsLot1 } from "@/app/espace/champs-lot1";
import { enregistrerFiche } from "@/app/actions/fiche";
import {
  etatInitial,
  type EtatFiche,
  type ValeursFiche,
} from "@/lib/etat-fiche";
import { libelleMiseAJour } from "@/lib/fiche-lot1";

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
  const erreurs = pending ? {} : state.erreurs;
  const message = pending ? "" : state.message;
  const miseAJour = libelleMiseAJour(state.valeurs.updatedAt);

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
        erreur={erreurs.nom}
        defaultValue={state.valeurs.nom}
        maxLength={80}
        autoComplete="organization"
      />
      <Champ
        id="commune"
        label="Commune"
        erreur={erreurs.commune}
        defaultValue={state.valeurs.commune}
        maxLength={80}
        autoComplete="address-level2"
      />
      <Champ
        id="produits"
        label="Produits"
        aide="Séparez les produits par des virgules."
        erreur={erreurs.produits}
        defaultValue={state.valeurs.produits}
        maxLength={500}
      />
      <Champ
        id="contact"
        label="Contact"
        aide="Adresse web publique (exemple.org, www.exemple.org, https://exemple.org). Le téléphone et l'e-mail se renseignent plus bas et restent masqués jusqu'au clic."
        erreur={erreurs.contact}
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
          aria-invalid={erreurs.description ? true : undefined}
          aria-describedby={
            erreurs.description
              ? "description-aide description-erreur"
              : "description-aide"
          }
        />
        <p id="description-aide" className="aide">
          Les retours à la ligne créent de nouveaux paragraphes.
        </p>
        {erreurs.description ? (
          <p id="description-erreur" className="erreur" role="alert">
            {erreurs.description}
          </p>
        ) : null}
      </div>
      <ChampsLot1 lot1={state.valeurs.lot1} erreurs={erreurs} />
      {miseAJour ? <p>{miseAJour}</p> : null}
      <ChampPiege />
      {erreurs.formulaire ? (
        <p className="erreur" role="alert">
          {erreurs.formulaire}
        </p>
      ) : null}
      {message ? (
        <p className="succes" role="status">
          {message}
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
