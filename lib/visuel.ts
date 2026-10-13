export type CreditPhoto = {
  src: string;
  alt: string;
  auteur: string;
  profil: string;
  page: string;
  licence: "Unsplash License";
};

export type Etape = {
  titre: string;
  texte: string;
};

const utm = "utm_source=terroir&utm_medium=referral";

function lien(url: string): string {
  return `${url}?${utm}`;
}

export const photoBandeau: CreditPhoto = {
  src: "/photos/champ-ble.jpg",
  alt: "Champ de blé mûr au soleil, avec un arbre et des collines.",
  auteur: "Federico Respini",
  profil: lien("https://unsplash.com/@federicorespini"),
  page: "https://unsplash.com/photos/brown-field-near-tree-during-daytime-sYffw0LNr7s",
  licence: "Unsplash License",
};

const photosParSlug: Record<string, CreditPhoto> = {
  "ferme-du-serre": {
    src: "/photos/chevres.jpg",
    alt: "Chèvre blanche au collier, dans l'herbe.",
    auteur: "Nandhu Kumar",
    profil: lien("https://unsplash.com/@nandhukumarndd"),
    page: "https://unsplash.com/photos/selective-focus-photography-of-white-goat-jAMcUbsTvWE",
    licence: "Unsplash License",
  },
  "ferme-des-nuages": {
    src: "/photos/brebis.jpg",
    alt: "Troupeau de moutons blancs au pré, sous un ciel bleu.",
    auteur: "Sam Carter",
    profil: lien("https://unsplash.com/@samdc"),
    page: "https://unsplash.com/photos/white-sheep-on-green-grass-during-daytime-GHOiyov2TSQ",
    licence: "Unsplash License",
  },
  "rucher-de-nulle-part": {
    src: "/photos/miel.jpg",
    alt: "Bocal de miel avec un rayon et une cuillère en bois.",
    auteur: "Art Rachen",
    profil: lien("https://unsplash.com/@artrachen"),
    page: "https://unsplash.com/photos/izi5AnlbRIA",
    licence: "Unsplash License",
  },
};

export function photoPour(slug: string): CreditPhoto {
  return photosParSlug[slug] ?? photoBandeau;
}

export function creditsPhotos(): CreditPhoto[] {
  return [photoBandeau, ...Object.values(photosParSlug)];
}

export const etapes: readonly Etape[] = [
  {
    titre: "Chercher",
    texte: "Un nom, une commune ou un produit suffit.",
  },
  {
    titre: "Ouvrir la fiche",
    texte: "La commune et les produits sont sur la carte.",
  },
  {
    titre: "Aller au marché",
    texte: "La fiche indique la ferme ou le jour de marché.",
  },
];
