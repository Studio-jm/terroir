import Link from "next/link";
import { listExploitations } from "@/lib/exploitation";

export default function Home() {
  const exploitations = listExploitations();

  return (
    <main>
      <h1>Terroir</h1>
      <p>Plateforme petits producteurs — en construction.</p>
      <section>
        <h2>Exploitations</h2>
        <ul>
          {exploitations.map((exploitation) => (
            <li key={exploitation.slug}>
              <Link href={`/e/${exploitation.slug}`}>{exploitation.nom}</Link>
              {exploitation.geo.address
                ? ` — ${exploitation.geo.address}`
                : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
