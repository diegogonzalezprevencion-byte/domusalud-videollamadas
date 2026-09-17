-- DOMUS SALUD VIDEOLLAMADAS · Instalacion completa para CINCO cuentas.
-- PRIMERO: crea estas cinco cuentas en Authentication > Users > Add user,
-- asignando sus contrasenas directamente en ese formulario:
-- contacto@domusalud.cl (admin), dgonzalez@domusalud.cl,
-- cmeza@domusalud.cl, rmunoz@domusalud.cl, ccontreras@domusalud.cl.
-- DESPUES: pega TODO este archivo en SQL Editor > New query > Run.
-- Nunca almacenes las contrasenas en SQL, en el repositorio o en Vercel.
-- Este script es repetible y no elimina reuniones existentes.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists username text not null default '';
alter table public.profiles add column if not exists role text not null default 'usuario';

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 140),
  description text check (description is null or char_length(description) <= 2000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  notes text check (notes is null or char_length(notes) <= 20000),
  created_at timestamptz not null default now(),
  constraint meeting_dates_valid check (ends_at > starts_at)
);

create table if not exists public.meeting_participants (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

create index if not exists meetings_start_idx on public.meetings(starts_at);
create index if not exists meetings_creator_idx on public.meetings(created_by);
create index if not exists participants_user_idx on public.meeting_participants(user_id);

-- Crea fichas de usuarios nuevos sin permitir que el navegador se asigne admin.
create or replace function public.create_profile_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, username, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
             split_part(coalesce(new.email, ''), '@', 1)),
    lower(split_part(coalesce(new.email, ''), '@', 1)),
    'usuario'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_domus on auth.users;
create trigger on_auth_user_created_domus
  after insert on auth.users
  for each row execute procedure public.create_profile_on_signup();

-- Crea también los perfiles de cuentas que ya existan.
insert into public.profiles (id, email, full_name, username, role)
select id, coalesce(email, ''),
       coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
                split_part(coalesce(email, ''), '@', 1)),
       lower(split_part(coalesce(email, ''), '@', 1)),
       'usuario'
from auth.users
on conflict (id) do nothing;

update public.profiles
set username = lower(split_part(email, '@', 1))
where username = '';

-- Asignar roles y usuarios solamente si existen las cinco cuentas Auth.
-- No crea cuentas Auth ni contrasenas: eso se hace en Authentication > Users.
do $$
declare
  required_count integer;
begin
  select count(*) into required_count from auth.users
  where lower(email) in (
    'contacto@domusalud.cl',
    'dgonzalez@domusalud.cl',
    'cmeza@domusalud.cl',
    'rmunoz@domusalud.cl',
    'ccontreras@domusalud.cl'
  );

  if required_count <> 5 then
    raise exception 'Faltan cuentas: crea los 5 correos indicados en Authentication > Users (encontrados: % de 5).', required_count;
  end if;

  -- El usuario tiene un identificador unico y un rol asociado en la base.
  update public.profiles p
  set username = roles.username,
      role = roles.role,
      full_name = roles.full_name,
      email = lower(u.email)
  from auth.users u
  join (values
    ('contacto@domusalud.cl',   'dgonzalez',  'admin',   'Administración Domus Salud'),
    ('dgonzalez@domusalud.cl',  'dgonzalez',  'usuario', 'Diego González'),
    ('cmeza@domusalud.cl',      'cmeza',      'usuario', 'Catalina Meza'),
    ('rmunoz@domusalud.cl',     'rmunoz',     'usuario', 'Reina Muñoz'),
    ('ccontreras@domusalud.cl', 'ccontreras', 'usuario', 'Consuelo Contreras')
  ) as roles(email, username, role, full_name)
  on lower(u.email) = roles.email
  where p.id = u.id;
end;
$$;

-- Verificación del rol en el SERVIDOR, nunca en el botón del navegador.
create or replace function public.is_domus_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_domus_admin() from public, anon;
grant execute on function public.is_domus_admin() to authenticated;

create or replace function public.can_see_meeting(target_meeting uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.meetings m
    where m.id = target_meeting and (
      public.is_domus_admin()
      or m.created_by = (select auth.uid())
      or exists (
        select 1 from public.meeting_participants p
        where p.meeting_id = m.id and p.user_id = (select auth.uid())
      )
    )
  );
$$;
revoke all on function public.can_see_meeting(uuid) from public, anon;
grant execute on function public.can_see_meeting(uuid) to authenticated;

-- Las reglas RLS controlan qué puede ver y modificar cada cuenta.
alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;

revoke all on public.profiles, public.meetings, public.meeting_participants from anon;
grant select on public.profiles, public.meetings, public.meeting_participants to authenticated;
grant insert, update, delete on public.meetings to authenticated;
grant insert, delete on public.meeting_participants to authenticated;
revoke insert, update, delete on public.profiles from authenticated;

drop policy if exists profiles_read_for_logged_in on public.profiles;
create policy profiles_read_for_logged_in
on public.profiles for select to authenticated using (true);

drop policy if exists meetings_read_members on public.meetings;
create policy meetings_read_members
on public.meetings for select to authenticated
using (public.can_see_meeting(id));

drop policy if exists meetings_create_own on public.meetings;
create policy meetings_create_own
on public.meetings for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists meetings_edit_creator on public.meetings;
create policy meetings_edit_creator
on public.meetings for update to authenticated
using (created_by = (select auth.uid()) or (select public.is_domus_admin()))
with check (created_by = (select auth.uid()) or (select public.is_domus_admin()));

drop policy if exists meetings_delete_creator on public.meetings;
create policy meetings_delete_creator
on public.meetings for delete to authenticated
using (created_by = (select auth.uid()) or (select public.is_domus_admin()));

drop policy if exists participants_read_members on public.meeting_participants;
create policy participants_read_members
on public.meeting_participants for select to authenticated
using (public.can_see_meeting(meeting_id));

drop policy if exists participants_insert_creator on public.meeting_participants;
create policy participants_insert_creator
on public.meeting_participants for insert to authenticated
with check (exists (
  select 1 from public.meetings m
  where m.id = meeting_id and
        (m.created_by = (select auth.uid()) or (select public.is_domus_admin()))
));

drop policy if exists participants_delete_creator on public.meeting_participants;
create policy participants_delete_creator
on public.meeting_participants for delete to authenticated
using (exists (
  select 1 from public.meetings m
  where m.id = meeting_id and
        (m.created_by = (select auth.uid()) or (select public.is_domus_admin()))
));

commit;

-- Comprobacion: deben aparecer CINCO filas (1 admin y 4 usuarios).
select email, username, role
from public.profiles
where lower(email) in (
  'contacto@domusalud.cl',
  'dgonzalez@domusalud.cl',
  'cmeza@domusalud.cl',
  'rmunoz@domusalud.cl',
  'ccontreras@domusalud.cl'
)
order by case when role = 'admin' then 0 else 1 end, email;
