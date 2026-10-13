"use client";

import { useActionState } from "react";
import { ChampPiege } from "@/app/champ-piege";
import {
  supprimerCompte,
  supprimerFiche,
} from "@/app/actions/suppression";
import {
  etatSuppressionInitial,
  type EtatSuppression,
} from "@/lib/etat-suppression";

function FormulaireSuppression({
  action,
  titre,
  texte,
  confirmation,
  valeur,
  bouton,
}: {
  action: (
    etat: EtatSuppression,
    formData: FormData,
  ) => Promise<EtatSuppression>;
  titre: string;
  texte: string;
  confirmation: string;
  valeur: string;
  bouton: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    etatSuppressionInitial,
  );
  const erreur = pending ? "" : state.erreur;

  return (
    <form action={formAction} className="formulaire">
      <h2>{titre}</h2>
      <p>{texte}</p>
      <label>
        <input type="checkbox" name="confirmer" value={valeur} /> {confirmation}
      </label>
      <ChampPiege />
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? "Suppression…" : bouton}
      </button>
    </form>
  );
}

export function SuppressionCompte({ aUneFiche }: { aUneFiche: boolean }) {
  return (
    <section>
      {aUneFiche ? (
        <FormulaireSuppression
          action={supprimerFiche}
          titre="Supprimer la fiche"
          texte="La fiche publique disparaît. Le compte reste ouvert."
          confirmation="Je confirme la suppression de la fiche."
          valeur="fiche"
          bouton="Supprimer la fiche"
        />
      ) : null}
      <FormulaireSuppression
        action={supprimerCompte}
        titre="Supprimer le compte"
        texte="Le compte est fermé. Cette action retire aussi la fiche si elle existe encore."
        confirmation="Je confirme la suppression du compte."
        valeur="compte"
        bouton="Supprimer le compte"
      />
    </section>
  );
}
