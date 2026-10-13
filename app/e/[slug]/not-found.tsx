import Link from "next/link";

export default function ExploitationIntrouvable() {
  return (
    <main>
      <p>
        <Link href="/">Terroir</Link>
      </p>
      <h1>Exploitation introuvable</h1>
      <p>Aucune fiche ne correspond à cette adresse.</p>
    </main>
  );
}
