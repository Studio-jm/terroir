import Image from "next/image";
import { BoutonContact } from "@/app/e/[slug]/bouton-contact";
import { CarteDifferee } from "@/app/e/[slug]/carte";
import {
  fermetureEnCours,
  libelleDateIso,
  texteFermeture,
  troisDernieres,
  type ComplementFiche,
} from "@/lib/fiche-lot2";

export function AfficheLot2({
  slug,
  complement,
}: {
  slug: string;
  complement?: ComplementFiche;
}) {
  if (!complement) return null;
  const fermeture = fermetureEnCours(complement.fermetures);
  const actualites = troisDernieres(complement.actualites);
  const accueil = complement.accueil;
  return (
    <>
      {fermeture ? (
        <p className="bg-terre px-4 py-3 text-center font-semibold text-creme md:col-span-2" role="status">
          {texteFermeture(fermeture)}
          {fermeture.motif ? `. ${fermeture.motif}.` : ""}
        </p>
      ) : null}
      {complement.photos.length > 0 ? (
        <section className="panneau md:col-span-2">
          <h2 className="text-2xl">Photos</h2>
          <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2">
            {complement.photos.map((photo) => (
              <li key={photo.src}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1200}
                  height={800}
                  className="h-48 w-full rounded-lg object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {complement.carte ? (
        <section className="panneau md:col-span-2">
          <h2 className="text-2xl">Carte</h2>
          <CarteDifferee
            lat={complement.carte.lat}
            lng={complement.carte.lng}
            titre={complement.carte.libelle}
          />
          <p>{complement.carte.precis ? "Adresse exacte autorisée." : "Position de la commune."}</p>
        </section>
      ) : null}
      {actualites.length > 0 ? (
        <section className="panneau md:col-span-2">
          <h2 className="text-2xl">Actualités</h2>
          <ul className="liste">
            {actualites.map((actualite) => (
              <li key={`${actualite.date}-${actualite.titre}`}>
                <strong>{actualite.titre}</strong>
                {" — "}
                {libelleDateIso(actualite.date)}
                <br />
                {actualite.texte}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {accueil && (accueil.visite || accueil.conditions || accueil.reservation) ? (
        <section className="panneau">
          <h2 className="text-2xl">Visites et accueil à la ferme</h2>
          <p>{accueil.visite ? "Visites acceptées." : "Pas de visite pour le moment."}</p>
          {accueil.conditions ? <p>{accueil.conditions}</p> : null}
          {accueil.reservation ? <p>{accueil.reservation}</p> : null}
        </section>
      ) : null}
      {complement.contactAffichable ? <BoutonContact slug={slug} /> : null}
    </>
  );
}
