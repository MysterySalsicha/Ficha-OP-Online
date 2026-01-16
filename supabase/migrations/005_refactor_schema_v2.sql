-- Versão 2.0 - Migração de Schema
-- AVISO: Este script contém alterações destrutivas. Faça backup dos seus dados.

-- ==================================================
-- 1. Refatoração da Tabela `mesas`
-- ==================================================

-- Renomear colunas para o novo padrão
ALTER TABLE public.mesas RENAME COLUMN code TO codigo;
ALTER TABLE public.mesas RENAME COLUMN gm_id TO mestre_id;

-- Adicionar novas colunas
ALTER TABLE public.mesas
  ADD COLUMN jogadores jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN modo_sah boolean DEFAULT false,
  ADD COLUMN modo_tutorial boolean DEFAULT true,
  ADD COLUMN combat_state jsonb DEFAULT '{"in_combat": false, "round": 1, "turn_order": [], "current_turn_index": 0}'::jsonb;

-- Remover colunas antigas que foram movidas ou descontinuadas
ALTER TABLE public.mesas
  DROP COLUMN is_active,
  DROP COLUMN settings,
  DROP COLUMN combat_active,
  DROP COLUMN turn_order,
  DROP COLUMN current_turn_index,
  DROP COLUMN round_count;


-- ==================================================
-- 2. Remoção da Tabela `items`
-- ==================================================
-- A lógica de inventário agora será um campo JSONB na tabela `characters`.
DROP TABLE public.items;


-- ==================================================
-- 3. Refatoração da Tabela `characters`
-- ==================================================

-- Adicionar novas colunas
ALTER TABLE public.characters
  ADD COLUMN origin text,
  ADD COLUMN trail text,
  ADD COLUMN affinity text CHECK (affinity IN (null, 'morte', 'sangue', 'energia', 'conhecimento', 'medo', 'versatilidade')),
  ADD COLUMN stats jsonb, -- Será populado posteriormente
  ADD COLUMN current_status jsonb, -- Será populado posteriormente
  ADD COLUMN inventory_meta jsonb, -- Será populado posteriormente
  ADD COLUMN movement integer DEFAULT 9,
  ADD COLUMN stress integer DEFAULT 0 CHECK (stress >= 0),
  ADD COLUMN resources jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN inventory jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN is_approved_evolve boolean DEFAULT false;

-- Adicionar constraints de CHECK
ALTER TABLE public.characters ADD CONSTRAINT nex_range CHECK (nex BETWEEN 0 AND 99);
ALTER TABLE public.characters ADD CONSTRAINT class_enum CHECK (class IN ('combatente', 'especialista', 'ocultista', 'sobrevivente'));
-- A constraint de `attributes` é mais complexa e será adicionada abaixo.


-- Remover colunas antigas
ALTER TABLE public.characters
  DROP COLUMN stats_max,
  DROP COLUMN stats_current,
  DROP COLUMN defenses,
  DROP COLUMN inventory_slots_max,
  DROP COLUMN survivor_mode,
  DROP COLUMN status_flags,
  DROP COLUMN is_public,
  DROP COLUMN is_gm_mode,
  DROP COLUMN can_evolve;

-- Adicionar nova coluna de defesas ao invés da antiga
ALTER TABLE public.characters ADD COLUMN defenses jsonb DEFAULT '{"passiva":10, "esquiva":0, "bloqueio":0, "mental":0}';


-- ==================================================
-- 4. Criação das Novas Tabelas de Biblioteca
-- ==================================================

CREATE TABLE public.library_items (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null, -- Null para itens oficiais
    name text not null,
    description text,
    category text,
    data jsonb, -- Dano, crítico, efeito, etc.
    created_at timestamptz default now()
);

CREATE TABLE public.library_rituals (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null,
    name text not null,
    description text,
    elemento text,
    circulo integer,
    custo_pe integer,
    data jsonb, -- Alvo, alcance, duração, etc.
    created_at timestamptz default now()
);

CREATE TABLE public.library_monsters (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null,
    name text not null,
    description text,
    data jsonb, -- Stats, ataques, habilidades, etc.
    created_at timestamptz default now()
);

CREATE TABLE public.library_abilities (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users(id) null,
    name text not null,
    description text,
    prerequisites jsonb, -- { "class": "combatente", "nex": 15 }
    data jsonb, -- Efeitos mecânicos
    created_at timestamptz default now()
);

-- ==================================================
-- 5. Outras Tabelas e Triggers
-- ==================================================
-- Por simplicidade, a tabela de chat e outras podem ser mantidas e adaptadas no código.
-- O trigger para o recálculo de stats_max é uma otimização avançada.
-- Para o escopo inicial, faremos o recálculo via código no `rules.ts` e salvaremos no `characters.stats`.

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_abilities ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para bibliotecas (qualquer um pode ler, só o dono pode editar)
CREATE POLICY "Public library assets are viewable by everyone."
  ON public.library_items FOR SELECT USING (true);

CREATE POLICY "Users can insert their own library assets."
  ON public.library_items FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own library assets."
  ON public.library_items FOR UPDATE USING (auth.uid() = owner_id);

-- Repetir as políticas para as outras tabelas de biblioteca...

-- Fim da migração v2.0
