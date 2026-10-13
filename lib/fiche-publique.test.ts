import assert from "node:assert/strict";
import test from "node:test";
import { listExploitations } from "./exploitation";
import { ficheSansCoordonnees } from "./fiche-lot2";
import { filtrerExploitations } from "./recherche";

test("le filtre catégorie garde le miel et écarte la ferme sans miel", () => {
  const miel = filtrerExploitations(listExploitations(), "", { categorie: "miel" });
  assert.deepEqual(
    miel.map((fiche) => fiche.slug),
    ["ferme-du-serre", "rucher-de-nulle-part"],
  );
});

test("le filtre mode de vente ne garde que l'AMAP", () => {
  const amap = filtrerExploitations(listExploitations(), "", { mode: "amap" });
  assert.deepEqual(
    amap.map((fiche) => fiche.slug),
    ["ferme-des-nuages"],
  );
});

test("une fiche sans téléphone n'expose pas de numéro", () => {
  const nuages = listExploitations().find((fiche) => fiche.slug === "ferme-des-nuages");
  assert.equal(nuages?.detail?.telephone, null);
  assert.equal(nuages?.detail?.email, null);
});

test("la fiche publique ne contient ni e-mail ni téléphone", () => {
  const serre = listExploitations().find((fiche) => fiche.slug === "ferme-du-serre");
  assert.ok(serre);
  const publique = ficheSansCoordonnees(serre);
  const json = JSON.stringify(publique);
  assert.equal(json.includes("serre@example.com"), false);
  assert.equal(json.includes("06 00 00 00 00"), false);
  assert.equal(json.includes("0600000000"), false);
  assert.equal(publique.complement?.contactAffichable, true);
  assert.equal(publique.complement?.carte?.precis, false);
  assert.equal(publique.complement?.actualites.length, 3);
});
