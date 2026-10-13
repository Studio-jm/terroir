import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { listExploitations } from "./lib/exploitation";
import { identifiantsSupabase } from "@/lib/supabase/env";

const slugsConnus = new Set(listExploitations().map((e) => e.slug));

function reponseFicheInconnue(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const inconnu = url.pathname.match(/^\/e\/([^/]+)\/?$/);
  const slugInconnu = Boolean(
    inconnu && !slugsConnus.has(decodeURIComponent(inconnu[1])),
  );
  if (!slugInconnu && url.pathname !== "/fiche-introuvable") return null;

  url.pathname = "/fiche-introuvable";
  const response = NextResponse.rewrite(url, { status: 404 });
  response.headers.set("x-robots-tag", "noindex");
  return response;
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
  const ficheInconnue = reponseFicheInconnue(request);
  const ids = identifiantsSupabase();
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
    "/e/:path*",
    "/fiche-introuvable",
  ],
};
