const RETIRER_PNG = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

export function retirerMetadonnees(octets: Uint8Array): Uint8Array {
  if (estJpeg(octets)) return retirerJpeg(octets);
  if (estPng(octets)) return retirerPng(octets);
  if (estWebp(octets)) return retirerWebp(octets);
  throw new Error("format");
}

function estJpeg(octets: Uint8Array): boolean {
  return octets.length >= 4 && octets[0] === 0xff && octets[1] === 0xd8;
}

function estPng(octets: Uint8Array): boolean {
  return (
    octets.length >= 8 &&
    octets[0] === 137 &&
    octets[1] === 80 &&
    octets[2] === 78 &&
    octets[3] === 71
  );
}

function estWebp(octets: Uint8Array): boolean {
  return octets.length >= 12 && ascii(octets, 0, 4) === "RIFF" && ascii(octets, 8, 12) === "WEBP";
}

function retirerJpeg(octets: Uint8Array): Uint8Array {
  const morceaux: Uint8Array[] = [octets.slice(0, 2)];
  let i = 2;
  while (i < octets.length) {
    if (octets[i] !== 0xff) {
      morceaux.push(octets.slice(i));
      break;
    }
    let j = i;
    while (j < octets.length && octets[j] === 0xff) j += 1;
    if (j >= octets.length) break;
    const marqueur = octets[j] ?? 0;
    if (marqueur === 0xda) {
      morceaux.push(octets.slice(i));
      break;
    }
    if (marqueur === 0xd9 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd7)) {
      morceaux.push(octets.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (j + 2 >= octets.length) {
      morceaux.push(octets.slice(i));
      break;
    }
    const longueur = ((octets[j + 1] ?? 0) << 8) | (octets[j + 2] ?? 0);
    const fin = j + 1 + longueur;
    if (longueur < 2 || fin > octets.length) {
      morceaux.push(octets.slice(i));
      break;
    }
    if (marqueur !== 0xe1) morceaux.push(octets.slice(i, fin));
    i = fin;
  }
  return concatener(morceaux);
}

function retirerPng(octets: Uint8Array): Uint8Array {
  const morceaux: Uint8Array[] = [octets.slice(0, 8)];
  let i = 8;
  while (i + 12 <= octets.length) {
    const taille = lireUint32(octets, i);
    const type = ascii(octets, i + 4, i + 8);
    const fin = i + 12 + taille;
    if (fin > octets.length) throw new Error("format");
    if (!RETIRER_PNG.has(type)) morceaux.push(octets.slice(i, fin));
    i = fin;
    if (type === "IEND") break;
  }
  return concatener(morceaux);
}

function retirerWebp(octets: Uint8Array): Uint8Array {
  const morceaux: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= octets.length) {
    const id = ascii(octets, i, i + 4);
    const taille =
      (octets[i + 4] ?? 0) |
      ((octets[i + 5] ?? 0) << 8) |
      ((octets[i + 6] ?? 0) << 16) |
      ((octets[i + 7] ?? 0) << 24);
    const fin = i + 8 + taille;
    const aligne = fin + (taille % 2);
    if (fin > octets.length) break;
    if (id !== "EXIF" && id !== "XMP ") {
      morceaux.push(octets.slice(i, Math.min(aligne, octets.length)));
    }
    i = aligne;
  }
  const charge = concatener(morceaux);
  const sortie = new Uint8Array(12 + charge.length);
  sortie.set(octets.slice(0, 4), 0);
  ecrireUint32(sortie, 4, 4 + charge.length);
  sortie.set([0x57, 0x45, 0x42, 0x50], 8);
  sortie.set(charge, 12);
  return sortie;
}

function concatener(morceaux: Uint8Array[]): Uint8Array {
  const taille = morceaux.reduce((total, morceau) => total + morceau.length, 0);
  const sortie = new Uint8Array(taille);
  let curseur = 0;
  for (const morceau of morceaux) {
    sortie.set(morceau, curseur);
    curseur += morceau.length;
  }
  return sortie;
}

function ascii(octets: Uint8Array, debut: number, fin: number): string {
  let texte = "";
  for (let i = debut; i < fin; i += 1) texte += String.fromCharCode(octets[i] ?? 0);
  return texte;
}

function lireUint32(octets: Uint8Array, debut: number): number {
  return (
    ((octets[debut] ?? 0) << 24) |
    ((octets[debut + 1] ?? 0) << 16) |
    ((octets[debut + 2] ?? 0) << 8) |
    (octets[debut + 3] ?? 0)
  );
}

function ecrireUint32(octets: Uint8Array, debut: number, valeur: number): void {
  octets[debut] = valeur & 0xff;
  octets[debut + 1] = (valeur >> 8) & 0xff;
  octets[debut + 2] = (valeur >> 16) & 0xff;
  octets[debut + 3] = (valeur >> 24) & 0xff;
}
