"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  etatSuppressionInitial,
  type EtatSuppression,
} from "@/lib/etat-suppression";
import { clientFiches, ficheDuProprietaire } from "@/lib/fiches";
import { piegeRempli } from "@/lib/piege";
import { creerClientServeur } from "@/lib/supabase/server";
import { utilisateurCourant } from "@/lib/supabase/session";

function refusPiege(): EtatSuppression {
  return { erreur: "Envoi refusé.", message: "" };
}

function confirme(formData: FormData, valeur: string): boolean {
  return formData.get("confirmer") === valeur;
}

export async function supprimerFiche(
  _etat: EtatSuppression,
  formData: FormData,
): Promise<EtatSuppression> {
  if (piegeRempli(formData)) return refusPiege();
  if (!confirme(formData, "fiche")) {
    return {
      erreur: "Cochez la confirmation pour supprimer la fiche.",
      message: "",
    };
  }

  const utilisateur = await utilisateurCourant();
  if (!utilisateur) {
    return { erreur: "Connectez-vous pour supprimer la fiche.", message: "" };
  }

  const supabase = await clientFiches();
  if (!supabase) return { ...etatSuppressionInitial, erreur: "La suppression n'a pas abouti. Réessayez." };

  const fiche = await ficheDuProprietaire(supabase, utilisateur.id);
  if (!fiche) {
    return { erreur: "Aucune fiche à supprimer.", message: "" };
  }

  const { error } = await supabase
    .from("exploitations")
    .delete()
    .eq("owner_id", utilisateur.id)
    .eq("slug", fiche.slug);
  if (error) {
    console.error("[terroir] suppression de fiche", error);
    return { erreur: "La suppression n'a pas abouti. Réessayez.", message: "" };
  }

  revalidatePath("/");
  revalidatePath("/espace");
  revalidatePath(`/e/${fiche.slug}`);
  redirect("/espace");
}

export async function supprimerCompte(
  _etat: EtatSuppression,
  formData: FormData,
): Promise<EtatSuppression> {
  if (piegeRempli(formData)) return refusPiege();
  if (!confirme(formData, "compte")) {
    return {
      erreur: "Cochez la confirmation pour supprimer le compte.",
      message: "",
    };
  }

  const utilisateur = await utilisateurCourant();
  if (!utilisateur) {
    return { erreur: "Connectez-vous pour supprimer le compte.", message: "" };
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    return { erreur: "La suppression n'a pas abouti. Réessayez.", message: "" };
  }

  const { error } = await supabase.rpc("supprimer_mon_compte");
  if (error) {
    console.error("[terroir] suppression de compte", error);
    return { erreur: "La suppression n'a pas abouti. Réessayez.", message: "" };
  }

  await supabase.auth.signOut();
  redirect("/");
}
