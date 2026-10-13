import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AfficheLot2 } from "@/app/e/[slug]/affiche-lot2";
import { BlocsFiche } from "@/app/e/[slug]/blocs-fiche";
import { lienContact } from "@/lib/fiche-regles";
import type { Exploitation } from "@/lib/exploitation";
import { exploitationPublique } from "@/lib/publications";
import { photoPour } from "@/lib/visuel";
import { LienAccueil } from "../../lien-accueil";
import { Pied } from "../../pied";

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
            <a href={href} rel={externe ? "nofollow noopener" : undefined}>
      {contact}
    </a>
  );
}

function ExploitationView({ exploitation }: { exploitation: Exploitation }) {
  const { nom, histoire, produits, lieux } = exploitation;
  const photo = photoPour(exploitation.slug);

  return (
    <main className="page">
      <section className="border-b border-creme-fonce">
        <div className="mx-auto grid w-full min-w-0 max-w-6xl items-center gap-4 px-4 py-4 md:grid-cols-2 md:gap-10 md:py-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-terre uppercase">
              <LienAccueil>Terroir</LienAccueil>
            </p>
            <h1 className="mt-1 text-3xl leading-tight md:text-5xl">{nom}</h1>
          </div>
          <div className="relative h-40 min-w-0 overflow-hidden rounded-lg md:h-80">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              preload
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-4 px-4 py-8 md:grid-cols-2">
        <AfficheLot2 slug={exploitation.slug} complement={exploitation.complement} />
        <section className="panneau md:col-span-2">
          <h2 className="text-2xl">Histoire</h2>
          {histoire.split("\n\n").map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>

        {exploitation.contact ? (
          <section className="panneau">
            <h2 className="text-2xl">Contact</h2>
            <p>
              <ContactTexte contact={exploitation.contact} />
            </p>
          </section>
        ) : null}

        <BlocsFiche exploitation={exploitation} />

        <section className="panneau">
          <h2 className="text-2xl">Produits</h2>
          <ul className="pastilles">
            {produits.map((produit) => (
              <li key={produit}>{produit}</li>
            ))}
          </ul>
        </section>

        <section className="panneau">
          <h2 className="text-2xl">Lieux</h2>
          <ul className="liste">
            {lieux.map((lieu) => (
              <li key={lieu.label}>
                {lieu.label}
                {lieu.address ? ` — ${lieu.address}` : null}
              </li>
            ))}
          </ul>
        </section>

      </div>
      <Pied photo={photo} />
    </main>
  );
}
