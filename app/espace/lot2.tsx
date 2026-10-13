import Image from "next/image";
import {
  creerActualite,
  creerFermeture,
  enregistrerAccueil,
  enregistrerLieu,
  modifierActualite,
  supprimerActualite,
  supprimerFermeture,
  supprimerPhoto,
} from "@/app/actions/lot2";
import { PhotosLot2 } from "@/app/espace/photos-lot2";
import type { Lot2Edition } from "@/lib/lot2-donnees";

export function Lot2({ userId, lot2 }: { userId: string; lot2: Lot2Edition }) {
  return (
    <>
      <section className="panneau mt-4">
        <h2 className="text-2xl">Photos</h2>
        {lot2.photos.length > 0 ? (
          <ul className="liste">
            {lot2.photos.map((photo) => (
              <li key={photo.id}>
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  width={800}
                  height={500}
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                />
                <form action={supprimerPhoto} className="formulaire">
                  <input type="hidden" name="id" value={photo.id} />
                  <button type="submit">Supprimer cette photo</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune photo pour le moment.</p>
        )}
        <PhotosLot2
          userId={userId}
          exploitationId={lot2.exploitationId}
          nombre={lot2.photos.length}
        />
      </section>

      <section className="panneau mt-4">
        <h2 className="text-2xl">Carte</h2>
        <form action={enregistrerLieu} className="formulaire">
          <div className="champ">
            <label htmlFor="adresse">Adresse</label>
            <input
              id="adresse"
              name="adresse"
              type="text"
              maxLength={200}
              defaultValue={lot2.adresse}
            />
            <p className="aide">
              La carte montre la commune. Cochez pour afficher l&apos;adresse exacte.
            </p>
          </div>
          <label className="champ" htmlFor="montrer_adresse_exacte">
            <span>
              <input
                id="montrer_adresse_exacte"
                name="montrer_adresse_exacte"
                type="checkbox"
                value="oui"
                defaultChecked={lot2.montrerAdresseExacte}
              />{" "}
              Autoriser l&apos;adresse exacte sur la carte
            </span>
          </label>
          <button type="submit">Enregistrer la carte</button>
        </form>
      </section>

      <section className="panneau mt-4">
        <h2 className="text-2xl">Fermetures exceptionnelles</h2>
        {lot2.fermetures.length > 0 ? (
          <ul className="liste">
            {lot2.fermetures.map((fermeture) => (
              <li key={fermeture.id}>
                {fermeture.debut} au {fermeture.fin} — {fermeture.motif}
                <form action={supprimerFermeture}>
                  <input type="hidden" name="id" value={fermeture.id} />
                  <button type="submit">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune fermeture.</p>
        )}
        <form action={creerFermeture} className="formulaire">
          <div className="champ">
            <label htmlFor="debut">Début</label>
            <input id="debut" name="debut" type="date" required />
          </div>
          <div className="champ">
            <label htmlFor="fin">Fin</label>
            <input id="fin" name="fin" type="date" required />
          </div>
          <div className="champ">
            <label htmlFor="motif">Motif</label>
            <input id="motif" name="motif" type="text" maxLength={200} required />
          </div>
          <button type="submit">Ajouter la fermeture</button>
        </form>
      </section>

      <section className="panneau mt-4">
        <h2 className="text-2xl">Actualités</h2>
        <p>Les trois dernières sont visibles sur la fiche.</p>
        {lot2.actualites.map((actualite) => (
          <form key={actualite.id} action={modifierActualite} className="formulaire">
            <input type="hidden" name="id" value={actualite.id} />
            <div className="champ">
              <label htmlFor={`titre-${actualite.id}`}>Titre</label>
              <input
                id={`titre-${actualite.id}`}
                name="titre"
                type="text"
                maxLength={120}
                defaultValue={actualite.titre}
                required
              />
            </div>
            <div className="champ">
              <label htmlFor={`texte-${actualite.id}`}>Texte</label>
              <textarea
                id={`texte-${actualite.id}`}
                name="texte"
                maxLength={500}
                rows={3}
                defaultValue={actualite.texte}
                required
              />
            </div>
            <div className="champ">
              <label htmlFor={`date-${actualite.id}`}>Date</label>
              <input
                id={`date-${actualite.id}`}
                name="date_actualite"
                type="date"
                defaultValue={actualite.date}
                required
              />
            </div>
            <button type="submit">Modifier</button>
          </form>
        ))}
        {lot2.actualites.map((actualite) => (
          <form key={`supprimer-${actualite.id}`} action={supprimerActualite}>
            <input type="hidden" name="id" value={actualite.id} />
            <button type="submit">Supprimer « {actualite.titre} »</button>
          </form>
        ))}
        <form action={creerActualite} className="formulaire">
          <div className="champ">
            <label htmlFor="titre-nouveau">Titre</label>
            <input id="titre-nouveau" name="titre" type="text" maxLength={120} required />
          </div>
          <div className="champ">
            <label htmlFor="texte-nouveau">Texte</label>
            <textarea id="texte-nouveau" name="texte" maxLength={500} rows={3} required />
          </div>
          <div className="champ">
            <label htmlFor="date-nouvelle">Date</label>
            <input id="date-nouvelle" name="date_actualite" type="date" required />
          </div>
          <button type="submit">Ajouter l&apos;actualité</button>
        </form>
      </section>

      <section className="panneau mt-4">
        <h2 className="text-2xl">Visites et accueil à la ferme</h2>
        <form action={enregistrerAccueil} className="formulaire">
          <label className="champ" htmlFor="accueil_visite">
            <span>
              <input
                id="accueil_visite"
                name="accueil_visite"
                type="checkbox"
                value="oui"
                defaultChecked={lot2.visite}
              />{" "}
              Visites acceptées
            </span>
          </label>
          <div className="champ">
            <label htmlFor="accueil_conditions">Conditions</label>
            <textarea
              id="accueil_conditions"
              name="accueil_conditions"
              maxLength={500}
              rows={3}
              defaultValue={lot2.conditions}
            />
          </div>
          <div className="champ">
            <label htmlFor="accueil_reservation">Réservation</label>
            <input
              id="accueil_reservation"
              name="accueil_reservation"
              type="text"
              maxLength={200}
              defaultValue={lot2.reservation}
            />
          </div>
          <button type="submit">Enregistrer l&apos;accueil</button>
        </form>
      </section>
    </>
  );
}
