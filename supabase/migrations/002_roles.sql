-- =============================================
-- ENUM de roles
-- =============================================
create type public.user_role as enum ('admin', 'manager', 'vendedor');

-- =============================================
-- PROFILES: extiende auth.users con rol y datos
-- =============================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  avatar_url   text,
  role         public.user_role not null default 'vendedor',
  manager_id   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- manager_id solo aplica a vendedores (constraint de integridad)
-- Los managers tienen manager_id null, los vendedores apuntan a su manager

-- =============================================
-- ÍNDICES
-- =============================================
create index profiles_role_idx       on public.profiles(role);
create index profiles_manager_id_idx on public.profiles(manager_id);

-- =============================================
-- TRIGGER: crea perfil automáticamente al signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.profiles enable row level security;

-- Cualquier usuario autenticado puede leer perfiles (para managers ver su equipo)
create policy "profiles: read authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Solo el dueño puede actualizar su propio perfil
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =============================================
-- Agregar manager_id a sessions (qué manager supervisa)
-- =============================================
alter table public.sessions
  add column if not exists manager_id uuid references public.profiles(id) on delete set null;
