alter table public.exploitations
  add column if not exists contact_affichable boolean not null default false,
  add column if not exists adresse text,
  add column if not exists montrer_adresse_exacte boolean not null default false,
  add column if not exists lat_commune double precision,
  add column if not exists lng_commune double precision,
  add column if not exists lat_adresse double precision,
  add column if not exists lng_adresse double precision,
  add column if not exists accueil_visite boolean not null default false,
  add column if not exists accueil_conditions text,
  add column if not exists accueil_reservation text;

alter table public.exploitations drop constraint if exists exploitations_adresse_len;
alter table public.exploitations
  add constraint exploitations_adresse_len check (
    adresse is null or char_length(btrim(adresse)) between 3 and 200
  );

alter table public.exploitations drop constraint if exists exploitations_accueil_conditions_len;
alter table public.exploitations
  add constraint exploitations_accueil_conditions_len check (
    accueil_conditions is null or char_length(btrim(accueil_conditions)) between 1 and 500
  );

alter table public.exploitations drop constraint if exists exploitations_accueil_reservation_len;
alter table public.exploitations
  add constraint exploitations_accueil_reservation_len check (
    accueil_reservation is null or char_length(btrim(accueil_reservation)) between 1 and 200
  );

create or replace function public.verrouiller_contact_public()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  montrer boolean;
begin
  select c.afficher
    into montrer
  from public.contacts_producteur as c
  where c.exploitation_id = new.id;

  new.telephone_public := null;
  new.email_public := null;
  new.contact_affichable := coalesce(montrer, false);
  return new;
end;
$$;

revoke all on function public.verrouiller_contact_public() from public, anon, authenticated;

update public.exploitations
set telephone_public = null,
    email_public = null;

insert into public.contacts_producteur (exploitation_id, owner_id, telephone, email, afficher)
select
  e.id,
  e.owner_id,
  case
    when regexp_replace(btrim(e.contact), '[[:space:].-]', '', 'g')
      ~ '^(?:\+33|0033|0)[1-9][0-9]{8}$'
      then btrim(e.contact)
    else null
  end,
  case
    when btrim(e.contact) ~* '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
      then btrim(e.contact)
    else null
  end,
  true
from public.exploitations as e
where (
  regexp_replace(btrim(e.contact), '[[:space:].-]', '', 'g')
    ~ '^(?:\+33|0033|0)[1-9][0-9]{8}$'
  or btrim(e.contact) ~* '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
)
and not exists (
  select 1 from public.contacts_producteur as c where c.owner_id = e.owner_id
);

update public.exploitations
set contact = 'https://example.com/' || slug
where btrim(contact) !~* '^https?://';

alter table public.exploitations drop constraint if exists exploitations_contact_format;
alter table public.exploitations
  add constraint exploitations_contact_format check (
    btrim(contact) ~* '^https?://[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}([/?#].*)?$'
  );

revoke select (telephone_public, email_public)
  on table public.exploitations
  from anon, authenticated;

create table if not exists public.photos_exploitation (
  id uuid primary key default gen_random_uuid(),
  exploitation_id uuid not null references public.exploitations (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  chemin text not null,
  texte_alternatif text not null,
  cree_le timestamptz not null default now(),
  constraint photos_exploitation_chemin_unique unique (chemin)
);

alter table public.photos_exploitation drop constraint if exists photos_exploitation_alt_len;
alter table public.photos_exploitation
  add constraint photos_exploitation_alt_len check (
    char_length(btrim(texte_alternatif)) between 1 and 200
  );

alter table public.photos_exploitation drop constraint if exists photos_exploitation_chemin_format;
alter table public.photos_exploitation
  add constraint photos_exploitation_chemin_format check (
    chemin ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpe?g|png|webp)$'
    and split_part(chemin, '/', 1) = owner_id::text
  );

create or replace function public.limiter_photos_exploitation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.photos_exploitation
    where exploitation_id = new.exploitation_id
  ) >= 6 then
    raise exception 'six photos maximum';
  end if;
  return new;
end;
$$;

revoke all on function public.limiter_photos_exploitation() from public, anon, authenticated;

drop trigger if exists photos_exploitation_limiter on public.photos_exploitation;
create trigger photos_exploitation_limiter
before insert on public.photos_exploitation
for each row
execute function public.limiter_photos_exploitation();

alter table public.photos_exploitation enable row level security;

revoke all on table public.photos_exploitation from public, anon, authenticated;
grant select on table public.photos_exploitation to anon, authenticated;
grant insert, delete on table public.photos_exploitation to authenticated;

drop policy if exists "lecture publique des photos" on public.photos_exploitation;
create policy "lecture publique des photos"
on public.photos_exploitation
for select
to anon, authenticated
using (true);

drop policy if exists "ajout photo par le proprietaire" on public.photos_exploitation;
create policy "ajout photo par le proprietaire"
on public.photos_exploitation
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.exploitations as e
    where e.id = exploitation_id
      and e.owner_id = (select auth.uid())
  )
);

drop policy if exists "suppression photo par le proprietaire" on public.photos_exploitation;
create policy "suppression photo par le proprietaire"
on public.photos_exploitation
for delete
to authenticated
using (owner_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos-exploitations',
  'photos-exploitations',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos lecture du dossier proprietaire" on storage.objects;
create policy "photos lecture du dossier proprietaire"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'photos-exploitations'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "photos ecriture du dossier proprietaire" on storage.objects;
create policy "photos ecriture du dossier proprietaire"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'photos-exploitations'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "photos suppression du dossier proprietaire" on storage.objects;
create policy "photos suppression du dossier proprietaire"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'photos-exploitations'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create table if not exists public.fermetures (
  id uuid primary key default gen_random_uuid(),
  exploitation_id uuid not null references public.exploitations (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  debut date not null,
  fin date not null,
  motif text not null
);

alter table public.fermetures drop constraint if exists fermetures_plage;
alter table public.fermetures
  add constraint fermetures_plage check (fin >= debut);

alter table public.fermetures drop constraint if exists fermetures_motif_len;
alter table public.fermetures
  add constraint fermetures_motif_len check (char_length(btrim(motif)) between 1 and 200);

alter table public.fermetures enable row level security;
revoke all on table public.fermetures from public, anon, authenticated;
grant select on table public.fermetures to anon, authenticated;
grant insert, delete on table public.fermetures to authenticated;

drop policy if exists "lecture publique des fermetures" on public.fermetures;
create policy "lecture publique des fermetures"
on public.fermetures
for select
to anon, authenticated
using (true);

drop policy if exists "ajout fermeture par le proprietaire" on public.fermetures;
create policy "ajout fermeture par le proprietaire"
on public.fermetures
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.exploitations as e
    where e.id = exploitation_id and e.owner_id = (select auth.uid())
  )
);

drop policy if exists "suppression fermeture par le proprietaire" on public.fermetures;
create policy "suppression fermeture par le proprietaire"
on public.fermetures
for delete
to authenticated
using (owner_id = (select auth.uid()));

create table if not exists public.actualites (
  id uuid primary key default gen_random_uuid(),
  exploitation_id uuid not null references public.exploitations (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  titre text not null,
  texte text not null,
  date_actualite date not null,
  cree_le timestamptz not null default now()
);

alter table public.actualites drop constraint if exists actualites_titre_len;
alter table public.actualites
  add constraint actualites_titre_len check (char_length(btrim(titre)) between 1 and 120);

alter table public.actualites drop constraint if exists actualites_texte_len;
alter table public.actualites
  add constraint actualites_texte_len check (char_length(btrim(texte)) between 1 and 500);

alter table public.actualites enable row level security;
revoke all on table public.actualites from public, anon, authenticated;
grant select, insert, update, delete on table public.actualites to authenticated;
grant select on table public.actualites to anon;

drop policy if exists "lecture publique des actualites" on public.actualites;
create policy "lecture publique des actualites"
on public.actualites
for select
to anon, authenticated
using (true);

drop policy if exists "ajout actualite par le proprietaire" on public.actualites;
create policy "ajout actualite par le proprietaire"
on public.actualites
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.exploitations as e
    where e.id = exploitation_id and e.owner_id = (select auth.uid())
  )
);

drop policy if exists "modification actualite par le proprietaire" on public.actualites;
create policy "modification actualite par le proprietaire"
on public.actualites
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "suppression actualite par le proprietaire" on public.actualites;
create policy "suppression actualite par le proprietaire"
on public.actualites
for delete
to authenticated
using (owner_id = (select auth.uid()));

create table if not exists public.revelations_contact (
  id bigint generated always as identity primary key,
  adresse text not null,
  cree_le timestamptz not null default now()
);

alter table public.revelations_contact enable row level security;
revoke all on table public.revelations_contact from public, anon, authenticated;

create or replace function public.reveler_contact(cible text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  entete text;
  ip text;
  nombre int;
  tel text;
  mail text;
  montrer boolean;
begin
  if cible is null or char_length(cible) > 80 or cible !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    return jsonb_build_object('telephone', null, 'email', null);
  end if;

  entete := current_setting('request.headers', true);
  ip := 'inconnue';
  if entete is not null and btrim(entete) <> '' then
    ip := coalesce(
      nullif(btrim(split_part((entete::json)->>'x-forwarded-for', ',', 1)), ''),
      nullif(btrim((entete::json)->>'x-real-ip'), ''),
      'inconnue'
    );
  end if;

  delete from public.revelations_contact
  where cree_le < now() - interval '1 hour';

  select count(*)
    into nombre
  from public.revelations_contact
  where adresse = ip
    and cree_le > now() - interval '1 hour';

  if nombre >= 20 then
    raise exception 'trop de demandes' using errcode = 'P0001';
  end if;

  insert into public.revelations_contact (adresse) values (ip);

  select c.telephone, c.email, c.afficher
    into tel, mail, montrer
  from public.exploitations as e
  join public.contacts_producteur as c on c.exploitation_id = e.id
  where e.slug = cible;

  if montrer is not true then
    return jsonb_build_object('telephone', null, 'email', null);
  end if;

  return jsonb_build_object('telephone', tel, 'email', mail);
end;
$$;

revoke all on function public.reveler_contact(text) from public;
grant execute on function public.reveler_contact(text) to anon, authenticated;

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

  delete from storage.objects
  where bucket_id = 'photos-exploitations'
    and (storage.foldername(name))[1] = auth.uid()::text;

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
