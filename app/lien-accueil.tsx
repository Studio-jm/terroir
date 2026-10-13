"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { hrefAvecRecherche } from "@/lib/recherche";

const CLE_RECHERCHE = "terroir-recherche";

export function memoriserRecherche(query: string) {
  try {
    if (query) sessionStorage.setItem(CLE_RECHERCHE, query);
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
    return hrefAvecRecherche(sessionStorage.getItem(CLE_RECHERCHE) ?? "");
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
