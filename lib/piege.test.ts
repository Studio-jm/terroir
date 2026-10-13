import assert from "node:assert/strict";
import test from "node:test";
import { NOM_PIEGE, nomPiegeInterdit, piegeRempli } from "./piege";

test("le pot de miel n'a le nom d'aucun champ du formulaire", () => {
  assert.equal(nomPiegeInterdit(NOM_PIEGE), false);
  assert.notEqual(NOM_PIEGE, "site_web");
  assert.notEqual(NOM_PIEGE, "contact");
  for (const nom of [
    "email",
    "mot_de_passe",
    "confirmation",
    "slug",
    "nom",
    "commune",
    "produits",
    "contact",
    "description",
    "presentation",
    "telephone",
    "email-pro",
    "afficher-contact",
    "lien-site",
  ]) {
    assert.equal(nomPiegeInterdit(nom), true);
  }
});

test("une valeur dans le pot de miel refuse l'envoi", () => {
  const vide = new FormData();
  vide.set(NOM_PIEGE, "  ");
  assert.equal(piegeRempli(vide), false);

  const rempli = new FormData();
  rempli.append(NOM_PIEGE, "");
  rempli.append(NOM_PIEGE, "https://exemple.org");
  assert.equal(piegeRempli(rempli), true);
});
