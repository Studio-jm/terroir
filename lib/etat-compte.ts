export type EtatCompte = {
  erreurs: { email?: string; motDePasse?: string; confirmation?: string; formulaire?: string };
  valeurs: { email: string };
  message: string;
};

export const etatCompteInitial: EtatCompte = {
  erreurs: {},
  valeurs: { email: "" },
  message: "",
};

export const MESSAGES_CONNEXION = {
  lien: "Ce lien de confirmation est invalide ou a expiré. Demandez-en un nouveau en vous inscrivant à nouveau, ou connectez-vous.",
  config: "Les comptes ne sont pas configurés.",
} as const;

const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normaliserEmail(valeur: string): string {
  return valeur.trim().toLowerCase();
}

export function erreurEmail(brut: string): string | null {
  const email = normaliserEmail(brut);
  if (!email) return "Indiquez votre adresse e-mail.";
  if (email.length > 254) return "Cette adresse e-mail est trop longue.";
  if (!EMAIL.test(email)) return "Indiquez une adresse e-mail valide.";
  return null;
}

export function erreurMotDePasse(brut: string): string | null {
  if (!brut) return "Indiquez un mot de passe.";
  if (brut.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (brut.length > 72) return "Le mot de passe ne peut pas dépasser 72 caractères.";
  return null;
}
