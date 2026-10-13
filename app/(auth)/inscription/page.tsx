import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireCompte } from "@/app/(auth)/formulaire-compte";
import { utilisateurCourant } from "@/lib/session";

export const metadata: Metadata = {
  title: "Inscription — Terroir",
};

export default async function InscriptionPage() {
  const utilisateur = await utilisateurCourant();
  if (utilisateur) redirect("/espace");

  return (
    <main>
      <h1>Inscription</h1>
      <p>
        Créez votre compte producteur. Un lien de connexion est envoyé à votre
        adresse e-mail, sans mot de passe.
      </p>
      <FormulaireCompte mode="inscription" />
      <p>
        <Link href="/connexion">Déjà un compte ? Connexion</Link>
      </p>
    </main>
  );
}
