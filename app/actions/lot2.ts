"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erreurChamp, erreurPlage } from "@/lib/fiche-lot2";
import { geocoder } from "@/lib/geocode";
import { clientFiches } from "@/lib/fiches";
import { utilisateurCourant } from "@/lib/supabase/session";

function texte(formData: FormData, nom: string, max: number): string {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur.slice(0, max) : "";
}

function echec(message: string): never {
  redirect(`/espace?erreur=${encodeURIComponent(message)}`);
}

async function ficheCourante() {
  const utilisateur = await utilisateurCourant();
  const supabase = await clientFiches();
  if (!utilisateur || !supabase) return null;
  const { data, error } = await supabase
    .from("exploitations")
    .select("id, slug, commune")
    .eq("owner_id", utilisateur.id)
    .maybeSingle();
  if (error || !data?.id || !data.slug) return null;
  return {
    supabase,
    fiche: {
      id: String(data.id),
      slug: String(data.slug),
      commune: String(data.commune ?? ""),
    },
  };
}

function termine(slug: string): never {
  revalidatePath("/espace");
  revalidatePath(`/e/${slug}`);
  revalidatePath("/");
  redirect("/espace");
}

export async function enregistrerLieu(formData: FormData) {
  const courant = await ficheCourante();
  if (!courant) echec("Connectez-vous pour enregistrer le lieu.");
  const session = courant;
  const adresse = texte(formData, "adresse", 200).trim();
  const montrer = formData.get("montrer_adresse_exacte") === "oui";
  if (montrer && adresse.length < 3) {
    echec("Indiquez l'adresse avant de l'afficher sur la carte.");
  }
  if (adresse) {
    const erreur = erreurChamp(adresse, 3, 200, "Adresse");
    if (erreur) echec(erreur);
  }
  const commune = await geocoder(session.fiche.commune);
  const pointAdresse = adresse ? await geocoder(`${adresse}, ${session.fiche.commune}`) : null;
  const patch: {
    adresse: string | null;
    montrer_adresse_exacte: boolean;
    lat_commune?: number;
    lng_commune?: number;
    lat_adresse?: number | null;
    lng_adresse?: number | null;
  } = {
    adresse: adresse || null,
    montrer_adresse_exacte: montrer,
  };
  if (commune) {
    patch.lat_commune = commune.lat;
    patch.lng_commune = commune.lng;
  }
  if (!adresse) {
    patch.lat_adresse = null;
    patch.lng_adresse = null;
  } else if (pointAdresse) {
    patch.lat_adresse = pointAdresse.lat;
    patch.lng_adresse = pointAdresse.lng;
  }
  const { error } = await session.supabase
    .from("exploitations")
    .update(patch)
    .eq("id", session.fiche.id);
  if (error) echec("Le lieu n'a pas pu être enregistré.");
  termine(session.fiche.slug);
}

export async function enregistrerAccueil(formData: FormData) {
  const courant = await ficheCourante();
  if (!courant) echec("Connectez-vous pour enregistrer l'accueil.");
  const session = courant;
  const visite = formData.get("accueil_visite") === "oui";
  const conditions = texte(formData, "accueil_conditions", 500).trim();
  const reservation = texte(formData, "accueil_reservation", 200).trim();
  if (conditions) {
    const erreur = erreurChamp(conditions, 1, 500, "Conditions");
    if (erreur) echec(erreur);
  }
  if (reservation) {
    const erreur = erreurChamp(reservation, 1, 200, "Réservation");
    if (erreur) echec(erreur);
  }
  const { error } = await session.supabase
    .from("exploitations")
    .update({
      accueil_visite: visite,
      accueil_conditions: conditions || null,
      accueil_reservation: reservation || null,
    })
    .eq("id", session.fiche.id);
  if (error) echec("L'accueil n'a pas pu être enregistré.");
  termine(session.fiche.slug);
}

export async function creerFermeture(formData: FormData) {
  const courant = await ficheCourante();
  if (!courant) echec("Connectez-vous pour ajouter une fermeture.");
  const session = courant;
  const debut = texte(formData, "debut", 10);
  const fin = texte(formData, "fin", 10);
  const motif = texte(formData, "motif", 200).trim();
  const plage = erreurPlage(debut, fin);
  if (plage) echec(plage);
  const texteMotif = erreurChamp(motif, 1, 200, "Motif");
  if (texteMotif) echec(texteMotif);
  const { error } = await session.supabase.from("fermetures").insert({
    exploitation_id: session.fiche.id,
    owner_id: (await utilisateurCourant())?.id,
    debut,
    fin,
    motif,
  });
  if (error) echec("La fermeture n'a pas pu être ajoutée.");
  termine(session.fiche.slug);
}

export async function supprimerFermeture(formData: FormData) {
  const courant = await ficheCourante();
  if (!courant) echec("Connectez-vous pour supprimer une fermeture.");
  const session = courant;
  const id = texte(formData, "id", 80);
  const { error } = await session.supabase
    .from("fermetures")
    .delete()
    .eq("id", id)
    .eq("exploitation_id", session.fiche.id);
  if (error) echec("La fermeture n'a pas pu être supprimée.");
  termine(session.fiche.slug);
}

export async function creerActualite(formData: FormData) {
  await ecrireActualite(formData, null);
}

export async function modifierActualite(formData: FormData) {
  const id = texte(formData, "id", 80);
  if (!id) echec("Cette actualité est introuvable.");
  await ecrireActualite(formData, id);
}

async function ecrireActualite(formData: FormData, id: string | null) {
  const courant = await ficheCourante();
  if (!courant) echec("Connectez-vous pour enregistrer l'actualité.");
  const session = courant;
  const titre = texte(formData, "titre", 120).trim();
  const corps = texte(formData, "texte", 500).trim();
  const date = texte(formData, "date_actualite", 10);
  const erreurTitre = erreurChamp(titre, 1, 120, "Titre");
  if (erreurTitre) echec(erreurTitre);
  const erreurTexte = erreurChamp(corps, 1, 500, "Texte");
  if (erreurTexte) echec(erreurTexte);
  const plage = erreurPlage(date, date);
  if (plage) echec("Indiquez la date de l'actualité.");
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) echec("Connectez-vous pour enregistrer l'actualité.");
  if (id) {
    const { error } = await session.supabase
      .from("actualites")
      .update({ titre, texte: corps, date_actualite: date })
      .eq("id", id)
      .eq("exploitation_id", session.fiche.id);
    if (error) echec("L'actualité n'a pas pu être modifiée.");
  } else {
    const { error } = await session.supabase.from("actualites").insert({
      exploitation_id: session.fiche.id,
      owner_id: utilisateur.id,
      titre,
      texte: corps,
      date_actualite: date,
    });
    if (error) echec("L'actualité n'a pas pu être ajoutée.");
  }
  termine(session.fiche.slug);
}

export async function supprimerActualite(formData: FormData) {
  const courant = await ficheCourante();
  if (!courant) echec("Connectez-vous pour supprimer l'actualité.");
  const session = courant;
  const id = texte(formData, "id", 80);
  const { error } = await session.supabase
    .from("actualites")
    .delete()
    .eq("id", id)
    .eq("exploitation_id", session.fiche.id);
  if (error) echec("L'actualité n'a pas pu être supprimée.");
  termine(session.fiche.slug);
}

export async function supprimerPhoto(formData: FormData) {
  const courant = await ficheCourante();
  if (!courant) echec("Connectez-vous pour supprimer la photo.");
  const session = courant;
  const id = texte(formData, "id", 80);
  const { data, error } = await session.supabase
    .from("photos_exploitation")
    .select("chemin")
    .eq("id", id)
    .eq("exploitation_id", session.fiche.id)
    .maybeSingle();
  if (error || !data?.chemin) echec("La photo n'a pas pu être supprimée.");
  const chemin = String(data.chemin);
  const { error: stockage } = await session.supabase.storage
    .from("photos-exploitations")
    .remove([chemin]);
  if (stockage) echec("La photo n'a pas pu être supprimée.");
  const { error: ligne } = await session.supabase
    .from("photos_exploitation")
    .delete()
    .eq("id", id)
    .eq("exploitation_id", session.fiche.id);
  if (ligne) echec("La photo n'a pas pu être supprimée.");
  termine(session.fiche.slug);
}
