import type { Exploitation } from "./exploitation";

const MARQUES = /[\u0300-\u036f]/g;
const CODE_POSTAL_COMMUNE = /\b\d{5}\s+(.+)$/;

/** Minuscules, sans accents : « Époisses » et « epoisses » se comparent égaux. */
export function plier(value: string): string {
  return value.normalize("NFD").replace(MARQUES, "").toLowerCase();
}

/** Commune lue après le code postal (adresse géo, sinon lieux). */
export function communeDe(exploitation: Exploitation): string {
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
  if (!query) return "/";
  const params = new URLSearchParams();
  params.set("q", query);
  return `/?${params.toString()}`;
}

export function filtrerExploitations(
  exploitations: Exploitation[],
  query: string,
): Exploitation[] {
  const q = plier(query).replace(/\s+/g, " ").trim();
  if (!q) return exploitations;

  return exploitations.filter((exploitation) => {
    const champs = [
      exploitation.nom,
      communeDe(exploitation),
      exploitation.histoire,
      exploitation.departement,
      exploitation.region,
      ...exploitation.produits,
      ...exploitation.lieux.flatMap((lieu) => [lieu.label, lieu.address ?? ""]),
    ];
    return champs.some((champ) => plier(champ).includes(q));
  });
}
