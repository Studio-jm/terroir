import assert from "node:assert/strict";
import test from "node:test";
import { listExploitations } from "./exploitation";
import { htmlObfusque } from "./fiche-lot1";
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

test("l'e-mail public n'apparaît pas en clair dans le HTML obfusqué", () => {
  const html = htmlObfusque("serre@example.com");
  assert.equal(html.includes("serre@example.com"), false);
  assert.equal(html.includes("@"), false);
  assert.match(html, /&#64;/);
});
