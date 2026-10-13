export type EtatCompte = {
  erreurs: { email?: string; formulaire?: string };
  valeurs: { email: string };
  message: string;
  lienDev: string;
};

export const etatCompteInitial: EtatCompte = {
  erreurs: {},
  valeurs: { email: "" },
  message: "",
  lienDev: "",
};

export const MESSAGES_LIEN = {
  invalide: "Ce lien est invalide ou a expiré. Demandez-en un nouveau.",
  config:
    "L'authentification n'est pas configurée. Ajoutez AUTH_SECRET sur Vercel.",
  stockage:
    "Le stockage n'est pas configuré. Ajoutez DATABASE_URL (Neon Postgres) sur Vercel.",
  compte: "Aucun compte ne correspond à ce lien. Inscrivez-vous.",
  erreur: "Une erreur est survenue. Demandez un nouveau lien.",
} as const;

export type CodeLien = keyof typeof MESSAGES_LIEN;
