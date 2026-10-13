"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="formulaire" noValidate>
      <Champ
        id="email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        erreur={state.erreurs.email}
        defaultValue={state.valeurs.email}
      />
      <Champ
        id="mot_de_passe"
        label="Mot de passe"
        type="password"
        autoComplete={
          mode === "inscription" ? "new-password" : "current-password"
        }
        erreur={state.erreurs.motDePasse}
      />
      {mode === "inscription" ? (
        <Champ
          id="confirmation"
          label="Confirmation du mot de passe"
          type="password"
          autoComplete="new-password"
          erreur={state.erreurs.confirmation}
        />
      ) : null}
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
