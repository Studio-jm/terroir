-- pg_catalog reste cherché même avec un search_path vide.
-- Le corps n'utilise que char_length, btrim, unnest, bool_and et coalesce.

alter function public.produits_valides(text[]) set search_path = '';
