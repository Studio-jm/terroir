import "server-only";

import { creerClientServeur } from "@/lib/supabase/server";

export type Utilisateur = {
  id: string;
  email: string;
};

export async function utilisateurCourant(): Promise<Utilisateur | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const email = data.claims.email;
  return {
    id: data.claims.sub,
    email: typeof email === "string" ? email : "",
  };
}
