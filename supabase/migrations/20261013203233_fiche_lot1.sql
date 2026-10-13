create or replace function public.offre_valide(item jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  mois jsonb;
  element jsonb;
  nombre int;
  vus int[] := '{}';
begin
  if jsonb_typeof(item) is distinct from 'object' then
    return false;
  end if;
  if exists (
    select 1
    from jsonb_object_keys(item) as cle
    where cle not in ('categorie', 'nom', 'mois')
  ) then
    return false;
  end if;
  if item->>'categorie' not in (
    'fruits',
    'legumes',
    'produits_laitiers',
    'viande',
    'oeufs',
    'miel',
    'boulangerie',
    'boissons',
    'plantes',
    'autre'
  ) then
    return false;
  end if;
  if item->>'nom' is null
    or char_length(btrim(item->>'nom')) not between 1 and 40
    or item->>'nom' ~ '[[:cntrl:]]'
  then
    return false;
  end if;
  mois := item->'mois';
  if jsonb_typeof(mois) is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(mois) not between 1 and 12 then
    return false;
  end if;
  for element in
    select entree.valeur
    from jsonb_array_elements(mois) as entree(valeur)
  loop
    if jsonb_typeof(element) is distinct from 'number' then
      return false;
    end if;
    if element::text !~ '^[0-9]+$' then
      return false;
    end if;
    nombre := element::text::int;
    if nombre < 1 or nombre > 12 or nombre = any(vus) then
      return false;
    end if;
    vus := vus || nombre;
  end loop;
  return true;
end;
$$;

create or replace function public.offres_valides(valeur jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  element jsonb;
begin
  if jsonb_typeof(valeur) is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(valeur) > 12 then
    return false;
  end if;
  for element in
    select entree.valeur
    from jsonb_array_elements(valeur) as entree(valeur)
  loop
    if not public.offre_valide(element) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.point_vente_valide(item jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(item) is distinct from 'object' then
    return false;
  end if;
  if exists (
    select 1
    from jsonb_object_keys(item) as cle
    where cle not in ('nom', 'commune', 'jour', 'horaires')
  ) then
    return false;
  end if;
  if item->>'jour' not in (
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ) then
    return false;
  end if;
  if item->>'nom' is null
    or char_length(btrim(item->>'nom')) not between 2 and 80
    or item->>'nom' ~ '[[:cntrl:]]'
  then
    return false;
  end if;
  if item->>'commune' is null
    or char_length(btrim(item->>'commune')) not between 2 and 80
    or item->>'commune' ~ '[[:cntrl:]]'
  then
    return false;
  end if;
  if item->>'horaires' is null
    or char_length(btrim(item->>'horaires')) not between 1 and 80
    or item->>'horaires' ~ '[[:cntrl:]]'
  then
    return false;
  end if;
  return true;
end;
$$;

create or replace function public.points_vente_valides(valeur jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  element jsonb;
begin
  if jsonb_typeof(valeur) is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(valeur) > 12 then
    return false;
  end if;
  for element in
    select entree.valeur
    from jsonb_array_elements(valeur) as entree(valeur)
  loop
    if not public.point_vente_valide(element) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.creneau_valide(item jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  debut text;
  fin text;
begin
  if jsonb_typeof(item) is distinct from 'object' then
    return false;
  end if;
  if exists (
    select 1
    from jsonb_object_keys(item) as cle
    where cle not in ('debut', 'fin')
  ) then
    return false;
  end if;
  debut := item->>'debut';
  fin := item->>'fin';
  if debut is null or fin is null then
    return false;
  end if;
  if debut !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    return false;
  end if;
  if fin !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    return false;
  end if;
  return debut < fin;
end;
$$;

create or replace function public.horaires_ferme_valides(valeur jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  cle text;
  jours jsonb;
begin
  if jsonb_typeof(valeur) is distinct from 'object' then
    return false;
  end if;
  if exists (
    select 1
    from jsonb_object_keys(valeur) as entree
    where entree not in ('sur_rendezvous', 'jours')
  ) then
    return false;
  end if;
  if valeur ? 'sur_rendezvous'
    and jsonb_typeof(valeur->'sur_rendezvous') is distinct from 'boolean'
  then
    return false;
  end if;
  if not (valeur ? 'jours') then
    return true;
  end if;
  jours := valeur->'jours';
  if jsonb_typeof(jours) is distinct from 'object' then
    return false;
  end if;
  for cle in
    select entree.cle
    from jsonb_object_keys(jours) as entree(cle)
  loop
    if cle not in (
      'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
    ) then
      return false;
    end if;
    if not public.creneau_valide(jours->cle) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.liens_valides(valeur jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  cle text;
  url text;
begin
  if jsonb_typeof(valeur) is distinct from 'object' then
    return false;
  end if;
  for cle in
    select entree.cle
    from jsonb_object_keys(valeur) as entree(cle)
  loop
    if cle not in ('site', 'instagram', 'facebook', 'autre') then
      return false;
    end if;
    if jsonb_typeof(valeur->cle) is distinct from 'string' then
      return false;
    end if;
    url := valeur->>cle;
    if char_length(url) not between 1 and 300 then
      return false;
    end if;
    if url !~* '^https?://[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}([/?#].*)?$' then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.textes_choix_valides(items text[], autorises text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    items is not null
    and autorises is not null
    and cardinality(items) <= cardinality(autorises)
    and cardinality(items) = (select count(distinct item) from unnest(items) as item)
    and coalesce((
      select bool_and(item = any(autorises))
      from unnest(items) as item
    ), true);
$$;

create or replace function public.labels_valides(items text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    items is not null
    and cardinality(items) <= 12
    and coalesce((
      select bool_and(
        char_length(btrim(item)) between 1 and 40
        and item !~ '[[:cntrl:]]'
      )
      from unnest(items) as item
    ), true);
$$;

revoke all on function public.offre_valide(jsonb) from public, anon, authenticated;
revoke all on function public.offres_valides(jsonb) from public, anon, authenticated;
revoke all on function public.point_vente_valide(jsonb) from public, anon, authenticated;
revoke all on function public.points_vente_valides(jsonb) from public, anon, authenticated;
revoke all on function public.creneau_valide(jsonb) from public, anon, authenticated;
revoke all on function public.horaires_ferme_valides(jsonb) from public, anon, authenticated;
revoke all on function public.liens_valides(jsonb) from public, anon, authenticated;
revoke all on function public.textes_choix_valides(text[], text[]) from public, anon, authenticated;
revoke all on function public.labels_valides(text[]) from public, anon, authenticated;

grant execute on function public.offre_valide(jsonb) to authenticated;
grant execute on function public.offres_valides(jsonb) to authenticated;
grant execute on function public.point_vente_valide(jsonb) to authenticated;
grant execute on function public.points_vente_valides(jsonb) to authenticated;
grant execute on function public.creneau_valide(jsonb) to authenticated;
grant execute on function public.horaires_ferme_valides(jsonb) to authenticated;
grant execute on function public.liens_valides(jsonb) to authenticated;
grant execute on function public.textes_choix_valides(text[], text[]) to authenticated;
grant execute on function public.labels_valides(text[]) to authenticated;

alter table public.exploitations
  add column if not exists presentation text,
  add column if not exists offres jsonb not null default '[]'::jsonb,
  add column if not exists modes_vente text[] not null default '{}',
  add column if not exists points_vente jsonb not null default '[]'::jsonb,
  add column if not exists horaires_ferme jsonb not null default '{}'::jsonb,
  add column if not exists paiements text[] not null default '{}',
  add column if not exists labels text[] not null default '{}',
  add column if not exists liens jsonb not null default '{}'::jsonb,
  add column if not exists telephone_public text,
  add column if not exists email_public text;

alter table public.exploitations drop constraint if exists exploitations_presentation_len;
alter table public.exploitations
  add constraint exploitations_presentation_len check (
    presentation is null
    or (
      char_length(presentation) between 1 and 280
      and presentation !~ '[[:cntrl:]]'
    )
  );

alter table public.exploitations drop constraint if exists exploitations_offres_valides;
alter table public.exploitations
  add constraint exploitations_offres_valides check (public.offres_valides(offres));

alter table public.exploitations drop constraint if exists exploitations_modes_vente_valides;
alter table public.exploitations
  add constraint exploitations_modes_vente_valides check (
    public.textes_choix_valides(
      modes_vente,
      array['ferme', 'marche', 'amap', 'livraison', 'drive']::text[]
    )
  );

alter table public.exploitations drop constraint if exists exploitations_points_vente_valides;
alter table public.exploitations
  add constraint exploitations_points_vente_valides check (public.points_vente_valides(points_vente));

alter table public.exploitations drop constraint if exists exploitations_horaires_ferme_valides;
alter table public.exploitations
  add constraint exploitations_horaires_ferme_valides check (public.horaires_ferme_valides(horaires_ferme));

alter table public.exploitations drop constraint if exists exploitations_paiements_valides;
alter table public.exploitations
  add constraint exploitations_paiements_valides check (
    public.textes_choix_valides(
      paiements,
      array['especes', 'carte', 'cheque', 'virement']::text[]
    )
  );

alter table public.exploitations drop constraint if exists exploitations_labels_valides;
alter table public.exploitations
  add constraint exploitations_labels_valides check (public.labels_valides(labels));

alter table public.exploitations drop constraint if exists exploitations_liens_valides;
alter table public.exploitations
  add constraint exploitations_liens_valides check (public.liens_valides(liens));

alter table public.exploitations drop constraint if exists exploitations_telephone_public_format;
alter table public.exploitations
  add constraint exploitations_telephone_public_format check (
    telephone_public is null
    or regexp_replace(btrim(telephone_public), '[[:space:].-]', '', 'g')
      ~ '^(?:\+33|0033|0)[1-9][0-9]{8}$'
  );

alter table public.exploitations drop constraint if exists exploitations_email_public_format;
alter table public.exploitations
  add constraint exploitations_email_public_format check (
    email_public is null
    or (
      char_length(btrim(email_public)) <= 254
      and btrim(email_public) ~* '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    )
  );

create table if not exists public.contacts_producteur (
  exploitation_id uuid primary key references public.exploitations (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  telephone text,
  email text,
  afficher boolean not null default false,
  constraint contacts_producteur_owner_unique unique (owner_id)
);

alter table public.contacts_producteur drop constraint if exists contacts_producteur_un_moyen;
alter table public.contacts_producteur
  add constraint contacts_producteur_un_moyen check (
    telephone is not null or email is not null
  );

alter table public.contacts_producteur drop constraint if exists contacts_producteur_telephone_format;
alter table public.contacts_producteur
  add constraint contacts_producteur_telephone_format check (
    telephone is null
    or regexp_replace(btrim(telephone), '[[:space:].-]', '', 'g')
      ~ '^(?:\+33|0033|0)[1-9][0-9]{8}$'
  );

alter table public.contacts_producteur drop constraint if exists contacts_producteur_email_format;
alter table public.contacts_producteur
  add constraint contacts_producteur_email_format check (
    email is null
    or (
      char_length(btrim(email)) <= 254
      and btrim(email) ~* '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    )
  );

create or replace function public.verrouiller_contact_public()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  tel text;
  mail text;
  montrer boolean;
begin
  select c.telephone, c.email, c.afficher
    into tel, mail, montrer
  from public.contacts_producteur as c
  where c.exploitation_id = new.id;

  if montrer is true then
    new.telephone_public := tel;
    new.email_public := mail;
  else
    new.telephone_public := null;
    new.email_public := null;
  end if;
  return new;
end;
$$;

create or replace function public.publier_contact_producteur()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cible uuid;
begin
  if tg_op = 'DELETE' then
    cible := old.exploitation_id;
  else
    cible := new.exploitation_id;
  end if;

  -- Déclenche verrouiller_contact_public, qui recopie le contact selon afficher.
  update public.exploitations
  set slug = slug
  where id = cible;

  return coalesce(new, old);
end;
$$;

revoke all on function public.verrouiller_contact_public() from public, anon, authenticated;
revoke all on function public.publier_contact_producteur() from public, anon, authenticated;

drop trigger if exists exploitations_verrouiller_contact_public on public.exploitations;
create trigger exploitations_verrouiller_contact_public
before insert or update on public.exploitations
for each row
execute function public.verrouiller_contact_public();

drop trigger if exists contacts_producteur_publier on public.contacts_producteur;
create trigger contacts_producteur_publier
after insert or update or delete on public.contacts_producteur
for each row
execute function public.publier_contact_producteur();

alter table public.contacts_producteur enable row level security;

revoke all on table public.contacts_producteur from public, anon, authenticated;

grant select, insert, update, delete on table public.contacts_producteur to authenticated;

drop policy if exists "lecture du contact par le proprietaire" on public.contacts_producteur;
create policy "lecture du contact par le proprietaire"
on public.contacts_producteur
for select
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "creation du contact par le proprietaire" on public.contacts_producteur;
create policy "creation du contact par le proprietaire"
on public.contacts_producteur
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

drop policy if exists "modification du contact par le proprietaire" on public.contacts_producteur;
create policy "modification du contact par le proprietaire"
on public.contacts_producteur
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.exploitations as e
    where e.id = exploitation_id
      and e.owner_id = (select auth.uid())
  )
);

drop policy if exists "suppression du contact par le proprietaire" on public.contacts_producteur;
create policy "suppression du contact par le proprietaire"
on public.contacts_producteur
for delete
to authenticated
using (owner_id = (select auth.uid()));

comment on table public.contacts_producteur is
  'Téléphone et e-mail du producteur. anon n''a aucun droit. telephone_public et email_public ne sont remplis par trigger que si afficher est vrai.';
