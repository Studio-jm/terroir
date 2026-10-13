import type { Exploitation, LiensSoutien } from "./exploitation";
import { plier } from "./recherche";

export type ChampsFiche = {
  nom: string;
  commune: string;
  produits: string;
  contact: string;
  description: string;
};

export type FicheSaisie = {
  nom: string;
  commune: string;
  produits: string[];
  contact: string;
  description: string;
};

export type ErreursFiche = Partial<
  Record<keyof ChampsFiche | "formulaire", string>
>;

const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function nettoyer(valeur: string): string {
  return valeur
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export function emailContactValide(valeur: string): boolean {
  return valeur.length <= 254 && EMAIL.test(valeur);
}

export function telephoneContactValide(valeur: string): boolean {
  const compact = valeur.replace(/[\s.\-]/g, "");
  return /^(?:\+33|0033|0)[1-9]\d{8}$/.test(compact);
}

export function urlContactValide(valeur: string): boolean {
  try {
    const url = new URL(valeur);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function contactValide(valeur: string): boolean {
  return (
    emailContactValide(valeur) ||
    telephoneContactValide(valeur) ||
    urlContactValide(valeur)
  );
}

/** Lien sûr à afficher, ou null si le texte doit rester du texte brut. */
export function lienContact(contact: string): string | null {
  if (emailContactValide(contact)) return `mailto:${contact}`;
  if (telephoneContactValide(contact)) {
    const compact = contact.replace(/[^\d+]/g, "");
    return `tel:${compact.startsWith("00") ? `+${compact.slice(2)}` : compact}`;
  }
  if (urlContactValide(contact)) return contact;
  return null;
}

export function slugDeNom(nom: string, pris: Iterable<string>): string {
  const base =
    nom
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "exploitation";
  const occupe = new Set(pris);
  if (!occupe.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidat = `${base}-${i}`;
    if (!occupe.has(candidat)) return candidat;
  }
  return `${base}-${Date.now()}`;
}

export function deciderEnregistrement(input: {
  slugDemande: string;
  slugPropre: string | null;
  cibleEstSienne: boolean;
}): "creer" | "modifier" | "refus" {
  const slug = input.slugDemande.trim();
  if (slug && !input.cibleEstSienne) return "refus";
  if (input.slugPropre) {
    if (slug && slug !== input.slugPropre) return "refus";
    return "modifier";
  }
  if (slug) return "refus";
  return "creer";
}

export function validerFiche(
  champs: ChampsFiche,
): { ok: true; valeur: FicheSaisie } | { ok: false; erreurs: ErreursFiche } {
  const erreurs: ErreursFiche = {};
  const nom = nettoyer(champs.nom).replace(/\s+/g, " ");
  const commune = nettoyer(champs.commune).replace(/\s+/g, " ");
  const contact = nettoyer(champs.contact).replace(/\s+/g, " ");
  const description = nettoyer(champs.description);

  if (!nom) erreurs.nom = "Indiquez le nom de l'exploitation.";
  else if (nom.length < 2)
    erreurs.nom = "Le nom doit contenir au moins 2 caractères.";
  else if (nom.length > 80)
    erreurs.nom = "Le nom ne peut pas dépasser 80 caractères.";

  if (!commune) erreurs.commune = "Indiquez la commune.";
  else if (commune.length < 2)
    erreurs.commune = "La commune doit contenir au moins 2 caractères.";
  else if (commune.length > 80)
    erreurs.commune = "La commune ne peut pas dépasser 80 caractères.";

  const produits = lireProduits(champs.produits, erreurs);

  if (!contact) erreurs.contact = "Indiquez un moyen de contact.";
  else if (contact.length > 200)
    erreurs.contact = "Le contact ne peut pas dépasser 200 caractères.";
  else if (!contactValide(contact)) {
    erreurs.contact =
      "Le contact doit être un e-mail, un numéro de téléphone français ou une adresse web (http ou https).";
  }

  if (!description) erreurs.description = "Décrivez l'exploitation.";
  else if (description.length < 20) {
    erreurs.description =
      "La description doit contenir au moins 20 caractères.";
  } else if (description.length > 2000) {
    erreurs.description = "La description ne peut pas dépasser 2000 caractères.";
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };
  return {
    ok: true,
    valeur: { nom, commune, produits, contact, description },
  };
}

function lireProduits(brut: string, erreurs: ErreursFiche): string[] {
  if (brut.length > 500) {
    erreurs.produits = "La liste des produits est trop longue.";
    return [];
  }
  const vus = new Set<string>();
  const produits: string[] = [];
  for (const morceau of brut.split(/[,;\n]/)) {
    const produit = nettoyer(morceau).replace(/\s+/g, " ");
    if (!produit) continue;
    if (produit.length > 40) {
      erreurs.produits = "Chaque produit doit tenir en 40 caractères.";
      return [];
    }
    const cle = plier(produit);
    if (vus.has(cle)) continue;
    vus.add(cle);
    produits.push(produit);
  }
  if (!erreurs.produits && produits.length === 0) {
    erreurs.produits = "Indiquez au moins un produit.";
  } else if (produits.length > 12) {
    erreurs.produits = "Indiquez 12 produits au maximum.";
  }
  return produits;
}

export function ficheVersExploitation(fiche: {
  nom: string;
  slug: string;
  description: string;
  produits: string[];
  commune: string;
  contact: string;
}): Exploitation {
  const liensSoutien: LiensSoutien = {};
  return {
    nom: fiche.nom,
    slug: fiche.slug,
    histoire: fiche.description,
    produits: fiche.produits,
    lieux: [{ label: fiche.commune }],
    geo: { address: fiche.commune },
    departement: "",
    region: "",
    liensSoutien,
    commune: fiche.commune,
    contact: fiche.contact,
  };
}
