-- Le CHECK d'insertion appelle cette fonction avec le rôle authenticated.
-- Le revoke initial lui enlevait EXECUTE, d'où 42501 permission denied for function produits_valides.

grant execute on function public.produits_valides(text[]) to authenticated;
