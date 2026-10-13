grant delete on table public.exploitations to authenticated;

drop policy if exists "suppression par le proprietaire" on public.exploitations;
create policy "suppression par le proprietaire"
on public.exploitations
for delete
to authenticated
using (owner_id = (select auth.uid()));

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
  delete from public.exploitations where owner_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.supprimer_mon_compte() from public;
revoke all on function public.supprimer_mon_compte() from anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
