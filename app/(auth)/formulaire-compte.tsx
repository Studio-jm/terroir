"use client";

import { useActionState } from "react";
import {
  demanderConnexion,
  demanderInscription,
} from "@/app/actions/auth";
import { etatCompteInitial, type EtatCompte } from "@/lib/etat-compte";

export function FormulaireCompte({
  mode,
}: {
  mode: "inscription" | "connexion";
}) {
  const action =
    mode === "inscription" ? demanderInscription : demanderConnexion;
  const [state, formAction, pending] = useActionState<EtatCompte, FormData>(
    action,
    etatCompteInitial,
  );

  return (
    <form action={formAction} className="formulaire" noValidate>
      <div className="champ">
        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          maxLength={254}
          defaultValue={state.valeurs.email}
          aria-invalid={state.erreurs.email ? true : undefined}
          aria-describedby={state.erreurs.email ? "email-erreur" : undefined}
        />
        {state.erreurs.email ? (
          <p id="email-erreur" className="erreur" role="alert">
            {state.erreurs.email}
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
      {state.lienDev ? (
        <p>
          <a href={state.lienDev}>Ouvrir le lien de connexion</a>
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}
