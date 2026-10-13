import { NextResponse } from "next/server";
import { autoriserRevelation } from "@/lib/debit-contact";
import { getExploitationBySlug } from "@/lib/exploitation";
import { creerClientServeur } from "@/lib/supabase/server";

function adresseIp(request: Request): string {
  const vrai = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return vrai || request.headers.get("x-real-ip")?.trim() || "inconnue";
}

export async function POST(
  request: Request,
  contexte: { params: Promise<{ slug: string }> },
) {
  const { slug } = await contexte.params;
  if (!autoriserRevelation(adresseIp(request))) {
    return NextResponse.json({ erreur: "Trop de demandes." }, { status: 429 });
  }

  const demo = getExploitationBySlug(slug);
  if (demo) {
    if (!demo.detail?.afficher) {
      return NextResponse.json({ telephone: null, email: null });
    }
    return NextResponse.json({
      telephone: demo.detail.telephone,
      email: demo.detail.email,
    });
  }

  const supabase = await creerClientServeur();
  if (!supabase) {
    return NextResponse.json({ erreur: "Indisponible." }, { status: 503 });
  }
  const { data, error } = await supabase.rpc("reveler_contact", { cible: slug });
  if (error) {
    const texte = `${error.code ?? ""} ${error.message ?? ""}`;
    if (texte.includes("trop de demandes") || texte.includes("P0001")) {
      return NextResponse.json({ erreur: "Trop de demandes." }, { status: 429 });
    }
    return NextResponse.json({ erreur: "Indisponible." }, { status: 503 });
  }
  const corps = (data ?? {}) as { telephone?: string | null; email?: string | null };
  return NextResponse.json({
    telephone: corps.telephone ?? null,
    email: corps.email ?? null,
  });
}
