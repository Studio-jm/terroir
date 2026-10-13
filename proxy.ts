import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { listExploitations } from "./lib/exploitation";
import { identifiantsSupabase } from "@/lib/supabase/env";

const slugsConnus = new Set(listExploitations().map((e) => e.slug));

function reponseFicheInconnue(request: NextRequest): NextResponse | null {
  const match = request.nextUrl.pathname.match(/^\/e\/([^/]+)\/?$/);
  if (!match || slugsConnus.has(decodeURIComponent(match[1]))) return null;
  const url = request.nextUrl.clone();
  url.pathname = "/fiche-introuvable";
  return NextResponse.rewrite(url, { status: 404 });
}

function recopierEntetesSession(
  source: NextResponse,
  cible: NextResponse,
) {
  source.cookies.getAll().forEach((cookie) => {
    cible.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) cible.headers.set(header, value);
  }
}

export async function proxy(request: NextRequest) {
  const ids = identifiantsSupabase();
  // Sans Supabase, seuls les slugs de démo existent : une autre adresse /e/…
  // reste le message « fiche introuvable » de main. Avec Supabase, la page
  // dynamique tranche (démo, fiche du producteur, ou notFound).
  const ficheInconnue = ids ? null : reponseFicheInconnue(request);
  if (!ids) return ficheInconnue ?? NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(ids.url, ids.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const connecte = Boolean(data?.claims?.sub);
  if (!connecte && request.nextUrl.pathname.startsWith("/espace")) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    const redirection = NextResponse.redirect(url);
    recopierEntetesSession(supabaseResponse, redirection);
    return redirection;
  }

  if (ficheInconnue) {
    recopierEntetesSession(supabaseResponse, ficheInconnue);
    return ficheInconnue;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
