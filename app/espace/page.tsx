import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoquePage } from "@/app/coque-page";
import { FormulaireFiche } from "@/app/espace/formulaire-fiche";
import { ficheVide, type ValeursFiche } from "@/lib/etat-fiche";
import { clientFiches, ficheDuProprietaire } from "@/lib/fiches";
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
    const fiche = supabase
      ? await ficheDuProprietaire(supabase, utilisateur.id)
      : null;
    if (fiche) {
      valeurs = {
        slug: fiche.slug,
        nom: fiche.nom,
        commune: fiche.commune,
        produits: fiche.produits.join(", "),
        contact: fiche.contact,
        description: fiche.description,
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
    </CoquePage>
  );
}
