import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireCompte } from "@/app/(auth)/formulaire-compte";
import { utilisateurCourant } from "@/lib/session";

export const metadata: Metadata = {
  title: "Connexion — Terroir",
};

export default async function ConnexionPage() {
  const utilisateur = await utilisateurCourant();
  if (utilisateur) redirect("/espace");

  return (
    <main>
      <h1>Connexion</h1>
      <p>Indiquez l&apos;adresse e-mail de votre compte producteur.</p>
      <FormulaireCompte mode="connexion" />
      <p>
        <Link href="/inscription">Pas encore de compte ? Inscription</Link>
      </p>
    </main>
  );
}
