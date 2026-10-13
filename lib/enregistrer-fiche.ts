import "server-only";

import { listExploitations } from "@/lib/exploitation";
import {
  deciderEnregistrement,
  slugDeNom,
  validerFiche,
  type ChampsFiche,
  type ErreursFiche,
} from "@/lib/fiche-regles";
import { MESSAGE_SUPABASE_MANQUANT } from "@/lib/supabase/env";
import {
  clientFiches,
  codeErreur,
  ficheDuProprietaire,
  ficheParSlug,
  slugsEnregistres,
  type Fiche,
} from "@/lib/fiches";

export type ResultatFiche =
  | { ok: true; fiche: Fiche }
  | { ok: false; erreurs: ErreursFiche };

function refus(): ResultatFiche {
  return {
    ok: false,
    erreurs: { formulaire: "Vous ne pouvez pas modifier cette fiche." },
  };
}

function conflitSlug(error: { code?: string; message?: string }): boolean {
  const texte = codeErreur(error);
  return texte.includes("23505") && texte.includes("slug");
}

function conflitProprietaire(error: { code?: string; message?: string }): boolean {
  const texte = codeErreur(error);
  return texte.includes("23505") && texte.includes("owner");
}

function refuseParRls(error: { code?: string; message?: string }): boolean {
  const texte = codeErreur(error).toLowerCase();
  return texte.includes("42501") || texte.includes("row-level security");
}

export async function enregistrerFichePour(input: {
  userId: string;
  slugDemande: string;
  piege: string;
  champs: ChampsFiche;
}): Promise<ResultatFiche> {
  if (input.piege.trim()) {
    return { ok: false, erreurs: { formulaire: "Envoi refusé." } };
  }
  if (input.slugDemande.length > 80) return refus();

  const supabase = await clientFiches();
  if (!supabase) {
    return { ok: false, erreurs: { formulaire: MESSAGE_SUPABASE_MANQUANT } };
  }

  const validation = validerFiche(input.champs);
  if (!validation.ok) return validation;

  const mienne = await ficheDuProprietaire(supabase, input.userId);
  const slug = input.slugDemande.trim();
  const cible = slug ? await ficheParSlug(supabase, slug) : null;
  const decision = deciderEnregistrement({
    slugDemande: slug,
    slugPropre: mienne?.slug ?? null,
    cibleEstSienne: Boolean(cible && cible.ownerId === input.userId),
  });
  if (decision === "refus") return refus();

  const valeurs = {
    nom: validation.valeur.nom,
    commune: validation.valeur.commune,
    produits: validation.valeur.produits,
    contact: validation.valeur.contact,
    description: validation.valeur.description,
  };

  if (decision === "modifier" && mienne) {
    const { data, error } = await supabase
      .from("exploitations")
      .update(valeurs)
      .eq("owner_id", input.userId)
      .eq("slug", mienne.slug)
      .select("slug")
      .maybeSingle();
    if (error) {
      if (refuseParRls(error)) return refus();
      throw error;
    }
    if (!data) return refus();
    const fiche = await ficheDuProprietaire(supabase, input.userId);
    if (!fiche) return refus();
    return { ok: true, fiche };
  }

  const demos = listExploitations().map((exploitation) => exploitation.slug);
  for (let essai = 0; essai < 5; essai += 1) {
    const pris = new Set([...demos, ...(await slugsEnregistres(supabase))]);
    const slugCree = slugDeNom(validation.valeur.nom, pris);
    const { error } = await supabase.from("exploitations").insert({
      owner_id: input.userId,
      slug: slugCree,
      ...valeurs,
    });
    if (!error) {
      const fiche = await ficheDuProprietaire(supabase, input.userId);
      if (!fiche) throw new Error("fiche absente après création");
      return { ok: true, fiche };
    }
    if (refuseParRls(error)) return refus();
    if (conflitProprietaire(error)) {
      const existante = await ficheDuProprietaire(supabase, input.userId);
      if (!existante) throw error;
      const { error: maj } = await supabase
        .from("exploitations")
        .update(valeurs)
        .eq("owner_id", input.userId)
        .eq("slug", existante.slug);
      if (maj) {
        if (refuseParRls(maj)) return refus();
        throw maj;
      }
      const fiche = await ficheDuProprietaire(supabase, input.userId);
      if (!fiche) throw error;
      return { ok: true, fiche };
    }
    if (!conflitSlug(error) || essai === 4) throw error;
  }

  throw new Error("slug introuvable");
}
