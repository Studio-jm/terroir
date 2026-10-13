"use server";

import { revalidatePath } from "next/cache";
import { enregistrerFichePour } from "@/lib/enregistrer-fiche";
import type { EtatFiche, ValeursFiche } from "@/lib/etat-fiche";
import { utilisateurCourant } from "@/lib/supabase/session";

function texte(formData: FormData, nom: string, max: number): string {
  const valeur = formData.get(nom);
  if (typeof valeur !== "string") return "";
  return valeur.slice(0, max);
}

function valeursDepuis(formData: FormData): ValeursFiche {
  return {
    slug: texte(formData, "slug", 80),
    nom: texte(formData, "nom", 120),
    commune: texte(formData, "commune", 120),
    produits: texte(formData, "produits", 600),
    contact: texte(formData, "contact", 240),
    description: texte(formData, "description", 2500),
  };
}

export async function enregistrerFiche(
  _etat: EtatFiche,
  formData: FormData,
): Promise<EtatFiche> {
  const valeurs = valeursDepuis(formData);
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) {
    return {
      erreurs: {
        formulaire: "Connectez-vous pour enregistrer votre fiche.",
      },
      valeurs,
      message: "",
      slugPublic: valeurs.slug,
    };
  }

  try {
    const resultat = await enregistrerFichePour({
      userId: utilisateur.id,
      slugDemande: valeurs.slug,
      piege: texte(formData, "site_web", 200),
      champs: {
        nom: valeurs.nom,
        commune: valeurs.commune,
        produits: valeurs.produits,
        contact: valeurs.contact,
        description: valeurs.description,
      },
    });
    if (!resultat.ok) {
      return {
        erreurs: resultat.erreurs,
        valeurs,
        message: "",
        slugPublic: valeurs.slug,
      };
    }
    revalidatePath("/");
    revalidatePath("/espace");
    revalidatePath(`/e/${resultat.fiche.slug}`);
    return {
      erreurs: {},
      valeurs: {
        slug: resultat.fiche.slug,
        nom: resultat.fiche.nom,
        commune: resultat.fiche.commune,
        produits: resultat.fiche.produits.join(", "),
        contact: resultat.fiche.contact,
        description: resultat.fiche.description,
      },
      message: "Fiche enregistrée.",
      slugPublic: resultat.fiche.slug,
    };
  } catch (error) {
    console.error("[terroir] enregistrement de fiche", error);
    return {
      erreurs: {
        formulaire: "La fiche n'a pas pu être enregistrée. Réessayez.",
      },
      valeurs,
      message: "",
      slugPublic: valeurs.slug,
    };
  }
}
