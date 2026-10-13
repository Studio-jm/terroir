"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { hrefAvecRecherche } from "@/lib/recherche";

const CLE_RECHERCHE = "terroir-recherche";

export function memoriserRecherche(href: string) {
  try {
    if (href && href !== "/") sessionStorage.setItem(CLE_RECHERCHE, href);
    else sessionStorage.removeItem(CLE_RECHERCHE);
  } catch {
    // sessionStorage indisponible (navigation privée, etc.)
  }
}

function nePasEcouter() {
  return () => {};
}

function hrefAccueil(): string {
  try {
    const brut = sessionStorage.getItem(CLE_RECHERCHE) ?? "";
    if (!brut) return "/";
    if (brut.startsWith("/")) return brut;
    if (brut.startsWith("?")) return `/${brut}`;
    return hrefAvecRecherche(brut);
  } catch {
    return "/";
  }
}

export function LienAccueil({
  children = "Terroir",
}: {
  children?: React.ReactNode;
}) {
  const href = useSyncExternalStore(nePasEcouter, hrefAccueil, () => "/");
  return <Link href={href}>{children}</Link>;
}
