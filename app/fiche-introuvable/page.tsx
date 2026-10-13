import type { Metadata } from "next";
import { LienAccueil } from "../lien-accueil";

export const metadata: Metadata = {
  title: "Fiche introuvable — Terroir",
};

export default function FicheIntrouvable() {
  return (
    <main>
      <h1>Fiche introuvable</h1>
      <p>Aucune fiche ne correspond à cette adresse.</p>
      <p>
        <LienAccueil>Retour à l&apos;accueil</LienAccueil>
      </p>
    </main>
  );
}
