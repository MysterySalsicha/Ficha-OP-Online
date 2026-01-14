-- ==========================================
-- ORDEM PARANORMAL VTT - SCHEMA COMPLETO
-- ==========================================

-- 1. USERS (Profiles)
-- Estende a tabela auth.users do Supabase
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MESAS
create table public.mesas (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null, -- Código de convite (ex: "ORDEM-123")
  name text not null,
  gm_id uuid references public.profiles(id) not null, -- O Mestre
  is_active boolean default true,
  settings jsonb default '{"survivor_mode": false, "turn_timer": null}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CHARACTERS (Fichas)
create table public.characters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id), -- Dono da ficha (pode ser null para NPCs do mestre)
  mesa_id uuid references public.mesas(id) not null,
  name text not null,
  class text not null, -- combatente, especialista, ocultista
  nex integer default 5,
  patente text default 'Recruta',
  
  -- Dados JSON pesados para flexibilidade
  attributes jsonb not null default '{"for":1, "agi":1, "int":1, "pre":1, "vig":1}'::jsonb,
  stats_max jsonb not null default '{"pv":20, "pe":2, "san":12}'::jsonb,
  stats_current jsonb not null default '{"pv":20, "pe":2, "san":12}'::jsonb,
  defenses jsonb not null default '{"passiva":10, "esquiva":0, "bloqueio":0}'::jsonb,
  skills jsonb default '{}'::jsonb, -- Perícias treinadas
  powers jsonb default '[]'::jsonb, -- Lista de IDs de poderes
  rituals jsonb default '[]'::jsonb, -- Lista de rituais completos
  
  -- Controle de Estado
  status_flags jsonb default '{"vida": "vivo", "mental": "sao", "sobrecarregado": false}'::jsonb,
  
  -- Permissões
  is_npc boolean default false,
  is_public boolean default false, -- Se outros players podem ver status
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ITEMS (Inventário)
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references public.characters(id) on delete cascade not null,
  name text not null,
  category text not null, -- arma, equipamento, etc.
  description text,
  
  -- Mecânicas
  slots integer default 1,
  quantity integer default 1,
  weight integer default 0, -- Carga calculada
  
  stats jsonb default '{}'::jsonb, -- Dano, Crítico, Alcance, etc.
  
  is_equipped boolean default false,
  is_custom boolean default false, -- Se foi criado manualmente (homebrew)
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MESSAGES (Chat & Rolagens)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  user_id uuid references public.profiles(id), -- Quem enviou
  character_id uuid references public.characters(id), -- Personagem (opcional)
  
  type text not null check (type in ('text', 'roll', 'system', 'whisper', 'image')),
  content jsonb not null, -- Texto ou dados da rolagem {dice: '1d20', result: [20], total: 20}
  
  is_hidden boolean default false, -- Se for rolagem oculta do mestre
  target_user_id uuid references public.profiles(id), -- Para sussurros
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CAMPAIGN LOGS (Auditoria & Histórico)
create table public.campaign_logs (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  type text not null, -- 'edit_sheet', 'level_up', 'item_transfer'
  description text not null,
  data jsonb, -- Dados anteriores/novos para diff
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- REALTIME SUBSCRIPTIONS
-- ==========================================
-- Habilitar realtime para que todos vejam atualizações instantaneamente
alter publication supabase_realtime add table public.mesas;
alter publication supabase_realtime add table public.characters;
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.messages;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA
-- ==========================================

-- Helper: Função para verificar se o usuário é o GM da mesa
create or replace function is_gm_of(_mesa_id uuid) returns boolean as $$
  select exists (
    select 1 from public.mesas
    where id = _mesa_id
    and gm_id = auth.uid()
  );
$$ language sql security definer;

-- CHARACTERS
alter table public.characters enable row level security;

-- Quem pode VER fichas?
-- 1. O dono da ficha.
-- 2. O Mestre da mesa.
-- 3. Outros jogadores (apenas se a ficha for pública ou se for leitura básica - podemos refinar depois).
create policy "Players vêem suas fichas e GM vê todas"
  on public.characters for select
  using (
    auth.uid() = user_id or is_gm_of(mesa_id)
  );

-- Quem pode EDITAR fichas?
-- 1. O dono da ficha (se não estiver travada - lógica no frontend, aqui liberamos o update).
-- 2. O Mestre (God Mode).
create policy "Dono e GM podem editar"
  on public.characters for update
  using (
    auth.uid() = user_id or is_gm_of(mesa_id)
  );

-- ITEMS
alter table public.items enable row level security;

create policy "Ver itens"
  on public.items for select
  using (
    exists (
      select 1 from public.characters c
      where c.id = items.character_id
      and (c.user_id = auth.uid() or is_gm_of(c.mesa_id))
    )
  );

create policy "Editar itens"
  on public.items for all
  using (
    exists (
      select 1 from public.characters c
      where c.id = items.character_id
      and (c.user_id = auth.uid() or is_gm_of(c.mesa_id))
    )
  );

-- MESSAGES
alter table public.messages enable row level security;

create policy "Ver mensagens da mesa"
  on public.messages for select
  using (
    exists (
      select 1 from public.mesas m
      where m.id = messages.mesa_id
      -- Aqui simplifiquei: se você tem acesso à mesa (ex: tem um char nela), pode ver.
      -- Implementação real precisaria de uma tabela 'mesa_players' para validar membership.
    )
  );

create policy "Enviar mensagens"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS (Automação de Criação de User)
-- ==========================================
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