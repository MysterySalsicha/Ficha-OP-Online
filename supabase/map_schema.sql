-- ==========================================
-- MÓDULO DE MAPA E TOKENS (Fase 7)
-- ==========================================

-- 7. SCENES (Mapas / Cenários)
create table public.scenes (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  name text not null,
  image_url text not null, -- URL da imagem de fundo
  
  -- Configuração do Grid
  grid_type text default 'square', -- 'square', 'hex', 'none'
  grid_size integer default 50, -- Tamanho em pixels de cada quadrado
  scale_meters float default 1.5, -- Quantos metros vale cada quadrado
  
  is_active boolean default false, -- Se é a cena atual que os players vêem
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TOKENS (Peças no Tabuleiro)
create table public.tokens (
  id uuid default uuid_generate_v4() primary key,
  scene_id uuid references public.scenes(id) on delete cascade not null,
  character_id uuid references public.characters(id), -- Se for vinculado a uma ficha
  
  -- Se não for vinculado (ex: objeto ou monstro genérico)
  name text,
  image_url text,
  
  -- Posição e Estado
  x float not null default 0,
  y float not null default 0,
  size float default 1, -- Multiplicador de tamanho (1x1, 2x2...)
  rotation float default 0,
  
  is_visible boolean default true, -- Fog of War simples
  is_locked boolean default false, -- Se não pode ser movido
  
  -- Status rápidos visíveis no token (ex: bolinhas coloridas)
  conditions jsonb default '[]'::jsonb, 
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- REALTIME
-- ==========================================
alter publication supabase_realtime add table public.scenes;
alter publication supabase_realtime add table public.tokens;

-- ==========================================
-- RLS (Segurança)
-- ==========================================

-- SCENES
alter table public.scenes enable row level security;

create policy "Ver cenas da mesa"
  on public.scenes for select
  using (
    exists (
      select 1 from public.mesas m
      where m.id = scenes.mesa_id
      -- Lógica simplificada de acesso à mesa
    )
  );

create policy "GM gerencia cenas"
  on public.scenes for all
  using ( is_gm_of(mesa_id) );

-- TOKENS
alter table public.tokens enable row level security;

create policy "Ver tokens visíveis"
  on public.tokens for select
  using (
    is_visible = true 
    or is_gm_of((select mesa_id from public.scenes where id = scene_id))
  );

create policy "Mover seus tokens"
  on public.tokens for update
  using (
    -- GM pode mover tudo
    is_gm_of((select mesa_id from public.scenes where id = scene_id))
    or
    -- Player pode mover seu próprio token se não estiver travado
    (
      auth.uid() = (select user_id from public.characters where id = character_id)
      and is_locked = false
    )
  );

create policy "GM cria/deleta tokens"
  on public.tokens for insert
  with check ( is_gm_of((select mesa_id from public.scenes where id = scene_id)) );

create policy "GM remove tokens"
  on public.tokens for delete
  using ( is_gm_of((select mesa_id from public.scenes where id = scene_id)) );
