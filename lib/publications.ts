import "server-only";

import { connection } from "next/server";
import {
  getExploitationBySlug,
  listExploitations,
  type Exploitation,
} from "@/lib/exploitation";
import { ficheVersExploitation } from "@/lib/fiche-regles";
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
    return [...demos, ...fiches.map(ficheVersExploitation)];
  } catch (error) {
    console.error("[terroir] lecture des fiches impossible", error);
    return demos;
  }
}

export async function exploitationPublique(
  slug: string,
): Promise<Exploitation | undefined> {
  await connection();
  const demo = getExploitationBySlug(slug);
  if (demo) return demo;
  try {
    const supabase = await clientFiches();
    if (!supabase) return undefined;
    const fiche = await ficheParSlug(supabase, slug);
    return fiche ? ficheVersExploitation(fiche) : undefined;
  } catch (error) {
    console.error("[terroir] lecture de la fiche impossible", error);
    return undefined;
  }
}
