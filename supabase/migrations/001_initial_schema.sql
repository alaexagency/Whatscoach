-- =============================================
-- SESSIONS: una por cada simulación de ventas
-- =============================================
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_name  text not null,
  product_price text not null,
  product_desc  text not null,
  client_profile text not null,
  difficulty    text not null default 'medium',
  messages      jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

-- =============================================
-- EVALUATIONS: resultado de IA por sesión
-- =============================================
create table public.evaluations (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.sessions(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  score_conversation  int not null,
  score_objections    int not null,
  score_closing       int not null,
  score_final         int not null,
  strengths           text[] not null default '{}',
  improvements        text[] not null default '{}',
  techniques_applied  text[] not null default '{}',
  techniques_missing  text[] not null default '{}',
  recommended_close   text not null default '',
  ideal_response      text not null default '',
  created_at          timestamptz not null default now()
);

-- =============================================
-- ÍNDICES para queries frecuentes
-- =============================================
create index sessions_user_id_idx     on public.sessions(user_id);
create index sessions_created_at_idx  on public.sessions(created_at desc);
create index evaluations_session_idx  on public.evaluations(session_id);
create index evaluations_user_id_idx  on public.evaluations(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.sessions    enable row level security;
alter table public.evaluations enable row level security;

-- Sessions: solo el dueño puede leer y escribir
create policy "sessions: owner access"
  on public.sessions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Evaluations: solo el dueño puede leer y escribir
create policy "evaluations: owner access"
  on public.evaluations
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
