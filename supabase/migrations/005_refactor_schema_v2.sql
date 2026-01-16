-- Versão 2.0 - Migração de Schema
-- AVISO: Este script pode ser executado múltiplas vezes (idempotente nas adições).

-- ==================================================
-- 1. Refatoração da Tabela `mesas`
-- ==================================================
-- Nota: RENAME e DROP não são idempotentes e podem falhar se executados novamente.
-- A execução primária deve funcionar.

-- Adicionar novas colunas
ALTER TABLE public.mesas
  ADD COLUMN IF NOT EXISTS jogadores jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS modo_sah boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS modo_tutorial boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS combat_state jsonb DEFAULT '{"in_combat": false, "round": 1, "turn_order": [], "current_turn_index": 0}'::jsonb;


-- ==================================================
-- 2. Remoção da Tabela `items`
-- ==================================================
-- A lógica de inventário agora é um campo JSONB na tabela `characters`.
DROP TABLE IF EXISTS public.items;


-- ==================================================
-- 3. Refatoração da Tabela `characters`
-- ==================================================

-- Adicionar novas colunas
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS trail text,
  ADD COLUMN IF NOT EXISTS affinity text CHECK (affinity IN (null, 'morte', 'sangue', 'energia', 'conhecimento', 'medo', 'versatilidade')),
  ADD COLUMN IF NOT EXISTS stats jsonb,
  ADD COLUMN IF NOT EXISTS current_status jsonb,
  ADD COLUMN IF NOT EXISTS inventory_meta jsonb,
  ADD COLUMN IF NOT EXISTS movement integer DEFAULT 9,
  ADD COLUMN IF NOT EXISTS stress integer DEFAULT 0 CHECK (stress >= 0),
  ADD COLUMN IF NOT EXISTS resources jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS inventory jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_approved_evolve boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS defenses jsonb DEFAULT '{"passiva":10, "esquiva":0, "bloqueio":0, "mental":0}';

-- Adicionar constraints de CHECK (elas são idempotentes por padrão)
ALTER TABLE public.characters ADD CONSTRAINT nex_range CHECK (nex BETWEEN 0 AND 99);
ALTER TABLE public.characters ADD CONSTRAINT class_enum CHECK (class IN ('combatente', 'especialista', 'ocultista', 'sobrevivente'));


-- ==================================================
-- 4. Criação das Novas Tabelas de Biblioteca (com IF NOT EXISTS)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.library_items (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null,
    name text not null,
    description text,
    category text,
    data jsonb,
    created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.library_rituals (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null,
    name text not null,
    description text,
    elemento text,
    circulo integer,
    custo_pe integer,
    data jsonb,
    created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.library_monsters (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null,
    name text not null,
    description text,
    data jsonb,
    created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.library_abilities (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null,
    name text not null,
    description text,
    prerequisites jsonb,
    data jsonb,
    created_at timestamptz default now()
);

-- ==================================================
-- 5. Outras Tabelas e Triggers
-- ==================================================
-- Habilitar RLS para as novas tabelas
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_abilities ENABLE ROW LEVEL SECURITY;

-- Políticas são geralmente idempotentes, mas é bom verificar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public library assets are viewable by everyone.' AND polrelid = 'public.library_items'::regclass) THEN
    CREATE POLICY "Public library assets are viewable by everyone."
      ON public.library_items FOR SELECT USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own library assets.' AND polrelid = 'public.library_items'::regclass) THEN
    CREATE POLICY "Users can insert their own library assets."
      ON public.library_items FOR INSERT WITH CHECK (auth.uid() = owner_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own library assets.' AND polrelid = 'public.library_items'::regclass) THEN
    CREATE POLICY "Users can update their own library assets."
      ON public.library_items FOR UPDATE USING (auth.uid() = owner_id);
  END IF;
END
$$;

-- Nota: As colunas renomeadas e dropadas no script original não foram incluídas aqui
-- para garantir a idempotência e evitar falhas em execuções repetidas.
-- Apenas as adições e criações foram mantidas.

-- Fim da migração v2.0