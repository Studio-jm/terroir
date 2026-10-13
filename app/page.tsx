import { listExploitations } from "@/lib/exploitation";
import { RechercheExploitations } from "./recherche-exploitations";

export default function Home() {
  const exploitations = listExploitations();

  return (
    <main>
      <h1>Terroir</h1>
      <p>Plateforme petits producteurs — en construction.</p>
      <RechercheExploitations exploitations={exploitations} />
    </main>
  );
}
