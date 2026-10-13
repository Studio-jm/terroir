import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { creditsPhotos, etapes, photoBandeau } from "@/lib/visuel";

export function AccueilCoque({
  recherche,
  annonce,
  liste,
}: {
  recherche: ReactNode;
  annonce: ReactNode;
  liste: ReactNode;
}) {
  const credits = creditsPhotos();

  return (
    <main className="accueil">
      <section aria-labelledby="accroche" className="border-b border-creme-fonce">
        <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 py-4 md:grid-cols-2 md:gap-10 md:py-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-terre uppercase">
              Petits producteurs
            </p>
            <h1
              id="accroche"
              className="font-display mt-1 text-3xl leading-tight text-encre md:text-5xl"
            >
              Le marché, près de chez vous
            </h1>
            <p className="mt-2 max-w-prose text-base leading-relaxed text-encre-douce">
              Des fiches pour trouver un producteur. Nom, commune ou produit.
            </p>
            {recherche}
          </div>
          <div className="relative h-40 overflow-hidden rounded-lg md:h-80">
            <Image
              src={photoBandeau.src}
              alt={photoBandeau.alt}
              fill
              preload
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="etapes-titre"
        className="mx-auto max-w-6xl px-4 py-8"
      >
        <h2
          id="etapes-titre"
          className="font-display text-2xl text-encre md:text-3xl"
        >
          Comment ça marche
        </h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {etapes.map((etape, index) => (
            <li
              key={etape.titre}
              className="rounded-lg bg-sauge-claire px-4 py-4 text-encre"
            >
              <p className="font-display text-lg">
                {index + 1}. {etape.titre}
              </p>
              <p className="mt-1 text-base leading-relaxed">{etape.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="fiches-titre"
        className="border-y border-creme-fonce bg-creme-fonce/40"
      >
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h2
            id="fiches-titre"
            className="font-display text-2xl text-encre md:text-3xl"
          >
            Les fiches
          </h2>
          {annonce}
          <div className="mt-4">{liste}</div>
        </div>
      </section>

      <section aria-labelledby="producteur-titre" className="bg-sauge text-creme">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 id="producteur-titre" className="font-display text-3xl leading-tight">
            <Link
              href="/inscription"
              className="text-creme underline decoration-2 underline-offset-4"
            >
              Vous êtes producteur ?
            </Link>
          </h2>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-creme">
            Ouvrez la fiche de votre exploitation. Les habitants la trouvent
            par la recherche.
          </p>
        </div>
      </section>

      <footer aria-labelledby="pied-titre" className="bg-encre text-creme">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h2 id="pied-titre" className="font-display text-xl">
            Terroir
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-creme">
            Photos publiées sur Unsplash, {credits[0].licence}.
          </p>
          <ul className="mt-3 space-y-1 text-sm leading-relaxed">
            {credits.map((photo) => (
              <li key={photo.src}>
                <a
                  href={photo.page}
                  className="text-creme underline underline-offset-2"
                >
                  {photo.alt}
                </a>
                {" · "}
                <a
                  href={photo.profil}
                  className="text-creme underline underline-offset-2"
                >
                  {photo.auteur}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </main>
  );
}
