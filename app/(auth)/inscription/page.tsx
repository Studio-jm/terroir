import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireCompte } from "@/app/(auth)/formulaire-compte";
import {
  identifiantsSupabase,
  MESSAGE_SUPABASE_MANQUANT,
} from "@/lib/supabase/env";
import { utilisateurCourant } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Inscription — Terroir",
};

export default async function InscriptionPage() {
  if (!identifiantsSupabase()) {
    return (
      <main>
        <h1>Inscription</h1>
        <p className="erreur" role="alert">
          {MESSAGE_SUPABASE_MANQUANT}
        </p>
      </main>
    );
  }

  const utilisateur = await utilisateurCourant();
  if (utilisateur) redirect("/espace");

  return (
    <main>
      <h1>Inscription</h1>
      <p>Créez le compte e-mail de votre exploitation.</p>
      <FormulaireCompte mode="inscription" />
      <p>
        <Link href="/connexion">Déjà un compte ? Connexion</Link>
      </p>
    </main>
  );
}
