import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
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

export async function slugsEnregistres(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("exploitations").select("slug");
  if (error) throw error;
  return (data ?? []).map((ligne) => String(ligne.slug));
}
