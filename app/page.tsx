import { Suspense } from "react";
import { listExploitations, type Exploitation } from "@/lib/exploitation";
import { ListeExploitations } from "./liste-exploitations";
import { RechercheExploitations } from "./recherche-exploitations";

export default function Home() {
  const exploitations = listExploitations();

  return (
    <main>
      <h1>Terroir</h1>
      <p>Plateforme petits producteurs — en construction.</p>
      <Suspense fallback={<RechercheFallback exploitations={exploitations} />}>
        <RechercheExploitations exploitations={exploitations} />
      </Suspense>
    </main>
  );
}

function RechercheFallback({
  exploitations,
}: {
  exploitations: Exploitation[];
}) {
  const annonce =
    exploitations.length === 1
      ? "1 exploitation"
      : `${exploitations.length} exploitations`;

  return (
    <section>
      <h2>Exploitations</h2>
      <form className="recherche" role="search">
        <label htmlFor="recherche-exploitation">
          Rechercher par nom, description, lieu ou produit
        </label>
        <div className="recherche-ligne">
          <input
            id="recherche-exploitation"
            name="q"
            type="search"
            readOnly
            defaultValue=""
          />
          <button type="button" disabled>
            Effacer
          </button>
        </div>
      </form>
      <p className="resultats">{annonce}</p>
      <ListeExploitations exploitations={exploitations} />
    </section>
  );
}
