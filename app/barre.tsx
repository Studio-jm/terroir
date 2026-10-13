import Link from "next/link";
import { deconnecter } from "@/app/actions/auth";
import { utilisateurCourant } from "@/lib/session";

export async function Barre() {
  const utilisateur = await utilisateurCourant();

  return (
    <header className="barre">
      <Link href="/">Terroir</Link>
      <nav aria-label="Compte">
        {utilisateur ? (
          <>
            <Link href="/espace">Mon espace</Link>
            <form action={deconnecter}>
              <button type="submit">Déconnexion</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/connexion">Connexion</Link>
            <Link href="/inscription">Inscription</Link>
          </>
        )}
      </nav>
    </header>
  );
}
