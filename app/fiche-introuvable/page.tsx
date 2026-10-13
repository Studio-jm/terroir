import type { Metadata } from "next";
import { MessageIntrouvable } from "../message-introuvable";

export const metadata: Metadata = {
  title: "Fiche introuvable — Terroir",
  robots: { index: false, follow: false },
};

export default function FicheIntrouvable() {
  return (
    <MessageIntrouvable
      titre="Fiche introuvable"
      texte="Aucune fiche ne correspond à cette adresse."
    />
  );
}
