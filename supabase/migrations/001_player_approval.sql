-- Tabela de Vinculação Jogador-Mesa
create table public.mesa_players (
  mesa_id uuid references public.mesas(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  status text not null default 'pending', -- 'pending', 'approved', 'banned'
  role text not null default 'player', -- 'player', 'gm'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (mesa_id, user_id)
);

-- Habilitar RLS
alter table public.mesa_players enable row level security;

-- Políticas de Segurança
-- 1. Qualquer usuário logado pode criar uma solicitação (insert)
create policy "Usuários podem solicitar entrada" 
  on public.mesa_players for insert 
  with check (auth.uid() = user_id);

-- 2. O usuário pode ver seu próprio status
create policy "Usuários veem seu próprio status" 
  on public.mesa_players for select 
  using (auth.uid() = user_id);

-- 3. O GM da mesa pode ver todos os participantes daquela mesa
create policy "GM vê todos os participantes" 
  on public.mesa_players for select 
  using (
    exists (
      select 1 from public.mesas 
      where id = mesa_players.mesa_id 
      and gm_id = auth.uid()
    )
  );

-- 4. O GM pode atualizar status (aprovar/banir)
create policy "GM gerencia participantes" 
  on public.mesa_players for update
  using (
    exists (
      select 1 from public.mesas 
      where id = mesa_players.mesa_id 
      and gm_id = auth.uid()
    )
  );

-- Migração de dados existentes (Opcional, mas bom para garantir)
-- Insere o GM como 'approved' e 'gm' em todas as mesas existentes
insert into public.mesa_players (mesa_id, user_id, status, role)
select id, gm_id, 'approved', 'gm' from public.mesas
on conflict (mesa_id, user_id) do nothing;

-- Adicionar na publicação realtime
alter publication supabase_realtime add table public.mesa_players;
