import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mon espace — Terroir",
};

export default async function EspacePage() {
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
