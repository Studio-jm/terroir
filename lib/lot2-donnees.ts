import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  positionPublique,
  troisDernieres,
  type AccueilFerme,
  type ActualiteCourte,
  type ComplementFiche,
  type FermeturePlage,
  type PhotoPublique,
} from "@/lib/fiche-lot2";
import { identifiantsSupabase } from "@/lib/supabase/env";

export type PhotoEdition = { id: string; alt: string; url: string };
export type FermetureEdition = { id: string; debut: string; fin: string; motif: string };
export type ActualiteEdition = { id: string; titre: string; texte: string; date: string };

export type Lot2Edition = {
  exploitationId: string;
  slug: string;
  photos: PhotoEdition[];
  fermetures: FermetureEdition[];
  actualites: ActualiteEdition[];
  adresse: string;
  montrerAdresseExacte: boolean;
  visite: boolean;
  conditions: string;
  reservation: string;
};

type LigneLieu = {
  id: string;
  slug: string;
  commune: string;
  adresse: string | null;
  montrer_adresse_exacte: boolean | null;
  lat_commune: number | null;
  lng_commune: number | null;
  lat_adresse: number | null;
  lng_adresse: number | null;
  accueil_visite: boolean | null;
  accueil_conditions: string | null;
  accueil_reservation: string | null;
  contact_affichable: boolean | null;
};

const COLONNES_LIEU = [
  "id",
  "slug",
  "commune",
  "adresse",
  "montrer_adresse_exacte",
  "lat_commune",
  "lng_commune",
  "lat_adresse",
  "lng_adresse",
  "accueil_visite",
  "accueil_conditions",
  "accueil_reservation",
  "contact_affichable",
].join(", ");

export function urlPhotoPublique(chemin: string): string {
  const base = identifiantsSupabase()?.url.replace(/\/$/, "") ?? "";
  if (!base) return "";
  const cheminEncode = chemin.split("/").map((morceau) => encodeURIComponent(morceau)).join("/");
  return `${base}/storage/v1/object/public/photos-exploitations/${cheminEncode}`;
}

export async function complementPublic(
  supabase: SupabaseClient,
  slug: string,
): Promise<ComplementFiche | null> {
  const { data, error } = await supabase
    .from("exploitations")
    .select(COLONNES_LIEU)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const lieu = data as unknown as LigneLieu;
  const [photos, fermetures, actualites] = await Promise.all([
    lirePhotos(supabase, lieu.id),
    lireFermetures(supabase, lieu.id),
    lireActualites(supabase, lieu.id),
  ]);
  const accueil: AccueilFerme = {
    visite: lieu.accueil_visite === true,
    conditions: lieu.accueil_conditions ?? "",
    reservation: lieu.accueil_reservation ?? "",
  };
  return {
    contactAffichable: lieu.contact_affichable === true,
    photos,
    carte: positionPublique({
      commune: lieu.commune,
      adresse: lieu.adresse ?? "",
      montrerExacte: lieu.montrer_adresse_exacte === true,
      latCommune: lieu.lat_commune,
      lngCommune: lieu.lng_commune,
      latAdresse: lieu.lat_adresse,
      lngAdresse: lieu.lng_adresse,
    }),
    fermetures,
    actualites: troisDernieres(actualites),
    accueil: accueil.visite || accueil.conditions || accueil.reservation ? accueil : null,
  };
}

export async function lot2PourEdition(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<Lot2Edition | null> {
  const { data, error } = await supabase
    .from("exploitations")
    .select(COLONNES_LIEU)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  const lieu = data as unknown as LigneLieu;
  const [photos, fermetures, actualites] = await Promise.all([
    lirePhotosEdition(supabase, lieu.id),
    lireFermeturesEdition(supabase, lieu.id),
    lireActualitesEdition(supabase, lieu.id),
  ]);
  return {
    exploitationId: lieu.id,
    slug: lieu.slug,
    photos,
    fermetures,
    actualites,
    adresse: lieu.adresse ?? "",
    montrerAdresseExacte: lieu.montrer_adresse_exacte === true,
    visite: lieu.accueil_visite === true,
    conditions: lieu.accueil_conditions ?? "",
    reservation: lieu.accueil_reservation ?? "",
  };
}

async function lirePhotos(supabase: SupabaseClient, exploitationId: string): Promise<PhotoPublique[]> {
  const { data, error } = await supabase
    .from("photos_exploitation")
    .select("chemin, texte_alternatif")
    .eq("exploitation_id", exploitationId)
    .order("cree_le", { ascending: true });
  if (error || !data) return [];
  return data.flatMap((ligne) => {
    const chemin = String(ligne.chemin ?? "");
    const alt = String(ligne.texte_alternatif ?? "").trim();
    const src = urlPhotoPublique(chemin);
    if (!src || !alt) return [];
    return [{ src, alt }];
  });
}

async function lirePhotosEdition(
  supabase: SupabaseClient,
  exploitationId: string,
): Promise<PhotoEdition[]> {
  const { data, error } = await supabase
    .from("photos_exploitation")
    .select("id, chemin, texte_alternatif")
    .eq("exploitation_id", exploitationId)
    .order("cree_le", { ascending: true });
  if (error || !data) return [];
  return data.flatMap((ligne) => {
    const id = String(ligne.id ?? "");
    const alt = String(ligne.texte_alternatif ?? "");
    const url = urlPhotoPublique(String(ligne.chemin ?? ""));
    if (!id || !url) return [];
    return [{ id, alt, url }];
  });
}

async function lireFermetures(
  supabase: SupabaseClient,
  exploitationId: string,
): Promise<FermeturePlage[]> {
  const { data, error } = await supabase
    .from("fermetures")
    .select("debut, fin, motif")
    .eq("exploitation_id", exploitationId);
  if (error || !data) return [];
  return data.map((ligne) => ({
    debut: String(ligne.debut),
    fin: String(ligne.fin),
    motif: String(ligne.motif ?? ""),
  }));
}

async function lireFermeturesEdition(
  supabase: SupabaseClient,
  exploitationId: string,
): Promise<FermetureEdition[]> {
  const { data, error } = await supabase
    .from("fermetures")
    .select("id, debut, fin, motif")
    .eq("exploitation_id", exploitationId)
    .order("debut", { ascending: true });
  if (error || !data) return [];
  return data.map((ligne) => ({
    id: String(ligne.id),
    debut: String(ligne.debut),
    fin: String(ligne.fin),
    motif: String(ligne.motif ?? ""),
  }));
}

async function lireActualites(
  supabase: SupabaseClient,
  exploitationId: string,
): Promise<ActualiteCourte[]> {
  const { data, error } = await supabase
    .from("actualites")
    .select("titre, texte, date_actualite")
    .eq("exploitation_id", exploitationId)
    .order("date_actualite", { ascending: false })
    .limit(3);
  if (error || !data) return [];
  return data.map((ligne) => ({
    titre: String(ligne.titre ?? ""),
    texte: String(ligne.texte ?? ""),
    date: String(ligne.date_actualite),
  }));
}

async function lireActualitesEdition(
  supabase: SupabaseClient,
  exploitationId: string,
): Promise<ActualiteEdition[]> {
  const { data, error } = await supabase
    .from("actualites")
    .select("id, titre, texte, date_actualite")
    .eq("exploitation_id", exploitationId)
    .order("date_actualite", { ascending: false });
  if (error || !data) return [];
  return data.map((ligne) => ({
    id: String(ligne.id),
    titre: String(ligne.titre ?? ""),
    texte: String(ligne.texte ?? ""),
    date: String(ligne.date_actualite),
  }));
}
