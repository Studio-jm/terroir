import { plier } from "./recherche";

export const CATEGORIES = [
  ["fruits", "Fruits"],
  ["legumes", "Légumes"],
  ["produits_laitiers", "Produits laitiers"],
  ["viande", "Viande"],
  ["oeufs", "Œufs"],
  ["miel", "Miel"],
  ["boulangerie", "Boulangerie"],
  ["boissons", "Boissons"],
  ["plantes", "Plantes"],
  ["autre", "Autre"],
] as const;

export const JOURS = [
  ["lundi", "Lundi"],
  ["mardi", "Mardi"],
  ["mercredi", "Mercredi"],
  ["jeudi", "Jeudi"],
  ["vendredi", "Vendredi"],
  ["samedi", "Samedi"],
  ["dimanche", "Dimanche"],
] as const;

export const MOIS = [
  [1, "Janv."],
  [2, "Févr."],
  [3, "Mars"],
  [4, "Avr."],
  [5, "Mai"],
  [6, "Juin"],
  [7, "Juil."],
  [8, "Août"],
  [9, "Sept."],
  [10, "Oct."],
  [11, "Nov."],
  [12, "Déc."],
] as const;

export const MODES = [
  ["ferme", "À la ferme"],
  ["marche", "Marché"],
  ["amap", "AMAP"],
  ["livraison", "Livraison"],
  ["drive", "Drive"],
] as const;

export const PAIEMENTS = [
  ["especes", "Espèces"],
  ["carte", "Carte"],
  ["cheque", "Chèque"],
  ["virement", "Virement"],
] as const;

export const LIENS = [
  ["site", "Site"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["autre", "Autre lien"],
] as const;

export type Categorie = (typeof CATEGORIES)[number][0];
export type Jour = (typeof JOURS)[number][0];
export type Mode = (typeof MODES)[number][0];
export type Paiement = (typeof PAIEMENTS)[number][0];
export type LienCle = (typeof LIENS)[number][0];

export type CleLot1 =
  | "presentation"
  | "offres"
  | "modes"
  | "points"
  | "horaires"
  | "paiements"
  | "labels"
  | "telephone"
  | "email"
  | "contactPro"
  | "lienSite"
  | "lienInstagram"
  | "lienFacebook"
  | "lienAutre";

export type ErreursLot1 = Partial<Record<CleLot1, string>>;

export type OffreSaisie = {
  categorie: string;
  nom: string;
  mois: string[];
};

export type PointSaisi = {
  nom: string;
  commune: string;
  jour: string;
  horaires: string;
};

export type ChampsLot1 = {
  presentation: string;
  offres: OffreSaisie[];
  modes: string[];
  points: PointSaisi[];
  jours: Record<Jour, { debut: string; fin: string }>;
  surRendezVous: boolean;
  paiements: string[];
  labels: string;
  telephone: string;
  email: string;
  afficherContact: boolean;
  site: string;
  instagram: string;
  facebook: string;
  autre: string;
};

export type Offre = {
  categorie: Categorie;
  nom: string;
  mois: number[];
};

export type PointVente = {
  nom: string;
  commune: string;
  jour: Jour;
  horaires: string;
};

export type Lot1Valeur = {
  presentation: string | null;
  offres: Offre[];
  modes: Mode[];
  points: PointVente[];
  horaires: {
    surRendezVous: boolean;
    jours: Partial<Record<Jour, { debut: string; fin: string }>>;
  };
  paiements: Paiement[];
  labels: string[];
  telephone: string | null;
  email: string | null;
  afficher: boolean;
  liens: Partial<Record<LienCle, string>>;
};

const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

const CATEGORIE_IDS = new Set<string>(CATEGORIES.map(([id]) => id));
const JOUR_IDS = new Set<string>(JOURS.map(([id]) => id));
const MODE_IDS = new Set<string>(MODES.map(([id]) => id));
const PAIEMENT_IDS = new Set<string>(PAIEMENTS.map(([id]) => id));

function nettoyer(valeur: string): string {
  return valeur.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function joursVides(): Record<Jour, { debut: string; fin: string }> {
  return {
    lundi: { debut: "", fin: "" },
    mardi: { debut: "", fin: "" },
    mercredi: { debut: "", fin: "" },
    jeudi: { debut: "", fin: "" },
    vendredi: { debut: "", fin: "" },
    samedi: { debut: "", fin: "" },
    dimanche: { debut: "", fin: "" },
  };
}

export function creerLot1Vide(): ChampsLot1 {
  return {
    presentation: "",
    offres: [],
    modes: [],
    points: [],
    jours: joursVides(),
    surRendezVous: false,
    paiements: [],
    labels: "",
    telephone: "",
    email: "",
    afficherContact: false,
    site: "",
    instagram: "",
    facebook: "",
    autre: "",
  };
}

export function emailProValide(valeur: string): boolean {
  return valeur.length <= 254 && EMAIL.test(valeur);
}

export function telephoneProValide(valeur: string): boolean {
  const compact = valeur.replace(/[\s.\-]/g, "");
  return /^(?:\+33|0033|0)[1-9]\d{8}$/.test(compact);
}

export function urlHttpValide(valeur: string): boolean {
  if (valeur.length > 300 || /\s/.test(valeur)) return false;
  try {
    const url = new URL(valeur);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password || url.port) return false;
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

function lireChamp(formData: FormData, nom: string, max: number): string {
  const valeur = formData.get(nom);
  if (typeof valeur !== "string") return "";
  return valeur.slice(0, max);
}

function lireListe(formData: FormData, nom: string, max: number): string[] {
  return formData
    .getAll(nom)
    .flatMap((valeur) => (typeof valeur === "string" ? [valeur.slice(0, max)] : []));
}

export function champsLot1DepuisFormulaire(formData: FormData): ChampsLot1 {
  const jours = joursVides();
  for (const [jour] of JOURS) {
    jours[jour] = {
      debut: lireChamp(formData, `horaire-${jour}-debut`, 8),
      fin: lireChamp(formData, `horaire-${jour}-fin`, 8),
    };
  }
  const offres: OffreSaisie[] = [];
  for (let i = 0; i < 13; i += 1) {
    const nom = lireChamp(formData, `offre-nom-${i}`, 80);
    const categorie = lireChamp(formData, `offre-categorie-${i}`, 40);
    const mois = lireListe(formData, `offre-mois-${i}`, 2);
    if (!nom && !categorie && mois.length === 0) continue;
    offres.push({ nom, categorie, mois });
  }
  const points: PointSaisi[] = [];
  for (let i = 0; i < 13; i += 1) {
    const nom = lireChamp(formData, `point-nom-${i}`, 120);
    const commune = lireChamp(formData, `point-commune-${i}`, 120);
    const jour = lireChamp(formData, `point-jour-${i}`, 20);
    const horaires = lireChamp(formData, `point-horaires-${i}`, 120);
    if (!nom && !commune && !jour && !horaires) continue;
    points.push({ nom, commune, jour, horaires });
  }
  return {
    presentation: lireChamp(formData, "presentation", 400),
    offres,
    modes: lireListe(formData, "mode", 20),
    points,
    jours,
    surRendezVous: formData.get("sur-rendezvous") === "oui",
    paiements: lireListe(formData, "paiement", 20),
    labels: lireChamp(formData, "labels", 800),
    telephone: lireChamp(formData, "telephone", 40),
    email: lireChamp(formData, "email-pro", 320),
    afficherContact: formData.get("afficher-contact") === "oui",
    site: lireChamp(formData, "lien-site", 400),
    instagram: lireChamp(formData, "lien-instagram", 400),
    facebook: lireChamp(formData, "lien-facebook", 400),
    autre: lireChamp(formData, "lien-autre", 400),
  };
}

function choix<T extends string>(
  recus: string[],
  ids: Set<string>,
  ordre: readonly T[],
): { ok: true; valeurs: T[] } | { ok: false } {
  const gardes = new Set<string>();
  for (const recu of recus) {
    const valeur = recu.trim();
    if (!valeur) continue;
    if (!ids.has(valeur)) return { ok: false };
    gardes.add(valeur);
  }
  return { ok: true, valeurs: ordre.filter((id) => gardes.has(id)) };
}

function heureNormale(valeur: string): string | null {
  const texte = valeur.trim();
  if (!texte) return "";
  const court = texte.length === 8 && texte.endsWith(":00") ? texte.slice(0, 5) : texte;
  if (!HEURE.test(court)) return null;
  return court;
}

export function validerLot1(
  champs: ChampsLot1,
): { ok: true; valeur: Lot1Valeur } | { ok: false; erreurs: ErreursLot1 } {
  const erreurs: ErreursLot1 = {};
  const presentationBrute = nettoyer(champs.presentation).replace(/\s+/g, " ");
  let presentation: string | null = null;
  if (presentationBrute.length > 280) {
    erreurs.presentation = "Présentation : 280 caractères maximum.";
  } else if (presentationBrute) {
    presentation = presentationBrute;
  }

  const offres: Offre[] = [];
  for (const saisie of champs.offres) {
    const nom = nettoyer(saisie.nom).replace(/\s+/g, " ");
    const categorie = saisie.categorie.trim();
    const mois = [
      ...new Set(
        saisie.mois
          .map((moisSaisi) => Number(moisSaisi))
          .filter((moisNombre) => Number.isInteger(moisNombre)),
      ),
    ].sort((a, b) => a - b);
    if (!nom && !categorie && mois.length === 0) continue;
    if (!CATEGORIE_IDS.has(categorie) || !nom || mois.length === 0 || mois.some((m) => m < 1 || m > 12)) {
      erreurs.offres =
        "Produits par catégorie : indiquez la catégorie, le nom et au moins un mois.";
      break;
    }
    if (nom.length > 40) {
      erreurs.offres = "Produits par catégorie : chaque nom tient en 40 caractères.";
      break;
    }
    offres.push({ categorie: categorie as Categorie, nom, mois });
  }
  if (!erreurs.offres && offres.length > 12) {
    erreurs.offres = "Produits par catégorie : 12 produits maximum.";
  }

  const modesChoisis = choix(champs.modes, MODE_IDS, MODES.map(([id]) => id));
  if (!modesChoisis.ok) erreurs.modes = "Modes de vente : choix inconnu.";

  const points: PointVente[] = [];
  for (const saisie of champs.points) {
    const nom = nettoyer(saisie.nom).replace(/\s+/g, " ");
    const commune = nettoyer(saisie.commune).replace(/\s+/g, " ");
    const jour = saisie.jour.trim();
    const horaires = nettoyer(saisie.horaires).replace(/\s+/g, " ");
    if (!nom && !commune && !jour && !horaires) continue;
    if (!nom || nom.length < 2 || nom.length > 80 || !commune || commune.length < 2 || commune.length > 80) {
      erreurs.points =
        "Points de vente : indiquez le nom, la commune, le jour et les horaires.";
      break;
    }
    if (!JOUR_IDS.has(jour) || !horaires || horaires.length > 80) {
      erreurs.points =
        "Points de vente : indiquez le nom, la commune, le jour et les horaires.";
      break;
    }
    points.push({ nom, commune, jour: jour as Jour, horaires });
  }
  if (!erreurs.points && points.length > 12) {
    erreurs.points = "Points de vente : 12 points maximum.";
  }

  const jours: Partial<Record<Jour, { debut: string; fin: string }>> = {};
  for (const [jour] of JOURS) {
    const debut = heureNormale(champs.jours[jour]?.debut ?? "");
    const fin = heureNormale(champs.jours[jour]?.fin ?? "");
    if (debut === null || fin === null) {
      erreurs.horaires = "Horaires : indiquez une heure de début et de fin valides.";
      break;
    }
    if (!debut && !fin) continue;
    if (!debut || !fin || debut >= fin) {
      erreurs.horaires =
        "Horaires : indiquez une heure de début et de fin, la fin après le début.";
      break;
    }
    jours[jour] = { debut, fin };
  }

  const paiementsChoisis = choix(
    champs.paiements,
    PAIEMENT_IDS,
    PAIEMENTS.map(([id]) => id),
  );
  if (!paiementsChoisis.ok) erreurs.paiements = "Moyens de paiement : choix inconnu.";

  const labels: string[] = [];
  const labelsVus = new Set<string>();
  if (champs.labels.length > 500) {
    erreurs.labels = "Labels : la liste est trop longue.";
  } else {
    for (const morceau of champs.labels.split(/[,;\n]/)) {
      const label = nettoyer(morceau).replace(/\s+/g, " ");
      if (!label) continue;
      if (label.length > 40) {
        erreurs.labels = "Labels : chaque label tient en 40 caractères.";
        break;
      }
      const cle = plier(label);
      if (labelsVus.has(cle)) continue;
      labelsVus.add(cle);
      labels.push(label);
    }
    if (!erreurs.labels && labels.length > 12) {
      erreurs.labels = "Labels : 12 labels maximum.";
    }
  }

  const telephone = nettoyer(champs.telephone).replace(/\s+/g, " ");
  const email = nettoyer(champs.email).toLowerCase();
  let telephoneValeur: string | null = null;
  let emailValeur: string | null = null;
  if (telephone) {
    if (!telephoneProValide(telephone)) {
      erreurs.telephone = "Téléphone : indiquez un téléphone français.";
    } else {
      telephoneValeur = telephone;
    }
  }
  if (email) {
    if (!emailProValide(email)) {
      erreurs.email = "E-mail : indiquez une adresse électronique.";
    } else {
      emailValeur = email;
    }
  }
  if (champs.afficherContact && !telephoneValeur && !emailValeur && !erreurs.telephone && !erreurs.email) {
    erreurs.contactPro =
      "Contact : renseignez un téléphone ou un e-mail avant de l'afficher.";
  }

  const liensSaisis: Record<LienCle, string> = {
    site: champs.site,
    instagram: champs.instagram,
    facebook: champs.facebook,
    autre: champs.autre,
  };
  const liens: Partial<Record<LienCle, string>> = {};
  const messagesLiens: Record<LienCle, { cle: CleLot1; texte: string }> = {
    site: { cle: "lienSite", texte: "Site : indiquez une adresse http:// ou https://." },
    instagram: {
      cle: "lienInstagram",
      texte: "Instagram : indiquez une adresse http:// ou https://.",
    },
    facebook: {
      cle: "lienFacebook",
      texte: "Facebook : indiquez une adresse http:// ou https://.",
    },
    autre: {
      cle: "lienAutre",
      texte: "Autre lien : indiquez une adresse http:// ou https://.",
    },
  };
  for (const [cle, brut] of Object.entries(liensSaisis) as [LienCle, string][]) {
    const url = nettoyer(brut);
    if (!url) continue;
    if (!urlHttpValide(url)) erreurs[messagesLiens[cle].cle] = messagesLiens[cle].texte;
    else liens[cle] = url;
  }

  if (Object.keys(erreurs).length > 0 || !modesChoisis.ok || !paiementsChoisis.ok) {
    return { ok: false, erreurs };
  }
  return {
    ok: true,
    valeur: {
      presentation,
      offres,
      modes: modesChoisis.valeurs,
      points,
      horaires: { surRendezVous: champs.surRendezVous, jours },
      paiements: paiementsChoisis.valeurs,
      labels,
      telephone: telephoneValeur,
      email: emailValeur,
      afficher: champs.afficherContact && Boolean(telephoneValeur || emailValeur),
      liens,
    },
  };
}

export function colonnesLot1(valeur: Lot1Valeur): {
  presentation: string | null;
  offres: Offre[];
  modes_vente: Mode[];
  points_vente: PointVente[];
  horaires_ferme: {
    sur_rendezvous: boolean;
    jours: Partial<Record<Jour, { debut: string; fin: string }>>;
  };
  paiements: Paiement[];
  labels: string[];
  liens: Partial<Record<LienCle, string>>;
} {
  return {
    presentation: valeur.presentation,
    offres: valeur.offres,
    modes_vente: valeur.modes,
    points_vente: valeur.points,
    horaires_ferme: {
      sur_rendezvous: valeur.horaires.surRendezVous,
      jours: valeur.horaires.jours,
    },
    paiements: valeur.paiements,
    labels: valeur.labels,
    liens: valeur.liens,
  };
}

export function ligneContact(valeur: Lot1Valeur): {
  telephone: string | null;
  email: string | null;
  afficher: boolean;
} | null {
  if (!valeur.telephone && !valeur.email) return null;
  return {
    telephone: valeur.telephone,
    email: valeur.email,
    afficher: valeur.afficher,
  };
}

function texte(valeur: unknown): string {
  return typeof valeur === "string" ? valeur : "";
}

export function champsLot1DepuisStock(entree: {
  presentation: string | null;
  offres: unknown;
  modes_vente: string[] | null;
  points_vente: unknown;
  horaires_ferme: unknown;
  paiements: string[] | null;
  labels: string[] | null;
  liens: unknown;
  telephone: string | null;
  email: string | null;
  afficher: boolean | null;
}): ChampsLot1 {
  const jours = joursVides();
  const horaires =
    entree.horaires_ferme && typeof entree.horaires_ferme === "object"
      ? (entree.horaires_ferme as { sur_rendezvous?: unknown; jours?: unknown })
      : {};
  const joursStock =
    horaires.jours && typeof horaires.jours === "object"
      ? (horaires.jours as Record<string, { debut?: unknown; fin?: unknown }>)
      : {};
  for (const [jour] of JOURS) {
    const creneau = joursStock[jour];
    jours[jour] = {
      debut: texte(creneau?.debut),
      fin: texte(creneau?.fin),
    };
  }
  const liens =
    entree.liens && typeof entree.liens === "object"
      ? (entree.liens as Record<string, unknown>)
      : {};
  const offres = Array.isArray(entree.offres)
    ? entree.offres.map((item) => {
        const offre = item as { categorie?: unknown; nom?: unknown; mois?: unknown };
        return {
          categorie: texte(offre.categorie),
          nom: texte(offre.nom),
          mois: Array.isArray(offre.mois) ? offre.mois.map((mois) => String(mois)) : [],
        };
      })
    : [];
  const points = Array.isArray(entree.points_vente)
    ? entree.points_vente.map((item) => {
        const point = item as {
          nom?: unknown;
          commune?: unknown;
          jour?: unknown;
          horaires?: unknown;
        };
        return {
          nom: texte(point.nom),
          commune: texte(point.commune),
          jour: texte(point.jour),
          horaires: texte(point.horaires),
        };
      })
    : [];
  return {
    presentation: entree.presentation ?? "",
    offres,
    modes: entree.modes_vente ?? [],
    points,
    jours,
    surRendezVous: horaires.sur_rendezvous === true,
    paiements: entree.paiements ?? [],
    labels: (entree.labels ?? []).join(", "),
    telephone: entree.telephone ?? "",
    email: entree.email ?? "",
    afficherContact: entree.afficher === true,
    site: texte(liens.site),
    instagram: texte(liens.instagram),
    facebook: texte(liens.facebook),
    autre: texte(liens.autre),
  };
}

export function detailVide(): Lot1Valeur {
  return {
    presentation: null,
    offres: [],
    modes: [],
    points: [],
    horaires: { surRendezVous: false, jours: {} },
    paiements: [],
    labels: [],
    telephone: null,
    email: null,
    afficher: false,
    liens: {},
  };
}

export function detailDepuisStockPublic(entree: {
  presentation: string | null;
  offres: unknown;
  modes_vente: string[] | null;
  points_vente: unknown;
  horaires_ferme: unknown;
  paiements: string[] | null;
  labels: string[] | null;
  liens: unknown;
}): Lot1Valeur {
  const champs = champsLot1DepuisStock({
    presentation: entree.presentation,
    offres: entree.offres,
    modes_vente: entree.modes_vente,
    points_vente: entree.points_vente,
    horaires_ferme: entree.horaires_ferme,
    paiements: entree.paiements,
    labels: entree.labels,
    liens: entree.liens,
    telephone: null,
    email: null,
    afficher: false,
  });
  const resultat = validerLot1(champs);
  return resultat.ok ? resultat.valeur : detailVide();
}

export function htmlObfusque(texte: string): string {
  return [...texte].map((caractere) => `&#${caractere.codePointAt(0)};`).join("");
}

const NOMS_MOIS = [
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

export function libelleMois(mois: number[]): string {
  return mois
    .filter((numero) => numero >= 1 && numero <= 12)
    .map((numero) => NOMS_MOIS[numero - 1])
    .join(", ");
}

export function libelleDe(liste: readonly (readonly [string, string])[], id: string): string {
  return liste.find(([cle]) => cle === id)?.[1] ?? id;
}

export function libelleMiseAJour(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const jour = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Europe/Paris",
  }).format(date);
  return `Dernière mise à jour : ${jour}.`;
}
