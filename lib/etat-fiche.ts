export type ValeursFiche = {
  slug: string;
  nom: string;
  commune: string;
  produits: string;
  contact: string;
  description: string;
};

export type EtatFiche = {
  erreurs: Partial<
    Record<
      "nom" | "commune" | "produits" | "contact" | "description" | "formulaire",
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
};

export function etatInitial(valeurs: ValeursFiche = ficheVide): EtatFiche {
  return { erreurs: {}, valeurs, message: "", slugPublic: valeurs.slug };
}
