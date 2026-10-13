import "server-only";

import { randomBytes } from "node:crypto";
import { envoyerLien } from "@/lib/mail";
import { authConfiguree } from "@/lib/session-token";
import {
  getStore,
  hashJeton,
  messageStockageIndisponible,
  type ButLien,
} from "@/lib/store";
import {
  MESSAGES_LIEN,
  type CodeLien,
  type EtatCompte,
} from "@/lib/etat-compte";

const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const MESSAGE_LIEN =
  "Un lien de connexion a été envoyé à cette adresse. Il expire dans 20 minutes.";

export function codeConfiguration(): CodeLien | null {
  if (!authConfiguree()) return "config";
  if (messageStockageIndisponible()) return "stockage";
  return null;
}

export function messageConfiguration(): string | null {
  const code = codeConfiguration();
  return code ? MESSAGES_LIEN[code] : null;
}

function normaliserEmail(valeur: string): string {
  return valeur.trim().toLowerCase();
}

function erreurEmail(brut: string): string | null {
  const email = normaliserEmail(brut);
  if (!email) return "Indiquez votre adresse e-mail.";
  if (email.length > 254 || brut.length > 254) {
    return "Cette adresse e-mail est trop longue.";
  }
  if (!EMAIL.test(email)) return "Indiquez une adresse e-mail valide.";
  return null;
}

export async function demanderLien(input: {
  emailBrut: string;
  piege: string;
  but: ButLien;
  origine: string;
}): Promise<EtatCompte> {
  const valeurs = { email: input.emailBrut.slice(0, 254) };
  if (input.piege.trim()) {
    return { erreurs: {}, valeurs, message: MESSAGE_LIEN, lienDev: "" };
  }

  const erreur = erreurEmail(input.emailBrut);
  if (erreur) return { erreurs: { email: erreur }, valeurs, message: "", lienDev: "" };

  const config = messageConfiguration();
  if (config) {
    return { erreurs: { formulaire: config }, valeurs, message: "", lienDev: "" };
  }

  const email = normaliserEmail(input.emailBrut);
  const store = getStore();
  const existant = await store.getUserByEmail(email);
  if (input.but === "inscription" && existant) {
    return {
      erreurs: {
        email: "Un compte existe déjà pour cette adresse. Connectez-vous.",
      },
      valeurs,
      message: "",
      lienDev: "",
    };
  }
  if (input.but === "connexion" && !existant) {
    return {
      erreurs: {
        email: "Aucun compte ne correspond à cette adresse. Inscrivez-vous.",
      },
      valeurs,
      message: "",
      lienDev: "",
    };
  }

  if (input.but === "inscription") {
    const inscriptions = await store.countUsersSince(
      new Date(Date.now() - 60 * 60 * 1000),
    );
    if (inscriptions >= 30) {
      return {
        erreurs: {
          formulaire:
            "Trop d'inscriptions pour le moment. Réessayez plus tard.",
        },
        valeurs,
        message: "",
        lienDev: "",
      };
    }
  }

  if (await store.lienRecent(email, new Date(Date.now() - 30 * 1000))) {
    return {
      erreurs: {
        formulaire:
          "Un lien vient d'être envoyé. Patientez trente secondes avant d'en redemander un.",
      },
      valeurs,
      message: "",
      lienDev: "",
    };
  }

  const token = randomBytes(32).toString("base64url");
  const maintenant = new Date();
  await store.saveMagicLink({
    tokenHash: hashJeton(token),
    email,
    purpose: input.but,
    createdAt: maintenant.toISOString(),
    expiresAt: new Date(maintenant.getTime() + 20 * 60 * 1000).toISOString(),
  });

  const url = `${input.origine}/connexion/verifier?token=${encodeURIComponent(token)}`;
  const envoi = await envoyerLien(email, url);
  if (!envoi.ok) {
    await store.consumeMagicLink(hashJeton(token));
    return {
      erreurs: { formulaire: envoi.message },
      valeurs,
      message: "",
      lienDev: "",
    };
  }

  return { erreurs: {}, valeurs, message: MESSAGE_LIEN, lienDev: envoi.lienDev };
}

export async function consommerLien(
  token: string,
): Promise<{ ok: true; userId: string } | { ok: false; code: CodeLien }> {
  const config = codeConfiguration();
  if (config) return { ok: false, code: config };
  if (!token || token.length > 200) return { ok: false, code: "invalide" };

  const store = getStore();
  const lien = await store.consumeMagicLink(hashJeton(token));
  if (!lien || Date.parse(lien.expiresAt) < Date.now()) {
    return { ok: false, code: "invalide" };
  }

  let user = await store.getUserByEmail(lien.email);
  if (!user && lien.purpose === "inscription") {
    user = await store.createUser(lien.email);
  }
  if (!user) return { ok: false, code: "compte" };
  return { ok: true, userId: user.id };
}
