import assert from "node:assert/strict";
import test from "node:test";
import {
  champsLot1DepuisFormulaire,
  colonnesLot1,
  creerLot1Vide,
  libelleMiseAJour,
  ligneContact,
  validerLot1,
  type ChampsLot1,
} from "./fiche-lot1";

function saisie(partiel: Partial<ChampsLot1> = {}): ChampsLot1 {
  return { ...creerLot1Vide(), ...partiel };
}

test("une section vide reste vide", () => {
  const resultat = validerLot1(saisie());
  assert.equal(resultat.ok, true);
  if (!resultat.ok) return;
  assert.equal(resultat.valeur.presentation, null);
  assert.deepEqual(resultat.valeur.offres, []);
  assert.equal(resultat.valeur.afficher, false);
  assert.equal(ligneContact(resultat.valeur), null);
  assert.equal("telephone" in colonnesLot1(resultat.valeur), false);
  assert.equal("email" in colonnesLot1(resultat.valeur), false);
});

test("la présentation tient en 280 caractères", () => {
  const juste = validerLot1(saisie({ presentation: "a".repeat(280) }));
  assert.equal(juste.ok, true);
  if (juste.ok) assert.equal(juste.valeur.presentation?.length, 280);

  const trop = validerLot1(saisie({ presentation: "a".repeat(281) }));
  assert.equal(trop.ok, false);
  if (!trop.ok) {
    assert.equal(trop.erreurs.presentation, "Présentation : 280 caractères maximum.");
  }
});

test("un produit incomplet est refusé, un produit complet est gardé", () => {
  const partiel = validerLot1(
    saisie({ offres: [{ categorie: "miel", nom: "", mois: ["6"] }] }),
  );
  assert.equal(partiel.ok, false);
  if (!partiel.ok) assert.match(partiel.erreurs.offres ?? "", /^Produits par catégorie :/);

  const complet = validerLot1(
    saisie({
      offres: [{ categorie: "miel", nom: "miel de lavande", mois: ["8", "6", "6"] }],
    }),
  );
  assert.equal(complet.ok, true);
  if (complet.ok) {
    assert.deepEqual(complet.valeur.offres, [
      { categorie: "miel", nom: "miel de lavande", mois: [6, 8] },
    ]);
  }
});

test("un point de vente incomplet est refusé", () => {
  const resultat = validerLot1(
    saisie({
      points: [{ nom: "Marché", commune: "", jour: "mercredi", horaires: "matin" }],
    }),
  );
  assert.equal(resultat.ok, false);
  if (!resultat.ok) assert.match(resultat.erreurs.points ?? "", /^Points de vente :/);
});

test("les horaires exigent une fin après le début, le rendez-vous peut rester seul", () => {
  const inverse = validerLot1(
    saisie({
      jours: {
        ...creerLot1Vide().jours,
        lundi: { debut: "12:00", fin: "09:00" },
      },
    }),
  );
  assert.equal(inverse.ok, false);

  const rendezVous = validerLot1(saisie({ surRendezVous: true }));
  assert.equal(rendezVous.ok, true);
  if (rendezVous.ok) {
    assert.equal(rendezVous.valeur.horaires.surRendezVous, true);
    assert.deepEqual(rendezVous.valeur.horaires.jours, {});
  }
});

test("un contact masqué n'entre pas dans les colonnes publiques", () => {
  const resultat = validerLot1(
    saisie({
      telephone: "06 00 00 00 00",
      email: "ferme@example.com",
      afficherContact: false,
    }),
  );
  assert.equal(resultat.ok, true);
  if (!resultat.ok) return;
  assert.equal(resultat.valeur.afficher, false);
  assert.deepEqual(ligneContact(resultat.valeur), {
    telephone: "06 00 00 00 00",
    email: "ferme@example.com",
    afficher: false,
  });
  const colonnes = colonnesLot1(resultat.valeur);
  assert.equal(JSON.stringify(colonnes).includes("06 00 00 00 00"), false);
  assert.equal(JSON.stringify(colonnes).includes("ferme@example.com"), false);
});

test("afficher sans coordonnée est refusé", () => {
  const resultat = validerLot1(saisie({ afficherContact: true }));
  assert.equal(resultat.ok, false);
  if (!resultat.ok) {
    assert.equal(
      resultat.erreurs.contactPro,
      "Contact : renseignez un téléphone ou un e-mail avant de l'afficher.",
    );
  }
});

test("les liens exigent http ou https", () => {
  const refuse = validerLot1(
    saisie({
      site: "javascript:alert(1)",
      instagram: "exemple.org",
      facebook: "https://example.com/ferme",
    }),
  );
  assert.equal(refuse.ok, false);
  if (!refuse.ok) {
    assert.match(refuse.erreurs.lienSite ?? "", /^Site :/);
    assert.match(refuse.erreurs.lienInstagram ?? "", /^Instagram :/);
  }

  const accepte = validerLot1(saisie({ facebook: "https://example.com/ferme" }));
  assert.equal(accepte.ok, true);
  if (accepte.ok) {
    assert.deepEqual(accepte.valeur.liens, { facebook: "https://example.com/ferme" });
  }
});

test("le formulaire coche afficher seulement si la case est envoyée", () => {
  const vide = new FormData();
  assert.equal(champsLot1DepuisFormulaire(vide).afficherContact, false);

  const coche = new FormData();
  coche.set("afficher-contact", "oui");
  coche.set("telephone", "06 00 00 00 00");
  coche.set("sur-rendezvous", "oui");
  coche.append("mode", "ferme");
  coche.append("mode", "amap");
  const champs = champsLot1DepuisFormulaire(coche);
  assert.equal(champs.afficherContact, true);
  assert.equal(champs.surRendezVous, true);
  assert.deepEqual(champs.modes, ["ferme", "amap"]);
  assert.equal(champs.telephone, "06 00 00 00 00");
});

test("la date de mise à jour s'écrit en français", () => {
  assert.equal(libelleMiseAJour(""), "");
  assert.equal(
    libelleMiseAJour("2026-10-13T08:00:00.000Z"),
    "Dernière mise à jour : 13 octobre 2026.",
  );
});
