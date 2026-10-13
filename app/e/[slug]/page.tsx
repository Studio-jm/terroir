import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { lienContact } from "@/lib/fiche-regles";
import {
  LIEN_SOUTIEN_LABELS,
  type Exploitation,
  type LiensSoutien,
} from "@/lib/exploitation";
import { exploitationPublique } from "@/lib/publications";
import { LienAccueil } from "../../lien-accueil";

export async function generateMetadata({
  params,
}: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const exploitation = await exploitationPublique(slug);
  if (!exploitation) {
    return { title: "Exploitation introuvable" };
  }
  return { title: `${exploitation.nom} — Terroir` };
}

export default async function ExploitationPage({
  params,
}: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const exploitation = await exploitationPublique(slug);
  if (!exploitation) {
    notFound();
  }

  return <ExploitationView exploitation={exploitation} />;
}

function ContactTexte({ contact }: { contact: string }) {
  const href = lienContact(contact);
  if (!href) return contact;
  const externe = href.startsWith("http://") || href.startsWith("https://");
  return (
    <a href={href} rel={externe ? "noreferrer" : undefined}>
      {contact}
    </a>
  );
}

function ExploitationView({ exploitation }: { exploitation: Exploitation }) {
  const { nom, histoire, produits, lieux, geo, liensSoutien } = exploitation;
  const soutienEntries = (
    Object.entries(liensSoutien) as [keyof LiensSoutien, string][]
  ).filter(([, url]) => Boolean(url));
  const osmHref =
    geo.lat != null && geo.lng != null
      ? `https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lng}#map=13/${geo.lat}/${geo.lng}`
      : geo.address
        ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(geo.address)}`
        : null;

  return (
    <main>
      <p>
        <LienAccueil>Terroir</LienAccueil>
      </p>
      <h1>{nom}</h1>

      <section>
        <h2>Histoire</h2>
        {histoire.split("\n\n").map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      {exploitation.contact ? (
        <section>
          <h2>Contact</h2>
          <p>
            <ContactTexte contact={exploitation.contact} />
          </p>
        </section>
      ) : null}

      <section>
        <h2>Produits</h2>
        <ul>
          {produits.map((produit) => (
            <li key={produit}>{produit}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Lieux</h2>
        <ul>
          {lieux.map((lieu) => (
            <li key={lieu.label}>
              {lieu.label}
              {lieu.address ? ` — ${lieu.address}` : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Carte</h2>
        <p>
          <span aria-hidden="true">📍 </span>
          {geo.address ?? nom}
          {geo.lat != null && geo.lng != null
            ? ` (${geo.lat}, ${geo.lng})`
            : null}
        </p>
        {osmHref ? (
          <p>
            <a href={osmHref} rel="noreferrer">
              Voir le pin sur OpenStreetMap
            </a>
          </p>
        ) : null}
      </section>

      {soutienEntries.length > 0 ? (
        <section>
          <h2>Soutenir</h2>
          <ul>
            {soutienEntries.map(([kind, url]) => (
              <li key={kind}>
                <a href={url} rel="noreferrer">
                  {LIEN_SOUTIEN_LABELS[kind]}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
