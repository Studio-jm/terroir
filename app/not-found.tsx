import { LienAccueil } from "./lien-accueil";

export default function NotFound() {
  return (
    <main>
      <h1>Page introuvable</h1>
      <p>Cette adresse ne correspond à aucune page.</p>
      <p>
        <LienAccueil>Retour à l&apos;accueil</LienAccueil>
      </p>
    </main>
  );
}
