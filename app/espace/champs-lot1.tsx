"use client";

import { useState } from "react";
import {
  CATEGORIES,
  JOURS,
  LIENS,
  MOIS,
  MODES,
  PAIEMENTS,
  type ChampsLot1,
  type CleLot1,
} from "@/lib/fiche-lot1";

export function ChampsLot1({
  lot1,
  erreurs,
}: {
  lot1: ChampsLot1;
  erreurs: Partial<Record<CleLot1, string>>;
}) {
  const [nombreOffres, setNombreOffres] = useState(() =>
    Math.min(12, Math.max(lot1.offres.length, 1)),
  );
  const [nombrePoints, setNombrePoints] = useState(() =>
    Math.min(12, Math.max(lot1.points.length, 1)),
  );
  const [reste, setReste] = useState(280 - lot1.presentation.length);

  return (
    <>
      <div className="champ">
        <label htmlFor="presentation">Présentation courte</label>
        <textarea
          id="presentation"
          name="presentation"
          rows={3}
          maxLength={280}
          defaultValue={lot1.presentation}
          aria-invalid={erreurs.presentation ? true : undefined}
          aria-describedby={
            erreurs.presentation ? "presentation-aide presentation-erreur" : "presentation-aide"
          }
          onChange={(event) => setReste(280 - event.target.value.length)}
        />
        <p id="presentation-aide" className="aide">
          {reste} caractères restants. Texte brut, 280 maximum.
        </p>
        {erreurs.presentation ? (
          <p id="presentation-erreur" className="erreur" role="alert">
            {erreurs.presentation}
          </p>
        ) : null}
      </div>

      <fieldset className="groupe" aria-describedby={erreurs.offres ? "offres-erreur" : undefined}>
        <legend>Produits par catégorie</legend>
        <p className="aide">Nom, catégorie et mois de disponibilité. Laissez une ligne vide pour l&apos;ignorer.</p>
        {Array.from({ length: nombreOffres }, (_, index) => {
          const offre = lot1.offres[index] ?? { categorie: "", nom: "", mois: [] };
          return (
            <div className="ligne-offre" key={index}>
              <label className="champ champ-compact" htmlFor={`offre-nom-${index}`}>
                Nom
                <input
                  id={`offre-nom-${index}`}
                  name={`offre-nom-${index}`}
                  defaultValue={offre.nom}
                  maxLength={40}
                />
              </label>
              <label className="champ champ-compact" htmlFor={`offre-categorie-${index}`}>
                Catégorie
                <select
                  id={`offre-categorie-${index}`}
                  name={`offre-categorie-${index}`}
                  defaultValue={offre.categorie}
                >
                  <option value="">Choisir</option>
                  {CATEGORIES.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="mois">
                <legend>Mois</legend>
                {MOIS.map(([numero, label]) => (
                  <label className="choix" key={numero}>
                    <input
                      type="checkbox"
                      name={`offre-mois-${index}`}
                      value={numero}
                      defaultChecked={offre.mois.includes(String(numero))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          );
        })}
        {nombreOffres < 12 ? (
          <button type="button" onClick={() => setNombreOffres((n) => Math.min(12, n + 1))}>
            Ajouter un produit
          </button>
        ) : null}
        {erreurs.offres ? (
          <p id="offres-erreur" className="erreur" role="alert">
            {erreurs.offres}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="groupe" aria-describedby={erreurs.modes ? "modes-erreur" : undefined}>
        <legend>Modes de vente</legend>
        {MODES.map(([id, label]) => (
          <label className="choix" key={id}>
            <input type="checkbox" name="mode" value={id} defaultChecked={lot1.modes.includes(id)} />
            <span>{label}</span>
          </label>
        ))}
        {erreurs.modes ? (
          <p id="modes-erreur" className="erreur" role="alert">
            {erreurs.modes}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="groupe" aria-describedby={erreurs.points ? "points-erreur" : undefined}>
        <legend>Points de vente</legend>
        {Array.from({ length: nombrePoints }, (_, index) => {
          const point = lot1.points[index] ?? { nom: "", commune: "", jour: "", horaires: "" };
          return (
            <div className="ligne-offre" key={index}>
              <label className="champ champ-compact" htmlFor={`point-nom-${index}`}>
                Nom
                <input id={`point-nom-${index}`} name={`point-nom-${index}`} defaultValue={point.nom} maxLength={80} />
              </label>
              <label className="champ champ-compact" htmlFor={`point-commune-${index}`}>
                Commune
                <input
                  id={`point-commune-${index}`}
                  name={`point-commune-${index}`}
                  defaultValue={point.commune}
                  maxLength={80}
                />
              </label>
              <label className="champ champ-compact" htmlFor={`point-jour-${index}`}>
                Jour
                <select id={`point-jour-${index}`} name={`point-jour-${index}`} defaultValue={point.jour}>
                  <option value="">Choisir</option>
                  {JOURS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="champ champ-compact" htmlFor={`point-horaires-${index}`}>
                Horaires
                <input
                  id={`point-horaires-${index}`}
                  name={`point-horaires-${index}`}
                  defaultValue={point.horaires}
                  maxLength={80}
                />
              </label>
            </div>
          );
        })}
        {nombrePoints < 12 ? (
          <button type="button" onClick={() => setNombrePoints((n) => Math.min(12, n + 1))}>
            Ajouter un point de vente
          </button>
        ) : null}
        {erreurs.points ? (
          <p id="points-erreur" className="erreur" role="alert">
            {erreurs.points}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="groupe" aria-describedby={erreurs.horaires ? "horaires-erreur" : "horaires-aide"}>
        <legend>Horaires de vente à la ferme</legend>
        <p id="horaires-aide" className="aide">
          Laissez un jour vide s&apos;il n&apos;y a pas de vente ce jour-là.
        </p>
        {JOURS.map(([jour, label]) => (
          <div className="horaires-jour" key={jour}>
            <span className="jour">{label}</span>
            <label htmlFor={`horaire-${jour}-debut`}>
              Début
              <input
                id={`horaire-${jour}-debut`}
                name={`horaire-${jour}-debut`}
                type="time"
                defaultValue={lot1.jours[jour].debut}
              />
            </label>
            <label htmlFor={`horaire-${jour}-fin`}>
              Fin
              <input
                id={`horaire-${jour}-fin`}
                name={`horaire-${jour}-fin`}
                type="time"
                defaultValue={lot1.jours[jour].fin}
              />
            </label>
          </div>
        ))}
        <label className="choix">
          <input
            type="checkbox"
            name="sur-rendezvous"
            value="oui"
            defaultChecked={lot1.surRendezVous}
          />
          <span>Sur rendez-vous</span>
        </label>
        {erreurs.horaires ? (
          <p id="horaires-erreur" className="erreur" role="alert">
            {erreurs.horaires}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="groupe">
        <legend>Moyens de paiement</legend>
        {PAIEMENTS.map(([id, label]) => (
          <label className="choix" key={id}>
            <input
              type="checkbox"
              name="paiement"
              value={id}
              defaultChecked={lot1.paiements.includes(id)}
            />
            <span>{label}</span>
          </label>
        ))}
        {erreurs.paiements ? (
          <p className="erreur" role="alert">
            {erreurs.paiements}
          </p>
        ) : null}
      </fieldset>

      <div className="champ">
        <label htmlFor="labels">Labels</label>
        <input
          id="labels"
          name="labels"
          type="text"
          maxLength={500}
          defaultValue={lot1.labels}
          aria-invalid={erreurs.labels ? true : undefined}
          aria-describedby={erreurs.labels ? "labels-aide labels-erreur" : "labels-aide"}
        />
        <p id="labels-aide" className="aide">
          Séparez les labels par des virgules. Sur la fiche, ils seront indiqués comme déclarés par
          le producteur.
        </p>
        {erreurs.labels ? (
          <p id="labels-erreur" className="erreur" role="alert">
            {erreurs.labels}
          </p>
        ) : null}
      </div>

      <fieldset
        className="groupe"
        aria-describedby={erreurs.contactPro ? "contact-pro-erreur" : "contact-pro-aide"}
      >
        <legend>Téléphone et e-mail professionnels</legend>
        <p id="contact-pro-aide" className="aide">
          La case est décochée par défaut. Tant qu&apos;elle l&apos;est, ces coordonnées restent
          absentes de la fiche publique.
        </p>
        <label className="champ" htmlFor="telephone">
          Téléphone
          <input
            id="telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            defaultValue={lot1.telephone}
            aria-invalid={erreurs.telephone ? true : undefined}
          />
        </label>
        {erreurs.telephone ? (
          <p className="erreur" role="alert">
            {erreurs.telephone}
          </p>
        ) : null}
        <label className="champ" htmlFor="email-pro">
          E-mail
          <input
            id="email-pro"
            name="email-pro"
            type="email"
            autoComplete="email"
            maxLength={254}
            defaultValue={lot1.email}
            aria-invalid={erreurs.email ? true : undefined}
          />
        </label>
        {erreurs.email ? (
          <p className="erreur" role="alert">
            {erreurs.email}
          </p>
        ) : null}
        <label className="choix">
          <input
            type="checkbox"
            name="afficher-contact"
            value="oui"
            defaultChecked={lot1.afficherContact}
          />
          <span>Afficher le téléphone et l&apos;e-mail sur la fiche publique</span>
        </label>
        {erreurs.contactPro ? (
          <p id="contact-pro-erreur" className="erreur" role="alert">
            {erreurs.contactPro}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="groupe">
        <legend>Site et réseaux</legend>
        <p className="aide">Adresse complète, en http:// ou https://.</p>
        {LIENS.map(([cle, label]) => {
          const erreur =
            cle === "site"
              ? erreurs.lienSite
              : cle === "instagram"
                ? erreurs.lienInstagram
                : cle === "facebook"
                  ? erreurs.lienFacebook
                  : erreurs.lienAutre;
          return (
            <label className="champ" htmlFor={`lien-${cle}`} key={cle}>
              {label}
              <input
                id={`lien-${cle}`}
                name={`lien-${cle}`}
                type="url"
                inputMode="url"
                maxLength={300}
                defaultValue={lot1[cle]}
                aria-invalid={erreur ? true : undefined}
              />
              {erreur ? (
                <span className="erreur" role="alert">
                  {erreur}
                </span>
              ) : null}
            </label>
          );
        })}
      </fieldset>
    </>
  );
}
