-- ==========================================
-- STORAGE: AVATARS
-- ==========================================

-- 1. Criar o Bucket 'avatars' (se não existir, deve ser criado via painel, mas as policies são via SQL)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Permitir que qualquer usuário autenticado faça upload de imagens
create policy "Usuários podem fazer upload de avatares"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
  );

-- 3. Permitir que usuários atualizem seus próprios arquivos
create policy "Usuários podem atualizar seus próprios avatares"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid() = owner
  );

-- 4. Permitir leitura pública (para que outros vejam o avatar)
create policy "Qualquer um pode ver avatares"
  on storage.objects for select
  using ( bucket_id = 'avatars' );
