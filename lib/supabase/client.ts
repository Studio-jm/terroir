import { createBrowserClient } from "@supabase/ssr";
import { identifiantsSupabase } from "@/lib/supabase/env";

export function creerClientNavigateur() {
  const ids = identifiantsSupabase();
  if (!ids) return null;
  return createBrowserClient(ids.url, ids.key);
}
