const fenetres = new Map<string, number[]>();
const FENETRE_MS = 60 * 60 * 1000;
const PLAFOND = 20;

export function autoriserRevelation(
  cle: string,
  maintenant = Date.now(),
  memoire: Map<string, number[]> = fenetres,
): boolean {
  const seuil = maintenant - FENETRE_MS;
  const hits = (memoire.get(cle) ?? []).filter((instant) => instant > seuil);
  if (hits.length >= PLAFOND) {
    memoire.set(cle, hits);
    return false;
  }
  hits.push(maintenant);
  memoire.set(cle, hits);
  return true;
}
