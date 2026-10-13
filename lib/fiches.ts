import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { champsLot1DepuisStock, type ChampsLot1 } from "@/lib/fiche-lot1";
import { creerClientServeur } from "@/lib/supabase/server";

export type Fiche = {
  ownerId: string;
  slug: string;
  nom: string;
  commune: string;
  produits: string[];
  contact: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Ligne = {
  owner_id: string;
  slug: string;
  nom: string;
  commune: string;
  produits: string[] | null;
  contact: string;
  description: string;
  created_at: string;
  updated_at: string;
};

const COLONNES =
  "owner_id, slug, nom, commune, produits, contact, description, created_at, updated_at";

export async function clientFiches(): Promise<SupabaseClient | null> {
  return creerClientServeur();
}

export function ligneVersFiche(ligne: Ligne): Fiche {
  return {
    ownerId: ligne.owner_id,
    slug: ligne.slug,
    nom: ligne.nom,
    commune: ligne.commune,
    produits: Array.isArray(ligne.produits) ? ligne.produits : [],
    contact: ligne.contact,
    description: ligne.description,
    createdAt: ligne.created_at,
    updatedAt: ligne.updated_at,
  };
}

export function codeErreur(error: { code?: string; message?: string }): string {
  return `${error.code ?? ""} ${error.message ?? ""}`;
}

export async function ficheDuProprietaire(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<Fiche | null> {
  const { data, error } = await supabase
    .from("exploitations")
    .select(COLONNES)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data ? ligneVersFiche(data as Ligne) : null;
}

export async function ficheParSlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Fiche | null> {
  const { data, error } = await supabase
    .from("exploitations")
    .select(COLONNES)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? ligneVersFiche(data as Ligne) : null;
}

export async function listerFiches(supabase: SupabaseClient): Promise<Fiche[]> {
  const { data, error } = await supabase
    .from("exploitations")
    .select(COLONNES)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((ligne) => ligneVersFiche(ligne as Ligne));
}

const COLONNES_ESPACE = `${COLONNES}, presentation, offres, modes_vente, points_vente, horaires_ferme, paiements, labels, liens`;

type LigneEspace = Ligne & {
  presentation: string | null;
  offres: unknown;
  modes_vente: string[] | null;
  points_vente: unknown;
  horaires_ferme: unknown;
  paiements: string[] | null;
  labels: string[] | null;
  liens: unknown;
};

type LigneContact = {
  telephone: string | null;
  email: string | null;
  afficher: boolean | null;
};

export async function fichePourEspace(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<{ fiche: Fiche; lot1: ChampsLot1 } | null> {
  const { data, error } = await supabase
    .from("exploitations")
    .select(COLONNES_ESPACE)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const ligne = data as LigneEspace;
  const { data: contact, error: erreurContact } = await supabase
    .from("contacts_producteur")
    .select("telephone, email, afficher")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (erreurContact) throw erreurContact;
  const ligneContact = (contact ?? null) as LigneContact | null;
  return {
    fiche: ligneVersFiche(ligne),
    lot1: champsLot1DepuisStock({
      presentation: ligne.presentation,
      offres: ligne.offres,
      modes_vente: ligne.modes_vente,
      points_vente: ligne.points_vente,
      horaires_ferme: ligne.horaires_ferme,
      paiements: ligne.paiements,
      labels: ligne.labels,
      liens: ligne.liens,
      telephone: ligneContact?.telephone ?? null,
      email: ligneContact?.email ?? null,
      afficher: ligneContact?.afficher ?? null,
    }),
  };
}

export async function slugsEnregistres(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("exploitations").select("slug");
  if (error) throw error;
  return (data ?? []).map((ligne) => String(ligne.slug));
}
