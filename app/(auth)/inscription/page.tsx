import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireCompte } from "@/app/(auth)/formulaire-compte";
import { CoquePage } from "@/app/coque-page";
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
      <CoquePage>
        <h1 className="text-3xl leading-tight md:text-5xl">Inscription</h1>
        <div className="panneau">
          <p className="erreur" role="alert">
            {MESSAGE_SUPABASE_MANQUANT}
          </p>
        </div>
      </CoquePage>
    );
  }

  const utilisateur = await utilisateurCourant();
  if (utilisateur) redirect("/espace");

  return (
    <CoquePage>
      <h1 className="text-3xl leading-tight md:text-5xl">Inscription</h1>
      <p className="text-base leading-relaxed text-encre-douce">
        Créez le compte e-mail de votre exploitation.
      </p>
      <div className="panneau">
        <FormulaireCompte mode="inscription" />
      </div>
      <p>
        <Link href="/connexion">Déjà un compte ? Connexion</Link>
      </p>
    </CoquePage>
  );
}
