-- MIGRATION: INICIATIVA E COMBATE
-- Adiciona campos para controle de turno na tabela Mesas

alter table public.mesas 
add column combat_active boolean default false,
add column turn_order jsonb default '[]'::jsonb, -- Array de { character_id, initiative_value }
add column current_turn_index integer default 0,
add column round_count integer default 1;

-- Adiciona campo de iniciativa na ficha (para bônus fixos, se houver no futuro)
alter table public.characters
add column initiative_bonus integer default 0;
