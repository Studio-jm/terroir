import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormulaireFiche } from "@/app/espace/formulaire-fiche";
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
      <main>
        <h1>Mon espace</h1>
        <p className="erreur" role="alert">
          {MESSAGE_SUPABASE_MANQUANT}
        </p>
      </main>
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
      <main>
        <h1>Mon espace</h1>
        <p className="erreur" role="alert">
          Votre fiche n&apos;a pas pu être lue. Réessayez dans un instant.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Mon espace</h1>
      <p>
        Connecté avec <strong>{utilisateur.email}</strong>.
      </p>
      <section>
        <h2>{valeurs.slug ? "Modifier votre fiche" : "Créer votre fiche"}</h2>
        <FormulaireFiche valeurs={valeurs} />
      </section>
    </main>
  );
}
