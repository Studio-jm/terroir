import type { ChampsLot1, CleLot1 } from "./fiche-lot1";
import { creerLot1Vide } from "./fiche-lot1";

export type ValeursFiche = {
  slug: string;
  nom: string;
  commune: string;
  produits: string;
  contact: string;
  description: string;
  lot1: ChampsLot1;
  updatedAt: string;
};

export type EtatFiche = {
  erreurs: Partial<
    Record<
      | "nom"
      | "commune"
      | "produits"
      | "contact"
      | "description"
      | "formulaire"
      | CleLot1,
      string
    >
  >;
  valeurs: ValeursFiche;
  message: string;
  slugPublic: string;
};

export const ficheVide: ValeursFiche = {
  slug: "",
  nom: "",
  commune: "",
  produits: "",
  contact: "",
  description: "",
  lot1: creerLot1Vide(),
  updatedAt: "",
};

export function etatInitial(valeurs: ValeursFiche = ficheVide): EtatFiche {
  return { erreurs: {}, valeurs, message: "", slugPublic: valeurs.slug };
}
