import "server-only";

import { connection } from "next/server";
import {
  getExploitationBySlug,
  listExploitations,
  type Exploitation,
} from "@/lib/exploitation";
import { ficheSansCoordonnees } from "@/lib/fiche-lot2";
import { ficheVersExploitation } from "@/lib/fiche-regles";
import { complementPublic } from "@/lib/lot2-donnees";
import { clientFiches, listerFiches, ficheParSlug } from "@/lib/fiches";

async function fichesPubliees() {
  const supabase = await clientFiches();
  if (!supabase) return [];
  return listerFiches(supabase);
}

export async function listExploitationsPubliques(): Promise<Exploitation[]> {
  await connection();
  const demos = listExploitations();
  try {
    const fiches = await fichesPubliees();
    return [...demos, ...fiches.map(ficheVersExploitation)].map(ficheSansCoordonnees);
  } catch (error) {
    console.error("[terroir] lecture des fiches impossible", error);
    return demos.map(ficheSansCoordonnees);
  }
}

export async function exploitationPublique(
  slug: string,
): Promise<Exploitation | undefined> {
  await connection();
  const demo = getExploitationBySlug(slug);
  if (demo) return ficheSansCoordonnees(demo);
  try {
    const supabase = await clientFiches();
    if (!supabase) return undefined;
    const fiche = await ficheParSlug(supabase, slug);
    if (!fiche) return undefined;
    const base = ficheVersExploitation(fiche);
    let complement = base.complement;
    try {
      const charge = await complementPublic(supabase, slug);
      if (charge) complement = charge;
    } catch (error) {
      console.error("[terroir] lecture du complément impossible", error);
    }
    return ficheSansCoordonnees({ ...base, complement });
  } catch (error) {
    console.error("[terroir] lecture de la fiche impossible", error);
    return undefined;
  }
}
