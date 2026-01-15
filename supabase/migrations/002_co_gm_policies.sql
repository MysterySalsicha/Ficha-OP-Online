-- Permitir que Co-Mestres (players com role 'gm') gerenciem a tabela de participantes
create policy "Co-GMs também gerenciam" 
  on public.mesa_players for update
  using (
    exists (
      select 1 from public.mesa_players as mp
      where mp.mesa_id = mesa_players.mesa_id 
      and mp.user_id = auth.uid() 
      and mp.role = 'gm'
      and mp.status = 'approved'
    )
  );

-- Opcional: Se quiser que Co-GMs possam banir/remover (Delete)
create policy "Co-GMs removem participantes" 
  on public.mesa_players for delete
  using (
    exists (
      select 1 from public.mesa_players as mp
      where mp.mesa_id = mesa_players.mesa_id 
      and mp.user_id = auth.uid() 
      and mp.role = 'gm'
      and mp.status = 'approved'
    )
  );
