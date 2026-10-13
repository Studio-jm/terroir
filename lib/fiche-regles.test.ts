import assert from "node:assert/strict";
import test from "node:test";
import { deciderEnregistrement, slugDeNom, validerFiche } from "./fiche-regles";
import { communeDe } from "./recherche";
import type { Exploitation } from "./exploitation";

const description = "Fromage et légumes, vendus à la ferme le matin.";

test("refuse une fiche vide et un contact invalide", () => {
  const vide = validerFiche({
    nom: " ",
    commune: "",
    produits: "",
    contact: "",
    description: "",
  });
  assert.equal(vide.ok, false);
  if (!vide.ok) {
    assert.equal(vide.erreurs.nom, "Indiquez le nom de l'exploitation.");
    assert.equal(vide.erreurs.commune, "Indiquez la commune.");
    assert.equal(vide.erreurs.produits, "Indiquez au moins un produit.");
    assert.equal(vide.erreurs.contact, "Indiquez un moyen de contact.");
    assert.equal(vide.erreurs.description, "Décrivez l'exploitation.");
  }

  const contact = validerFiche({
    nom: "Ferme du Test",
    commune: "Nyons",
    produits: "miel",
    contact: "pas un contact",
    description,
  });
  assert.equal(contact.ok, false);
  if (!contact.ok) {
    assert.match(contact.erreurs.contact ?? "", /e-mail/);
    assert.equal(contact.erreurs.nom, undefined);
  }
});

test("accepte un e-mail, un téléphone ou une adresse web", () => {
  for (const valeur of [
    "ferme@example.com",
    "06 12 34 56 78",
    "https://ferme.example",
  ]) {
    const resultat = validerFiche({
      nom: "Ferme du Test",
      commune: "Nyons",
      produits: "miel, pain",
      contact: valeur,
      description,
    });
    assert.equal(resultat.ok, true, valeur);
  }

  const script = validerFiche({
    nom: "Ferme du Test",
    commune: "Nyons",
    produits: "miel",
    contact: "javascript:alert(1)",
    description,
  });
  assert.equal(script.ok, false);
});

test("le slug reste unique et la commune saisie est cherchable", () => {
  assert.equal(slugDeNom("Ferme du Serre", ["ferme-du-serre"]), "ferme-du-serre-2");
  assert.equal(slugDeNom("Ferme des Étoiles", []), "ferme-des-etoiles");

  const exploitation = {
    nom: "Test",
    slug: "test",
    histoire: description,
    produits: ["miel"],
    lieux: [],
    geo: {},
    departement: "",
    region: "",
    liensSoutien: {},
    commune: "Nyons",
  } satisfies Exploitation;
  assert.equal(communeDe(exploitation), "Nyons");
});

test("seul le propriétaire peut modifier sa fiche", () => {
  assert.equal(
    deciderEnregistrement({
      slugDemande: "",
      slugPropre: null,
      cibleEstSienne: false,
    }),
    "creer",
  );
  assert.equal(
    deciderEnregistrement({
      slugDemande: "ferme-autre",
      slugPropre: null,
      cibleEstSienne: false,
    }),
    "refus",
  );
  assert.equal(
    deciderEnregistrement({
      slugDemande: "",
      slugPropre: "ferme-a",
      cibleEstSienne: false,
    }),
    "modifier",
  );
  assert.equal(
    deciderEnregistrement({
      slugDemande: "ferme-a",
      slugPropre: "ferme-a",
      cibleEstSienne: true,
    }),
    "modifier",
  );
  assert.equal(
    deciderEnregistrement({
      slugDemande: "ferme-b",
      slugPropre: "ferme-a",
      cibleEstSienne: false,
    }),
    "refus",
  );
});
