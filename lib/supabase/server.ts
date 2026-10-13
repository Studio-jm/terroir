import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { identifiantsSupabase } from "@/lib/supabase/env";

export async function creerClientServeur() {
  const ids = identifiantsSupabase();
  if (!ids) return null;
  const cookieStore = await cookies();

  return createServerClient(ids.url, ids.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        void headers;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Un Server Component ne peut pas écrire les cookies.
          // Le proxy rafraîchit la session.
        }
      },
    },
  });
}
