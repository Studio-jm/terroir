import type { Exploitation } from "./exploitation";
import { emailContactValide, telephoneContactValide, urlContactValide } from "./fiche-regles";

export const PHOTOS_MAX = 6;
export const TAILLE_MAX_PHOTO = 5 * 1024 * 1024;

const TYPES_PHOTO = new Set(["image/jpeg", "image/png", "image/webp"]);

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export type FermeturePlage = {
  debut: string;
  fin: string;
  motif: string;
};

export type ActualiteCourte = {
  titre: string;
  texte: string;
  date: string;
};

export type PhotoPublique = {
  src: string;
  alt: string;
};

export type CarteFiche = {
  lat: number;
  lng: number;
  precis: boolean;
  libelle: string;
};

export type AccueilFerme = {
  visite: boolean;
  conditions: string;
  reservation: string;
};

export type ComplementFiche = {
  contactAffichable: boolean;
  photos: PhotoPublique[];
  carte: CarteFiche | null;
  fermetures: FermeturePlage[];
  actualites: ActualiteCourte[];
  accueil: AccueilFerme | null;
};

export function contactWeb(contact: string | undefined): string {
  const valeur = contact?.trim() ?? "";
  if (!valeur) return "";
  if (emailContactValide(valeur) || telephoneContactValide(valeur)) return "";
  return urlContactValide(valeur) ? valeur : "";
}

export function erreurPhoto(input: {
  taille: number;
  type: string;
  alt: string;
  nombre: number;
}): string | null {
  if (input.nombre >= PHOTOS_MAX) return "6 photos maximum.";
  if (!TYPES_PHOTO.has(input.type)) return "Formats acceptés : JPEG, PNG ou WebP.";
  if (input.taille > TAILLE_MAX_PHOTO) return "5 Mo maximum.";
  if (input.taille < 1) return "Le fichier est vide.";
  const alt = input.alt.trim();
  if (!alt) return "Le texte alternatif est obligatoire.";
  if (alt.length > 200) return "Le texte alternatif tient en 200 caractères.";
  return null;
}

export function jourParis(maintenant = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(maintenant);
}

export function fermetureEnCours(
  plages: readonly FermeturePlage[],
  maintenant = new Date(),
): FermeturePlage | null {
  const jour = jourParis(maintenant);
  let retenue: FermeturePlage | null = null;
  for (const plage of plages) {
    if (plage.debut <= jour && jour <= plage.fin) {
      if (!retenue || plage.fin > retenue.fin) retenue = plage;
    }
  }
  return retenue;
}

export function libelleDateIso(iso: string): string {
  const [annee, mois, jour] = iso.split("-");
  const nom = MOIS[Number(mois) - 1];
  if (!nom || !jour || !annee) return iso;
  return `${Number(jour)} ${nom} ${annee}`;
}

export function texteFermeture(plage: FermeturePlage): string {
  return `Fermé jusqu'au ${libelleDateIso(plage.fin)}`;
}

export function troisDernieres<T extends { date: string }>(actualites: readonly T[]): T[] {
  return [...actualites].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 3);
}

export function positionPublique(input: {
  commune: string;
  adresse: string;
  montrerExacte: boolean;
  latCommune: number | null;
  lngCommune: number | null;
  latAdresse: number | null;
  lngAdresse: number | null;
}): CarteFiche | null {
  if (
    input.montrerExacte &&
    input.latAdresse != null &&
    input.lngAdresse != null &&
    input.adresse.trim()
  ) {
    return {
      lat: input.latAdresse,
      lng: input.lngAdresse,
      precis: true,
      libelle: input.adresse.trim(),
    };
  }
  if (input.latCommune != null && input.lngCommune != null && input.commune.trim()) {
    return {
      lat: input.latCommune,
      lng: input.lngCommune,
      precis: false,
      libelle: `${input.commune.trim()}, position de la commune`,
    };
  }
  return null;
}

export function erreurPlage(debut: string, fin: string): string | null {
  if (!dateIso(debut) || !dateIso(fin)) return "Indiquez un début et une fin.";
  if (fin < debut) return "La fin est avant le début.";
  return null;
}

export function erreurChamp(valeur: string, min: number, max: number, etiquette: string): string | null {
  const texte = valeur.trim();
  if (texte.length < min) return `${etiquette} : ${min} caractères minimum.`;
  if (texte.length > max) return `${etiquette} : ${max} caractères maximum.`;
  return null;
}

export function ficheSansCoordonnees(exploitation: Exploitation): Exploitation {
  const contact = exploitation.contact ?? "";
  const affichable =
    exploitation.complement?.contactAffichable === true ||
    Boolean(
      exploitation.detail?.afficher &&
        (exploitation.detail.telephone || exploitation.detail.email),
    ) ||
    emailContactValide(contact) ||
    telephoneContactValide(contact);
  const complement = exploitation.complement;
  return {
    ...exploitation,
    contact: contactWeb(contact) || undefined,
    detail: exploitation.detail
      ? { ...exploitation.detail, telephone: null, email: null, afficher: false }
      : undefined,
    complement: {
      contactAffichable: affichable,
      photos: complement?.photos ?? [],
      carte: complement?.carte ?? null,
      fermetures: complement?.fermetures ?? [],
      actualites: troisDernieres(complement?.actualites ?? []),
      accueil: complement?.accueil ?? null,
    },
  };
}

function dateIso(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const [annee, mois, jour] = valeur.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  return (
    date.getUTCFullYear() === annee &&
    date.getUTCMonth() === mois - 1 &&
    date.getUTCDate() === jour
  );
}
