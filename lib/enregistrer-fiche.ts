import "server-only";

import { listExploitations } from "@/lib/exploitation";
import { geocoder } from "@/lib/geocode";
import {
  colonnesLot1,
  ligneContact,
  validerLot1,
  type ChampsLot1,
  type Lot1Valeur,
} from "@/lib/fiche-lot1";
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
  fichePourEspace,
  slugsEnregistres,
  type Fiche,
} from "@/lib/fiches";

export type ResultatFiche =
  | { ok: true; fiche: Fiche; lot1: ChampsLot1 }
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
  return texte.includes("row-level security");
}

async function ecrireContact(
  supabase: NonNullable<Awaited<ReturnType<typeof clientFiches>>>,
  userId: string,
  lot1: Lot1Valeur,
): Promise<void> {
  const { data, error } = await supabase
    .from("exploitations")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("fiche absente après enregistrement");

  const ligne = ligneContact(lot1);
  if (!ligne) {
    const { error: suppression } = await supabase
      .from("contacts_producteur")
      .delete()
      .eq("owner_id", userId);
    if (suppression) throw suppression;
    return;
  }
  const { error: ecriture } = await supabase.from("contacts_producteur").upsert({
    exploitation_id: data.id,
    owner_id: userId,
    telephone: ligne.telephone,
    email: ligne.email,
    afficher: ligne.afficher,
  });
  if (ecriture) throw ecriture;
}

async function memoriserCommune(
  supabase: NonNullable<Awaited<ReturnType<typeof clientFiches>>>,
  userId: string,
  commune: string,
) {
  const point = await geocoder(commune);
  if (!point) return;
  const { error } = await supabase
    .from("exploitations")
    .update({ lat_commune: point.lat, lng_commune: point.lng })
    .eq("owner_id", userId);
  if (error) console.error("[terroir] géocodage de la commune", error);
}

async function terminer(
  supabase: NonNullable<Awaited<ReturnType<typeof clientFiches>>>,
  userId: string,
  lot1: Lot1Valeur,
): Promise<ResultatFiche> {
  await ecrireContact(supabase, userId, lot1);
  const charge = await fichePourEspace(supabase, userId);
  if (!charge) return refus();
  return { ok: true, fiche: charge.fiche, lot1: charge.lot1 };
}

export async function enregistrerFichePour(input: {
  userId: string;
  slugDemande: string;
  piege: string;
  champs: ChampsFiche;
  lot1: ChampsLot1;
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
  const lot = validerLot1(input.lot1);
  if (!validation.ok || !lot.ok) {
    return {
      ok: false,
      erreurs: {
        ...(validation.ok ? {} : validation.erreurs),
        ...(lot.ok ? {} : lot.erreurs),
      },
    };
  }

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
    ...colonnesLot1(lot.valeur),
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
    await memoriserCommune(supabase, input.userId, validation.valeur.commune);
    return terminer(supabase, input.userId, lot.valeur);
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
      await memoriserCommune(supabase, input.userId, validation.valeur.commune);
      return terminer(supabase, input.userId, lot.valeur);
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
      await memoriserCommune(supabase, input.userId, validation.valeur.commune);
      return terminer(supabase, input.userId, lot.valeur);
    }
    if (!conflitSlug(error) || essai === 4) throw error;
  }

  throw new Error("slug introuvable");
}
