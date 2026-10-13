import Image from "next/image";
import { photoBandeau } from "@/lib/visuel";
import { LienAccueil } from "./lien-accueil";
import { Pied } from "./pied";

export function MessageIntrouvable({
  titre,
  texte,
}: {
  titre: string;
  texte: string;
}) {
  return (
    <main className="page">
      <div className="mx-auto grid w-full min-w-0 max-w-6xl items-center gap-4 px-4 py-6 md:grid-cols-2 md:gap-10 md:py-8">
        <div className="min-w-0">
          <h1 className="text-3xl leading-tight md:text-5xl">{titre}</h1>
          <p className="text-base leading-relaxed text-encre-douce">{texte}</p>
          <p>
            <LienAccueil>Retour à l&apos;accueil</LienAccueil>
          </p>
        </div>
        <div className="relative h-40 overflow-hidden rounded-lg md:h-72">
          <Image
            src={photoBandeau.src}
            alt={photoBandeau.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
      <Pied photo={photoBandeau} />
    </main>
  );
}
