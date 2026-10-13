"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consommerLien, demanderLien } from "@/lib/compte";
import {
  etatCompteInitial,
  type CodeLien,
  type EtatCompte,
} from "@/lib/etat-compte";
import { origineDepuis } from "@/lib/origine";
import { fermerSession, ouvrirSession } from "@/lib/session";

function texte(formData: FormData, nom: string): string {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur : "";
}

async function demander(
  but: "inscription" | "connexion",
  formData: FormData,
): Promise<EtatCompte> {
  const email = texte(formData, "email");
  try {
    return await demanderLien({
      emailBrut: email,
      piege: texte(formData, "site_web"),
      but,
      origine: origineDepuis(await headers()),
    });
  } catch (error) {
    console.error("[terroir] demande de lien", error);
    return {
      ...etatCompteInitial,
      valeurs: { email: email.slice(0, 254) },
      erreurs: {
        formulaire: "Une erreur est survenue. Réessayez dans un instant.",
      },
    };
  }
}

export async function demanderInscription(
  _etat: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  return demander("inscription", formData);
}

export async function demanderConnexion(
  _etat: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  return demander("connexion", formData);
}

export async function confirmerConnexion(formData: FormData): Promise<void> {
  const token = texte(formData, "token");
  let userId: string | null = null;
  let code: CodeLien = "erreur";
  try {
    const resultat = await consommerLien(token);
    if (resultat.ok) userId = resultat.userId;
    else code = resultat.code;
  } catch (error) {
    console.error("[terroir] confirmation de connexion", error);
  }
  if (!userId) redirect(`/connexion/verifier?etat=${code}`);
  const ouverte = await ouvrirSession(userId);
  if (!ouverte) redirect("/connexion/verifier?etat=config");
  redirect("/espace");
}

export async function deconnecter(): Promise<void> {
  await fermerSession();
  redirect("/");
}
