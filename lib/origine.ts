function origineFixe(): string | null {
  const raw = process.env.AUTH_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function premier(valeur: string | null): string {
  return valeur?.split(",")[0]?.trim() ?? "";
}

/** Origine utilisée dans les liens magiques. N'accepte pas un en-tête Host arbitraire. */
export function origineDepuis(entetes: {
  get(name: string): string | null;
}): string {
  const fixe = origineFixe();
  const host = premier(
    entetes.get("x-forwarded-host") ?? entetes.get("host"),
  );

  if (!process.env.VERCEL) {
    if (
      host.startsWith("localhost:") ||
      host === "localhost" ||
      host.startsWith("127.0.0.1")
    ) {
      return `http://${host}`;
    }
    return fixe ?? "http://localhost:3000";
  }

  if (fixe) return fixe;

  const autorises = new Set<string>();
  if (process.env.VERCEL_URL) autorises.add(process.env.VERCEL_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    autorises.add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }
  if (host && autorises.has(host)) return `https://${host}`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
