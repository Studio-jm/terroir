import Link from "next/link";
import { BoutonDeconnexion } from "@/app/bouton-deconnexion";
import { utilisateurCourant } from "@/lib/supabase/session";

export async function Barre() {
  const utilisateur = await utilisateurCourant();

  return (
    <header className="barre">
      <Link href="/">Terroir</Link>
      <nav aria-label="Compte">
        {utilisateur ? (
          <>
            <Link href="/espace">Mon espace</Link>
            <BoutonDeconnexion />
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
