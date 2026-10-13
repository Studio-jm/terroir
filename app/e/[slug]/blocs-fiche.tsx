import {
  CATEGORIES,
  JOURS,
  LIENS,
  MODES,
  PAIEMENTS,
  libelleDe,
  libelleMiseAJour,
  libelleMois,
  type Lot1Valeur,
} from "@/lib/fiche-lot1";
import type { Exploitation, LiensSoutien } from "@/lib/exploitation";
import { LIEN_SOUTIEN_LABELS } from "@/lib/exploitation";

export function BlocsFiche({ exploitation }: { exploitation: Exploitation }) {
  const detail = exploitation.detail;
  const date = libelleMiseAJour(exploitation.updatedAt ?? "");
  return (
    <>
      {detail?.presentation ? (
        <section className="panneau md:col-span-2">
          <h2 className="text-2xl">En bref</h2>
          <p>{detail.presentation}</p>
        </section>
      ) : null}
      {detail && detail.offres.length > 0 ? (
        <section className="panneau md:col-span-2">
          <h2 className="text-2xl">Produits par catégorie</h2>
          <ul className="liste">
            {detail.offres.map((offre) => (
              <li key={`${offre.categorie}-${offre.nom}`}>
                {libelleDe(CATEGORIES, offre.categorie)}
                {" : "}
                {offre.nom}
                {" ("}
                {libelleMois(offre.mois)}
                {")"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {detail && detail.modes.length > 0 ? (
        <section className="panneau">
          <h2 className="text-2xl">Modes de vente</h2>
          <ul className="pastilles">
            {detail.modes.map((mode) => (
              <li key={mode}>{libelleDe(MODES, mode)}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {detail && detail.points.length > 0 ? (
        <section className="panneau">
          <h2 className="text-2xl">Points de vente</h2>
          <ul className="liste">
            {detail.points.map((point) => (
              <li key={`${point.nom}-${point.jour}`}>
                {point.nom}, {point.commune}, {libelleDe(JOURS, point.jour)}, {point.horaires}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {detail && (detail.horaires.surRendezVous || Object.keys(detail.horaires.jours).length > 0) ? (
        <section className="panneau">
          <h2 className="text-2xl">Horaires à la ferme</h2>
          <ul className="liste">
            {JOURS.filter(([jour]) => detail.horaires.jours[jour]).map(([jour, label]) => {
              const creneau = detail.horaires.jours[jour];
              return (
                <li key={jour}>
                  {label} {creneau?.debut} à {creneau?.fin}
                </li>
              );
            })}
            {detail.horaires.surRendezVous ? <li>Sur rendez-vous</li> : null}
          </ul>
        </section>
      ) : null}
      {detail && detail.paiements.length > 0 ? (
        <section className="panneau">
          <h2 className="text-2xl">Moyens de paiement</h2>
          <ul className="pastilles">
            {detail.paiements.map((paiement) => (
              <li key={paiement}>{libelleDe(PAIEMENTS, paiement)}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {detail && detail.labels.length > 0 ? (
        <section className="panneau">
          <h2 className="text-2xl">Labels déclarés par le producteur</h2>
          <ul className="pastilles">
            {detail.labels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <LiensPublics detail={detail} soutien={exploitation.liensSoutien} />
      {date ? (
        <p className="text-base text-encre-douce md:col-span-2">{date}</p>
      ) : null}
    </>
  );
}

function LiensPublics({
  detail,
  soutien,
}: {
  detail?: Lot1Valeur;
  soutien: LiensSoutien;
}) {
  const depuisDetail = LIENS.flatMap(([cle, label]) => {
    const url = detail?.liens[cle];
    return url ? [{ cle, label: cle === "autre" ? "Autre lien" : label, url }] : [];
  });
  const deja = new Set(depuisDetail.map((lien) => lien.url));
  const depuisSoutien = (
    Object.entries(soutien) as [keyof LiensSoutien, string | undefined][]
  ).flatMap(([cle, url]) =>
    url && !deja.has(url) ? [{ cle, label: LIEN_SOUTIEN_LABELS[cle], url }] : [],
  );
  const liens = [...depuisDetail, ...depuisSoutien];
  if (liens.length === 0) return null;
  return (
    <section className="panneau">
      <h2 className="text-2xl">Site et réseaux</h2>
      <ul className="liste">
        {liens.map((lien) => (
          <li key={`${lien.cle}-${lien.url}`}>
            <a href={lien.url} rel="nofollow noopener">
              {lien.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
