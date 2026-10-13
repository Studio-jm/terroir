import type { Exploitation } from "./exploitation";

const MARQUES = /[\u0300-\u036f]/g;
const CODE_POSTAL_COMMUNE = /\b\d{5}\s+(.+)$/;

/** Minuscules, sans accents : « Époisses » et « epoisses » se comparent égaux. */
export function plier(value: string): string {
  return value.normalize("NFD").replace(MARQUES, "").toLowerCase();
}

/** Commune saisie par le producteur, sinon lue après le code postal. */
export function communeDe(exploitation: Exploitation): string {
  if (exploitation.commune?.trim()) return exploitation.commune.trim();
  const adresses = [
    exploitation.geo.address,
    ...exploitation.lieux.map((lieu) => lieu.address),
  ];
  for (const adresse of adresses) {
    if (!adresse) continue;
    const match = adresse.match(CODE_POSTAL_COMMUNE);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

export function hrefAvecRecherche(query: string): string {
  return hrefRecherche({ q: query });
}

export function hrefRecherche(choix: {
  q?: string;
  categorie?: string;
  mode?: string;
}): string {
  const params = new URLSearchParams();
  const q = choix.q?.trim() ?? "";
  if (q) params.set("q", q);
  if (choix.categorie) params.set("categorie", choix.categorie);
  if (choix.mode) params.set("mode", choix.mode);
  const texte = params.toString();
  return texte ? `/?${texte}` : "/";
}

export function filtrerExploitations(
  exploitations: Exploitation[],
  query: string,
  choix: { categorie?: string; mode?: string } = {},
): Exploitation[] {
  const q = plier(query).replace(/\s+/g, " ").trim();
  return exploitations.filter((exploitation) => {
    if (q) {
      const detail = exploitation.detail;
      const champs = [
        exploitation.nom,
        communeDe(exploitation),
        exploitation.histoire,
        exploitation.departement,
        exploitation.region,
        ...exploitation.produits,
        ...exploitation.lieux.flatMap((lieu) => [lieu.label, lieu.address ?? ""]),
        detail?.presentation ?? "",
        ...(detail?.offres.flatMap((offre) => [offre.nom, offre.categorie]) ?? []),
        ...(detail?.modes ?? []),
        ...(detail?.points.flatMap((point) => [
          point.nom,
          point.commune,
          point.jour,
          point.horaires,
        ]) ?? []),
        ...(detail?.labels ?? []),
      ];
      if (!champs.some((champ) => plier(champ).includes(q))) return false;
    }
    if (
      choix.categorie &&
      !exploitation.detail?.offres.some((offre) => offre.categorie === choix.categorie)
    ) {
      return false;
    }
    if (
      choix.mode &&
      !exploitation.detail?.modes.some((mode) => mode === choix.mode)
    ) {
      return false;
    }
    return true;
  });
}
