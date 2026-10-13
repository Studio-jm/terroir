import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { autoriserRevelation } from "./debit-contact";
import { listExploitations } from "./exploitation";
import {
  erreurPhoto,
  fermetureEnCours,
  ficheSansCoordonnees,
  positionPublique,
  texteFermeture,
  troisDernieres,
  PHOTOS_MAX,
  TAILLE_MAX_PHOTO,
} from "./fiche-lot2";
import { retirerMetadonnees } from "./metadonnees";

const secretMail = "serre@example.com";
const secretTel = "06 00 00 00 00";

test("une 7e photo et un fichier de plus de 5 Mo sont refusés", () => {
  assert.equal(
    erreurPhoto({ taille: 1000, type: "image/jpeg", alt: "Chèvre au pré", nombre: PHOTOS_MAX }),
    "6 photos maximum.",
  );
  assert.equal(
    erreurPhoto({
      taille: TAILLE_MAX_PHOTO + 1,
      type: "image/png",
      alt: "Chèvre au pré",
      nombre: 1,
    }),
    "5 Mo maximum.",
  );
  assert.equal(
    erreurPhoto({ taille: 1000, type: "image/jpeg", alt: "  ", nombre: 0 }),
    "Le texte alternatif est obligatoire.",
  );
  assert.equal(
    erreurPhoto({ taille: 1000, type: "image/gif", alt: "Chèvre au pré", nombre: 0 }),
    "Formats acceptés : JPEG, PNG ou WebP.",
  );
  assert.equal(
    erreurPhoto({ taille: 1000, type: "image/webp", alt: "Chèvre au pré", nombre: 2 }),
    null,
  );
});

test("le bandeau suit la date du jour à Paris", () => {
  const plages = [
    { debut: "2026-10-12", fin: "2026-10-20", motif: "Travaux à la fromagerie" },
    { debut: "2020-01-01", fin: "2020-01-02", motif: "Ancienne fermeture" },
  ];
  const pendant = fermetureEnCours(plages, new Date("2026-10-13T12:00:00Z"));
  assert.ok(pendant);
  assert.equal(texteFermeture(pendant), "Fermé jusqu'au 20 octobre 2026");
  const apres = fermetureEnCours(plages, new Date("2026-10-20T22:30:00Z"));
  assert.equal(apres, null);
});

test("seules les trois dernières actualités restent", () => {
  const titres = troisDernieres([
    { titre: "ancienne", date: "2026-01-01" },
    { titre: "août", date: "2026-08-01" },
    { titre: "octobre", date: "2026-10-12" },
    { titre: "septembre", date: "2026-09-02" },
  ]).map((actualite) => actualite.titre);
  assert.deepEqual(titres, ["octobre", "septembre", "août"]);
});

test("la carte reste à la commune tant que l'adresse exacte n'est pas autorisée", () => {
  const commune = positionPublique({
    commune: "Serre-les-Nuages",
    adresse: "chemin du Serre",
    montrerExacte: false,
    latCommune: 44.55,
    lngCommune: 5.72,
    latAdresse: 48.85,
    lngAdresse: 2.35,
  });
  assert.equal(commune?.precis, false);
  assert.equal(commune?.lat, 44.55);
  assert.match(commune?.libelle ?? "", /commune/);
  const exacte = positionPublique({
    commune: "Serre-les-Nuages",
    adresse: "chemin du Serre",
    montrerExacte: true,
    latCommune: 44.55,
    lngCommune: 5.72,
    latAdresse: 48.85,
    lngAdresse: 2.35,
  });
  assert.equal(exacte?.precis, true);
  assert.equal(exacte?.lat, 48.85);
});

test("les métadonnées EXIF et GPS sortent du fichier", () => {
  const gps = new TextEncoder().encode("GPSLatitude");
  const jpeg = concat([
    octets([0xff, 0xd8, 0xff, 0xe1, 0x00, gps.length + 2]),
    gps,
    octets([0xff, 0xd9]),
  ]);
  const jpegPropre = retirerMetadonnees(jpeg);
  assert.equal(new TextDecoder().decode(jpegPropre).includes("GPSLatitude"), false);
  assert.equal(jpegPropre[0], 0xff);
  assert.equal(jpegPropre[1], 0xd8);
  assert.equal(jpegPropre.at(-2), 0xff);
  assert.equal(jpegPropre.at(-1), 0xd9);

  const png = concat([
    octets([137, 80, 78, 71, 13, 10, 26, 10]),
    chunkPng("eXIf", gps),
    chunkPng("IEND", octets([])),
  ]);
  const pngPropre = retirerMetadonnees(png);
  assert.equal(new TextDecoder().decode(pngPropre).includes("GPSLatitude"), false);
  assert.equal(new TextDecoder().decode(pngPropre).includes("IEND"), true);
});

test("le modèle public n'emporte ni l'e-mail ni le téléphone", () => {
  const serre = listExploitations().find((fiche) => fiche.slug === "ferme-du-serre");
  assert.ok(serre);
  const html = JSON.stringify(ficheSansCoordonnees(serre));
  assert.equal(html.includes(secretMail), false);
  assert.equal(html.includes(secretTel), false);
  assert.equal(html.includes(Buffer.from(secretMail).toString("base64")), false);
  assert.equal(html.includes(Buffer.from(secretTel).toString("base64")), false);
  assert.equal(html.includes("&#64;"), false);
});

test("la révélation est limitée en débit", () => {
  const memoire = new Map<string, number[]>();
  for (let i = 0; i < 20; i += 1) {
    assert.equal(autoriserRevelation("203.0.113.8", 1_000 + i, memoire), true);
  }
  assert.equal(autoriserRevelation("203.0.113.8", 2_000, memoire), false);
  assert.equal(autoriserRevelation("203.0.113.9", 2_000, memoire), true);
});

test("la correction retire le delete direct sur storage.objects", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20261013215000_supprimer_compte_storage_api.sql", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(sql, /storage\.objects/);
  assert.match(sql, /delete from public\.actualites where owner_id = auth\.uid\(\)/);
  assert.match(sql, /delete from public\.fermetures where owner_id = auth\.uid\(\)/);
  assert.match(sql, /delete from public\.photos_exploitation where owner_id = auth\.uid\(\)/);
  assert.match(sql, /delete from auth\.users where id = auth\.uid\(\)/);
  assert.doesNotMatch(sql, /service_role/);
});

test("la suppression de compte retire photos, actualités et fermetures", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20261013214257_fiche_lot2.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /photos-exploitations/);
  assert.match(sql, /delete from storage\.objects/);
  assert.match(sql, /delete from public\.actualites where owner_id = auth\.uid\(\)/);
  assert.match(sql, /delete from public\.fermetures where owner_id = auth\.uid\(\)/);
  assert.match(sql, /delete from public\.photos_exploitation where owner_id = auth\.uid\(\)/);
  assert.match(sql, /reveler_contact/);
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.doesNotMatch(sql, /service_role/);
  assert.match(sql, /file_size_limit/);
  assert.match(sql, /5242880/);
});

function octets(valeurs: number[]): Uint8Array {
  return Uint8Array.from(valeurs);
}

function concat(morceaux: Uint8Array[]): Uint8Array {
  const taille = morceaux.reduce((total, morceau) => total + morceau.length, 0);
  const sortie = new Uint8Array(taille);
  let curseur = 0;
  for (const morceau of morceaux) {
    sortie.set(morceau, curseur);
    curseur += morceau.length;
  }
  return sortie;
}

function chunkPng(type: string, data: Uint8Array): Uint8Array {
  const sortie = new Uint8Array(12 + data.length);
  const taille = data.length;
  sortie[0] = (taille >> 24) & 0xff;
  sortie[1] = (taille >> 16) & 0xff;
  sortie[2] = (taille >> 8) & 0xff;
  sortie[3] = taille & 0xff;
  sortie.set(new TextEncoder().encode(type), 4);
  sortie.set(data, 8);
  return sortie;
}
