create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  delete from public.actualites where owner_id = auth.uid();
  delete from public.fermetures where owner_id = auth.uid();
  delete from public.photos_exploitation where owner_id = auth.uid();
  delete from public.exploitations where owner_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.supprimer_mon_compte() from public;
revoke all on function public.supprimer_mon_compte() from anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
