import { LienAccueil } from "../../lien-accueil";

export default function ExploitationIntrouvable() {
  return (
    <main>
      <h1>Fiche introuvable</h1>
      <p>Aucune fiche ne correspond à cette adresse.</p>
      <p>
        <LienAccueil>Retour à l&apos;accueil</LienAccueil>
      </p>
    </main>
  );
}
