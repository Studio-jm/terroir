import "server-only";

export async function geocoder(requete: string): Promise<{ lat: number; lng: number } | null> {
  const q = requete.trim();
  if (q.length < 2) return null;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", `${q}, France`);
  try {
    const reponse = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Terroir/1.0 (https://example.com)",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!reponse.ok) return null;
    const corps = (await reponse.json()) as { lat?: string; lon?: string }[];
    const premier = Array.isArray(corps) ? corps[0] : undefined;
    if (!premier?.lat || !premier.lon) return null;
    const lat = Number(premier.lat);
    const lng = Number(premier.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
