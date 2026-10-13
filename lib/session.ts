import "server-only";

import { cookies } from "next/headers";
import { emettreSession, lireSession, NOM_COOKIE } from "@/lib/session-token";
import { getStore, type User } from "@/lib/store";

const OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function ouvrirSession(userId: string): Promise<boolean> {
  const token = await emettreSession(userId);
  if (!token) return false;
  const jar = await cookies();
  jar.set(NOM_COOKIE, token, OPTIONS);
  return true;
}

export async function fermerSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(NOM_COOKIE);
}

export async function utilisateurCourant(): Promise<User | null> {
  const jar = await cookies();
  const session = await lireSession(jar.get(NOM_COOKIE)?.value);
  if (!session) return null;
  try {
    return await getStore().getUserById(session.userId);
  } catch (error) {
    console.error("[terroir] lecture de session impossible", error);
    return null;
  }
}
