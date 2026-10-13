import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

  return (
    <main>
      <h1>Mon espace</h1>
      <p>
        Connecté avec <strong>{utilisateur.email}</strong>.
      </p>
      <p>La fiche de votre exploitation se gère depuis cet espace.</p>
    </main>
  );
}
