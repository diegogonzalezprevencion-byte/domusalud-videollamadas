-- DOMUS SALUD · V2. EJECUTAR DESPUÉS de 01_iniciar_base_de_datos.sql
-- Y DESPUÉS de crear las DOS cuentas con correos DIFERENTES en Authentication > Users.
-- IMPORTANTE: sustituye CAMBIA_CORREO_ADMIN y CAMBIA_CORREO_USUARIO por los correos reales.
-- NUNCA introduzcas contraseñas ni API Secrets aquí.

begin;

alter table public.profiles add column if not exists username text not null default '';
alter table public.profiles add column if not exists role text not null default 'usuario';

update public.profiles
set username = lower(split_part(email, '@', 1))
where username = '';

-- Si ya se ejecutó la versión inicial, se mantiene la creación automática de perfiles.
-- El rol inicial SIEMPRE es usuario: los datos enviados desde el navegador no conceden admins.
create or replace function public.create_profile_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, username, role)
  values (new.id, coalesce(new.email, ''),
          coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1)),
          lower(split_part(coalesce(new.email, ''), '@', 1)), 'usuario')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Comprobación previa: impide terminar una instalación con correos de ejemplo/no creados.
do $$
declare
  admin_email text := lower(trim('CAMBIA_CORREO_ADMIN'));
  user_email text := lower(trim('CAMBIA_CORREO_USUARIO'));
begin
  if admin_email = lower('CAMBIA_CORREO_ADMIN') or user_email = lower('CAMBIA_CORREO_USUARIO') then
    raise exception 'Antes de ejecutar, reemplaza CAMBIA_CORREO_ADMIN y CAMBIA_CORREO_USUARIO por los correos de las cuentas Supabase.';
  end if;
  if admin_email = user_email then
    raise exception 'Administrador y usuario deben tener correos DIFERENTES en Supabase Auth.';
  end if;
  if (select count(*) from auth.users where lower(email) in (admin_email, user_email)) <> 2 then
    raise exception 'No se encontraron las DOS cuentas. Créalas primero en Authentication > Users.';
  end if;

  -- Repara perfiles ausentes si se crearon cuentas antes de ejecutar el SQL 01.
  insert into public.profiles (id,email,full_name,username,role)
  select id, coalesce(email,''),
    coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(email,'@',1)),
    lower(split_part(email,'@',1)), 'usuario'
  from auth.users where lower(email) in (admin_email,user_email)
  on conflict (id) do nothing;

  update public.profiles set role = 'admin', username = 'dgonzalez'
  where lower(email) = admin_email;
  update public.profiles set role = 'usuario', username = 'dgonzalez'
  where lower(email) = user_email;
end;
$$;

-- El rol lo custodia la base de datos, no el selector del navegador.
create or replace function public.is_domus_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_domus_admin() from public;
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
revoke all on function public.can_see_meeting(uuid) from public;
grant execute on function public.can_see_meeting(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;

-- Revocar lectura/escritura anónima. Solo usuarios autenticados tienen acceso.
revoke all on public.profiles, public.meetings, public.meeting_participants from anon;
grant select on public.profiles, public.meetings, public.meeting_participants to authenticated;
grant insert, update, delete on public.meetings to authenticated;
grant insert, delete on public.meeting_participants to authenticated;
-- NO grant insert/update/delete on profiles: ni el usuario ni su navegador pueden elevar privilegios.
revoke insert, update, delete on public.profiles from authenticated;

-- El directorio es visible a los socios autenticados.
drop policy if exists profiles_read_for_logged_in on public.profiles;
create policy profiles_read_for_logged_in on public.profiles for select to authenticated using (true);

-- El administrador ve y gestiona todas las reuniones. El usuario solo las suyas/invitadas.
drop policy if exists meetings_read_members on public.meetings;
create policy meetings_read_members on public.meetings for select to authenticated
using (public.can_see_meeting(id));

drop policy if exists meetings_create_own on public.meetings;
create policy meetings_create_own on public.meetings for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists meetings_edit_creator on public.meetings;
create policy meetings_edit_creator on public.meetings for update to authenticated
using (created_by = (select auth.uid()) or (select public.is_domus_admin()))
with check (created_by = (select auth.uid()) or (select public.is_domus_admin()));

drop policy if exists meetings_delete_creator on public.meetings;
create policy meetings_delete_creator on public.meetings for delete to authenticated
using (created_by = (select auth.uid()) or (select public.is_domus_admin()));

drop policy if exists participants_read_members on public.meeting_participants;
create policy participants_read_members on public.meeting_participants for select to authenticated
using (public.can_see_meeting(meeting_id));

drop policy if exists participants_insert_creator on public.meeting_participants;
create policy participants_insert_creator on public.meeting_participants for insert to authenticated
with check (exists (
  select 1 from public.meetings m where m.id = meeting_id
    and (m.created_by = (select auth.uid()) or (select public.is_domus_admin()))
));

drop policy if exists participants_delete_creator on public.meeting_participants;
create policy participants_delete_creator on public.meeting_participants for delete to authenticated
using (exists (
  select 1 from public.meetings m where m.id = meeting_id
    and (m.created_by = (select auth.uid()) or (select public.is_domus_admin()))
));

commit;
