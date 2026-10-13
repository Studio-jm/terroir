"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  erreurEmail,
  erreurMotDePasse,
  etatCompteInitial,
  normaliserEmail,
  type EtatCompte,
} from "@/lib/etat-compte";
import { origineDepuis } from "@/lib/origine";
import { piegeRempli } from "@/lib/piege";
import { MESSAGE_SUPABASE_MANQUANT } from "@/lib/supabase/env";
import { creerClientServeur } from "@/lib/supabase/server";

function texte(formData: FormData, nom: string): string {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur : "";
}

function messageSupabase(message: string): string {
  const texteNormalise = message.toLowerCase();
  if (texteNormalise.includes("invalid login credentials")) {
    return "Adresse ou mot de passe incorrect.";
  }
  if (texteNormalise.includes("email not confirmed")) {
    return "Confirmez votre adresse via le lien reçu par e-mail.";
  }
  if (texteNormalise.includes("user already registered")) {
    return "Un compte existe déjà pour cette adresse. Connectez-vous.";
  }
  if (texteNormalise.includes("password")) {
    return "Le mot de passe n'est pas accepté. Utilisez au moins 8 caractères.";
  }
  if (texteNormalise.includes("rate limit") || texteNormalise.includes("too many")) {
    return "Trop de tentatives. Réessayez dans un instant.";
  }
  if (
    texteNormalise.includes("email address") &&
    texteNormalise.includes("invalid")
  ) {
    return "Cette adresse e-mail n'est pas acceptée. Utilisez une adresse réelle, pas example.com.";
  }
  return "La demande n'a pas abouti. Réessayez.";
}

export async function inscrire(
  _etat: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  const emailBrut = texte(formData, "email").slice(0, 254);
  const motDePasse = texte(formData, "mot_de_passe");
  const confirmation = texte(formData, "confirmation");
  const valeurs = { email: emailBrut };
  if (piegeRempli(formData)) {
    return {
      erreurs: {},
      valeurs,
      message:
        "Si cette adresse peut être utilisée, un e-mail de confirmation a été envoyé.",
    };
  }

  const emailErreur = erreurEmail(emailBrut);
  const motDePasseErreur = erreurMotDePasse(motDePasse);
  const confirmationErreur =
    confirmation !== motDePasse ? "Les deux mots de passe ne correspondent pas." : null;
  if (emailErreur || motDePasseErreur || confirmationErreur) {
    return {
      erreurs: {
        email: emailErreur ?? undefined,
        motDePasse: motDePasseErreur ?? undefined,
        confirmation: confirmationErreur ?? undefined,
      },
      valeurs,
      message: "",
    };
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    return {
      ...etatCompteInitial,
      valeurs,
      erreurs: { formulaire: MESSAGE_SUPABASE_MANQUANT },
    };
  }

  const origine = origineDepuis(await headers());
  const { data, error } = await supabase.auth.signUp({
    email: normaliserEmail(emailBrut),
    password: motDePasse,
    options: { emailRedirectTo: `${origine}/auth/callback` },
  });
  if (error) {
    return {
      erreurs: { formulaire: messageSupabase(error.message) },
      valeurs,
      message: "",
    };
  }
  if (data.session) redirect("/espace");
  return {
    erreurs: {},
    valeurs,
    message:
      "Un e-mail de confirmation a été envoyé. Ouvrez le lien pour activer le compte.",
  };
}

export async function connecter(
  _etat: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  const emailBrut = texte(formData, "email").slice(0, 254);
  const motDePasse = texte(formData, "mot_de_passe");
  const valeurs = { email: emailBrut };
  if (piegeRempli(formData)) {
    return {
      erreurs: { formulaire: "Adresse ou mot de passe incorrect." },
      valeurs,
      message: "",
    };
  }

  const emailErreur = erreurEmail(emailBrut);
  const motDePasseErreur = motDePasse ? null : "Indiquez un mot de passe.";
  if (emailErreur || motDePasseErreur) {
    return {
      erreurs: {
        email: emailErreur ?? undefined,
        motDePasse: motDePasseErreur ?? undefined,
      },
      valeurs,
      message: "",
    };
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    return {
      ...etatCompteInitial,
      valeurs,
      erreurs: { formulaire: MESSAGE_SUPABASE_MANQUANT },
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: normaliserEmail(emailBrut),
    password: motDePasse,
  });
  if (error) {
    return {
      erreurs: { formulaire: messageSupabase(error.message) },
      valeurs,
      message: "",
    };
  }
  redirect("/espace");
}
