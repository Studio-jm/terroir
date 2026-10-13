"use client";

import { useActionState } from "react";
import { ChampPiege } from "@/app/champ-piege";
import { connecter, inscrire } from "@/app/actions/auth";
import { etatCompteInitial, type EtatCompte } from "@/lib/etat-compte";

export function FormulaireCompte({
  mode,
}: {
  mode: "inscription" | "connexion";
}) {
  const action = mode === "inscription" ? inscrire : connecter;
  const [state, formAction, pending] = useActionState<EtatCompte, FormData>(
    action,
    etatCompteInitial,
  );
  const erreurs = pending ? {} : state.erreurs;
  const message = pending ? "" : state.message;

  return (
    <form action={formAction} className="formulaire" noValidate>
      <Champ
        id="email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        erreur={erreurs.email}
        defaultValue={state.valeurs.email}
      />
      <Champ
        id="mot_de_passe"
        label="Mot de passe"
        type="password"
        autoComplete={
          mode === "inscription" ? "new-password" : "current-password"
        }
        erreur={erreurs.motDePasse}
      />
      {mode === "inscription" ? (
        <Champ
          id="confirmation"
          label="Confirmation du mot de passe"
          type="password"
          autoComplete="new-password"
          erreur={erreurs.confirmation}
        />
      ) : null}
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
      <button type="submit" disabled={pending}>
        {pending
          ? "Envoi…"
          : mode === "inscription"
            ? "Créer le compte"
            : "Se connecter"}
      </button>
    </form>
  );
}

function Champ({
  id,
  label,
  type,
  autoComplete,
  erreur,
  defaultValue = "",
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  erreur?: string;
  defaultValue?: string;
}) {
  return (
    <div className="champ">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        maxLength={type === "email" ? 254 : 72}
        defaultValue={defaultValue}
        spellCheck={false}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
      />
      {erreur ? (
        <p id={`${id}-erreur`} className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
