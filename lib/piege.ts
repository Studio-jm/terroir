export const NOM_PIEGE = "piege_robot";

const CHAMPS_REELS = new Set([
  "email",
  "mot_de_passe",
  "confirmation",
  "slug",
  "nom",
  "commune",
  "produits",
  "contact",
  "description",
  "q",
]);

export function nomPiegeInterdit(nom: string): boolean {
  return CHAMPS_REELS.has(nom);
}

export function piegeRempli(formData: FormData): boolean {
  return formData.getAll(NOM_PIEGE).some(
    (valeur) => typeof valeur === "string" && valeur.trim() !== "",
  );
}
