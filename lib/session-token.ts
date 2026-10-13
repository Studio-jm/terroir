import { SignJWT, jwtVerify } from "jose";

export const NOM_COOKIE = "terroir_session";

const SECRET_DEV = "terroir-developpement-uniquement-32b";
const DUREE = "30d";

function cle(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return new TextEncoder().encode(secret);
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return null;
  return new TextEncoder().encode(SECRET_DEV);
}

export function authConfiguree(): boolean {
  return cle() !== null;
}

export async function emettreSession(userId: string): Promise<string | null> {
  const key = cle();
  if (!key) return null;
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(DUREE)
    .sign(key);
}

export async function lireSession(
  token: string | undefined,
): Promise<{ userId: string } | null> {
  const key = cle();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const userId =
      typeof payload.userId === "string" ? payload.userId : payload.sub;
    if (!userId) return null;
    return { userId };
  } catch {
    return null;
  }
}
