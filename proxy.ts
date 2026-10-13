import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listExploitations } from "./lib/exploitation";

const slugsConnus = new Set(listExploitations().map((e) => e.slug));

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const inconnu = url.pathname.match(/^\/e\/([^/]+)\/?$/);
  if (inconnu && !slugsConnus.has(decodeURIComponent(inconnu[1]))) {
    url.pathname = "/fiche-introuvable";
  } else if (url.pathname !== "/fiche-introuvable") {
    return NextResponse.next();
  }

  const response = NextResponse.rewrite(url, { status: 404 });
  response.headers.set("x-robots-tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/e/:path*", "/fiche-introuvable"],
};
