import { Suspense } from "react";
import type { Exploitation } from "@/lib/exploitation";
import { listExploitationsPubliques } from "@/lib/publications";
import { AccueilCoque } from "./accueil-coque";
import { ChampRecherche } from "./champ-recherche";
import { ListeExploitations } from "./liste-exploitations";
import { RechercheExploitations } from "./recherche-exploitations";

export default async function Home() {
  const exploitations = await listExploitationsPubliques();

  return (
    <Suspense fallback={<RechercheFallback exploitations={exploitations} />}>
      <RechercheExploitations exploitations={exploitations} />
    </Suspense>
  );
}

function annonceDe(count: number): string {
  if (count === 1) return "1 exploitation";
  return `${count} exploitations`;
}

function RechercheFallback({
  exploitations,
}: {
  exploitations: Exploitation[];
}) {
  return (
    <AccueilCoque
      recherche={<ChampRecherche value="" readOnly />}
      annonce={
        <p id="annonce-resultats" className="mt-3 text-base" role="status">
          {annonceDe(exploitations.length)}
        </p>
      }
      liste={<ListeExploitations exploitations={exploitations} />}
    />
  );
}
