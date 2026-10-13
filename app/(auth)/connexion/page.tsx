import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireCompte } from "@/app/(auth)/formulaire-compte";
import { CoquePage } from "@/app/coque-page";
import { MESSAGES_CONNEXION } from "@/lib/etat-compte";
import {
  identifiantsSupabase,
  MESSAGE_SUPABASE_MANQUANT,
} from "@/lib/supabase/env";
import { utilisateurCourant } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Connexion — Terroir",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  if (!identifiantsSupabase()) {
    return (
      <CoquePage>
        <h1 className="text-3xl leading-tight md:text-5xl">Connexion</h1>
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
  const { etat } = await searchParams;
  const message = etat && etat in MESSAGES_CONNEXION
    ? MESSAGES_CONNEXION[etat as keyof typeof MESSAGES_CONNEXION]
    : null;

  return (
    <CoquePage>
      <h1 className="text-3xl leading-tight md:text-5xl">Connexion</h1>
      <p className="text-base leading-relaxed text-encre-douce">
        Indiquez l&apos;adresse e-mail et le mot de passe du compte producteur.
      </p>
      {message ? (
        <p className="erreur" role="alert">
          {message}
        </p>
      ) : null}
      <div className="panneau">
        <FormulaireCompte mode="connexion" />
      </div>
      <p>
        <Link href="/inscription">Pas encore de compte ? Inscription</Link>
      </p>
    </CoquePage>
  );
}
