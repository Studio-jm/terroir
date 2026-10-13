import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listExploitations } from "./lib/exploitation";

const slugsConnus = new Set(listExploitations().map((e) => e.slug));

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/e\/([^/]+)\/?$/);
  if (!match || slugsConnus.has(decodeURIComponent(match[1]))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/fiche-introuvable";
  return NextResponse.rewrite(url, { status: 404 });
}

export const config = {
  matcher: ["/e/:path*"],
};
