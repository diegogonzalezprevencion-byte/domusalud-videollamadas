-- DOMUS SALUD · V1. Ejecutar UNA vez en Supabase > SQL Editor > New query > Run.
-- No pegues credenciales en este editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

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

-- Se crean fichas automáticamente al registrar personas en Authentication.
create or replace function public.create_profile_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''),
          coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_domus on auth.users;
create trigger on_auth_user_created_domus
  after insert on auth.users for each row execute procedure public.create_profile_on_signup();

-- Usuarios que ya se habían creado antes de instalar esta base.
insert into public.profiles (id, email, full_name)
select id, coalesce(email, ''),
       coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(email, ''), '@', 1))
from auth.users on conflict (id) do nothing;

-- Esta función verifica permisos sin provocar recursión entre las políticas de reuniones/invitados.
create or replace function public.can_see_meeting(target_meeting uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.meetings m
    where m.id = target_meeting
      and (
        m.created_by = (select auth.uid())
        or exists (
          select 1 from public.meeting_participants p
          where p.meeting_id = m.id and p.user_id = (select auth.uid())
        )
      )
  );
$$;
revoke all on function public.can_see_meeting(uuid) from public;
grant execute on function public.can_see_meeting(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;

-- Directorio privado: solo usuarios con sesión pueden ver a los demás socios.
drop policy if exists profiles_read_for_logged_in on public.profiles;
create policy profiles_read_for_logged_in on public.profiles for select to authenticated using (true);

-- Cada reunión solo es visible para el creador o sus invitados.
drop policy if exists meetings_read_members on public.meetings;
create policy meetings_read_members on public.meetings for select to authenticated
using (public.can_see_meeting(id));

drop policy if exists meetings_create_own on public.meetings;
create policy meetings_create_own on public.meetings for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists meetings_edit_creator on public.meetings;
create policy meetings_edit_creator on public.meetings for update to authenticated
using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));

drop policy if exists meetings_delete_creator on public.meetings;
create policy meetings_delete_creator on public.meetings for delete to authenticated
using (created_by = (select auth.uid()));

-- Invitaciones visibles únicamente para integrantes de la reunión.
drop policy if exists participants_read_members on public.meeting_participants;
create policy participants_read_members on public.meeting_participants for select to authenticated
using (public.can_see_meeting(meeting_id));

drop policy if exists participants_insert_creator on public.meeting_participants;
create policy participants_insert_creator on public.meeting_participants for insert to authenticated
with check (exists (
  select 1 from public.meetings m where m.id = meeting_id and m.created_by = (select auth.uid())
));

drop policy if exists participants_delete_creator on public.meeting_participants;
create policy participants_delete_creator on public.meeting_participants for delete to authenticated
using (exists (
  select 1 from public.meetings m where m.id = meeting_id and m.created_by = (select auth.uid())
));

-- No se permiten lecturas anónimas ni actualizaciones del directorio desde el navegador.
