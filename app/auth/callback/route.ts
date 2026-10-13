import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";

function cheminInterne(valeur: string | null): string {
  if (!valeur || !valeur.startsWith("/") || valeur.startsWith("//")) {
    return "/espace";
  }
  return valeur;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const suivant = cheminInterne(url.searchParams.get("next"));
  const supabase = await creerClientServeur();

  if (!supabase) {
    return NextResponse.redirect(new URL("/connexion?etat=config", url.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/connexion?etat=lien", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/connexion?etat=lien", url.origin));
  }
  return NextResponse.redirect(new URL(suivant, url.origin));
}
