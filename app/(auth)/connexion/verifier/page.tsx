import type { Metadata } from "next";
import Link from "next/link";
import { confirmerConnexion } from "@/app/actions/auth";
import { MESSAGES_LIEN, type CodeLien } from "@/lib/etat-compte";

export const metadata: Metadata = {
  title: "Confirmer la connexion — Terroir",
};

function messageEtat(etat: string | undefined): string | null {
  if (!etat) return null;
  if (etat in MESSAGES_LIEN) return MESSAGES_LIEN[etat as CodeLien];
  return MESSAGES_LIEN.invalide;
}

export default async function VerifierPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; etat?: string }>;
}) {
  const { token, etat } = await searchParams;
  const message = messageEtat(etat);
  const jeton = token?.slice(0, 200) ?? "";

  return (
    <main>
      <h1>Confirmer la connexion</h1>
      {message ? (
        <p className="erreur" role="alert">
          {message}
        </p>
      ) : null}
      {jeton && !message ? (
        <>
          <p>Ouvrez votre espace producteur avec ce lien à usage unique.</p>
          <form action={confirmerConnexion} className="formulaire">
            <input type="hidden" name="token" value={jeton} />
            <button type="submit">Confirmer la connexion</button>
          </form>
        </>
      ) : (
        <p>
          <Link href="/connexion">Demander un nouveau lien</Link>
        </p>
      )}
    </main>
  );
}
