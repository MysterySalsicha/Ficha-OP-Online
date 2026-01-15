-- ============================================================
-- ORDEM PARANORMAL VTT - SETUP COMPLETO DO BANCO DE DADOS
-- Cole este script no SQL Editor do seu projeto Supabase e clique em RUN.
-- ============================================================

-- 1. EXTENSÕES NECESSÁRIAS
create extension if not exists "uuid-ossp";

-- 2. TABELA DE PERFIS (PROFILES)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE MESAS
create table public.mesas (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  name text not null,
  gm_id uuid references public.profiles(id) not null,
  is_active boolean default true,
  combat_active boolean default false,
  turn_order jsonb default '[]'::jsonb,
  current_turn_index integer default 0,
  round_count integer default 1,
  settings jsonb default '{"survivor_mode": false}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABELA DE PERSONAGENS (CHARACTERS)
create table public.characters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  name text not null,
  class text not null,
  nex integer default 5,
  patente text default 'Recruta',
  origin text,
  trail text,
  affinity text,
  attributes jsonb not null default '{"for":1, "agi":1, "int":1, "pre":1, "vig":1}'::jsonb,
  stats_max jsonb not null default '{"pv":20, "pe":2, "san":12}'::jsonb,
  stats_current jsonb not null default '{"pv":20, "pe":2, "san":12}'::jsonb,
  defenses jsonb not null default '{"passiva":10, "esquiva":0, "bloqueio":0}'::jsonb,
  skills jsonb default '{}'::jsonb,
  powers jsonb default '[]'::jsonb,
  rituals jsonb default '[]'::jsonb,
  inventory_slots_max integer default 5,
  is_npc boolean default false,
  is_gm_mode boolean default false,
  status_flags jsonb default '{"vida": "vivo", "mental": "sao", "sobrecarregado": false}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABELA DE ITENS (INVENTÁRIO)
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references public.characters(id) on delete cascade not null,
  name text not null,
  category text not null,
  description text,
  slots integer default 1,
  quantity integer default 1,
  weight integer default 0,
  stats jsonb default '{}'::jsonb,
  access_category integer default 0,
  is_equipped boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. TABELA DE MENSAGENS (CHAT & ROLAGENS)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  user_id uuid references public.profiles(id),
  character_id uuid references public.characters(id),
  type text not null, -- 'text', 'roll', 'system'
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. TABELA DE CENAS (MAPAS)
create table public.scenes (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  name text not null,
  image_url text not null,
  grid_size integer default 50,
  scale_meters float default 1.5,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TABELA DE TOKENS (PEÇAS NO MAPA)
create table public.tokens (
  id uuid default uuid_generate_v4() primary key,
  scene_id uuid references public.scenes(id) on delete cascade not null,
  character_id uuid references public.characters(id) on delete cascade,
  x float not null default 0,
  y float not null default 0,
  size float default 1,
  is_visible boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TABELA DE LOGS (HISTÓRICO)
create table public.campaign_logs (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  type text not null,
  description text not null,
  data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. CONFIGURAÇÃO DE REALTIME
-- Habilita a sincronização instantânea nas tabelas críticas
alter publication supabase_realtime add table public.mesas;
alter publication supabase_realtime add table public.characters;
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.scenes;
alter publication supabase_realtime add table public.tokens;
alter publication supabase_realtime add table public.campaign_logs;

-- 11. FUNÇÃO AUTOMÁTICA DE PERFIL (TRIGGER)
-- Cria automaticamente uma entrada na tabela profiles quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 12. ROW LEVEL SECURITY (RLS) BÁSICO
-- Permite que usuários autenticados leiam e escrevam dados (configuração simplificada para teste inicial)
alter table public.profiles enable row level security;
alter table public.mesas enable row level security;
alter table public.characters enable row level security;
alter table public.items enable row level security;
alter table public.messages enable row level security;
alter table public.scenes enable row level security;
alter table public.tokens enable row level security;
alter table public.campaign_logs enable row level security;

-- Políticas de acesso livre para usuários autenticados (Ideal para desenvolvimento)
create policy "Acesso total para usuários logados" on public.profiles for all using (auth.role() = 'authenticated');
create policy "Acesso total para usuários logados" on public.mesas for all using (auth.role() = 'authenticated');
create policy "Acesso total para usuários logados" on public.characters for all using (auth.role() = 'authenticated');
create policy "Acesso total para usuários logados" on public.items for all using (auth.role() = 'authenticated');
create policy "Acesso total para usuários logados" on public.messages for all using (auth.role() = 'authenticated');
create policy "Acesso total para usuários logados" on public.scenes for all using (auth.role() = 'authenticated');
create policy "Acesso total para usuários logados" on public.tokens for all using (auth.role() = 'authenticated');
create policy "Acesso total para usuários logados" on public.campaign_logs for all using (auth.role() = 'authenticated');
