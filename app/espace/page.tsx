import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoquePage } from "@/app/coque-page";
import { FormulaireFiche } from "@/app/espace/formulaire-fiche";
import { SuppressionCompte } from "@/app/espace/suppression";
import { ficheVide, type ValeursFiche } from "@/lib/etat-fiche";
import { clientFiches, fichePourEspace } from "@/lib/fiches";
import {
  identifiantsSupabase,
  MESSAGE_SUPABASE_MANQUANT,
} from "@/lib/supabase/env";
import { utilisateurCourant } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Mon espace — Terroir",
};

export default async function EspacePage() {
  if (!identifiantsSupabase()) {
    return (
      <CoquePage large>
        <h1 className="text-3xl leading-tight md:text-5xl">Mon espace</h1>
        <div className="panneau">
          <p className="erreur" role="alert">
            {MESSAGE_SUPABASE_MANQUANT}
          </p>
        </div>
      </CoquePage>
    );
  }

  const utilisateur = await utilisateurCourant();
  if (!utilisateur) redirect("/connexion");

  let valeurs: ValeursFiche = ficheVide;
  try {
    const supabase = await clientFiches();
    const charge = supabase
      ? await fichePourEspace(supabase, utilisateur.id)
      : null;
    if (charge) {
      valeurs = {
        slug: charge.fiche.slug,
        nom: charge.fiche.nom,
        commune: charge.fiche.commune,
        produits: charge.fiche.produits.join(", "),
        contact: charge.fiche.contact,
        description: charge.fiche.description,
        lot1: charge.lot1,
        updatedAt: charge.fiche.updatedAt,
      };
    }
  } catch (error) {
    console.error("[terroir] lecture de l'espace", error);
    return (
      <CoquePage large>
        <h1 className="text-3xl leading-tight md:text-5xl">Mon espace</h1>
        <div className="panneau">
          <p className="erreur" role="alert">
            Votre fiche n&apos;a pas pu être lue. Réessayez dans un instant.
          </p>
        </div>
      </CoquePage>
    );
  }

  return (
    <CoquePage large>
      <h1 className="text-3xl leading-tight md:text-5xl">Mon espace</h1>
      <p className="text-base leading-relaxed text-encre-douce">
        Connecté avec <strong>{utilisateur.email}</strong>.
      </p>
      <section className="panneau">
        <h2 className="text-2xl">
          {valeurs.slug ? "Modifier votre fiche" : "Créer votre fiche"}
        </h2>
        <FormulaireFiche valeurs={valeurs} />
      </section>
      <div className="panneau mt-4">
        <SuppressionCompte aUneFiche={Boolean(valeurs.slug)} />
      </div>
    </CoquePage>
  );
}
