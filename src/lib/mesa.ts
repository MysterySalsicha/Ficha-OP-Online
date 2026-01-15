import { supabase } from './supabase';
import { Mesa } from '../core/types';

const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createMesa = async (name: string, gmId: string) => {
  const code = generateCode();
  
  // 1. Criar a mesa
  const { data: mesa, error: mesaError } = await supabase
    .from('mesas')
    .insert([
      {
        name,
        code,
        gm_id: gmId,
        is_active: true,
        settings: { survivor_mode: false }
      }
    ])
    .select()
    .single();

  if (mesaError) throw new Error(`Erro ao criar mesa: ${mesaError.message}`);

  // 2. Adicionar o GM como aprovado na tabela mesa_players
  const { error: playerError } = await supabase
    .from('mesa_players')
    .insert({
      mesa_id: mesa.id,
      user_id: gmId,
      status: 'approved',
      role: 'gm'
    });

  if (playerError) {
    console.error("Erro ao adicionar GM aos players:", playerError);
    // Não vamos falhar tudo por isso, mas é bom logar
  }

  return mesa as Mesa;
};

export const joinMesa = async (code: string) => {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('code', code)
    .single();

  if (error) throw new Error('Mesa não encontrada ou código inválido.');
  return data as Mesa;
};

export const requestJoinMesa = async (mesaId: string, userId: string) => {
  // Tenta inserir. Se já existir, ignora (ou atualiza se quiser tratar re-tentativas)
  const { error } = await supabase
    .from('mesa_players')
    .upsert({
      mesa_id: mesaId,
      user_id: userId,
      // Se já existir, mantém o status atual (não reseta para pending se já foi banido, por exemplo)
    }, { onConflict: 'mesa_id,user_id', ignoreDuplicates: true }); 

  // Nota: O comportamento ideal do upsert acima depende da regra de negócio.
  // Se 'ignoreDuplicates: true', ele não faz nada se já existe.
  // Se o usuário foi rejeitado antes e tenta de novo, talvez ele devesse ficar 'pending' de novo?
  // Por enquanto, vamos assumir que se ele já existe, checamos o status depois.
  
  if (error) throw new Error(`Erro ao solicitar entrada: ${error.message}`);
};

export const getPlayerStatus = async (mesaId: string, userId: string) => {
  const { data, error } = await supabase
    .from('mesa_players')
    .select('status, role')
    .eq('mesa_id', mesaId)
    .eq('user_id', userId)
    .single();

  if (error) return null; // Não existe registro
  return data;
};

export const getPendingPlayers = async (mesaId: string) => {
  const { data, error } = await supabase
    .from('mesa_players')
    .select('user_id, status, role, profiles(username, avatar_url)')
    .eq('mesa_id', mesaId)
    .eq('status', 'pending');
  
  if (error) throw error;
  return data;
};

export const updatePlayerStatus = async (mesaId: string, userId: string, status: 'approved' | 'rejected' | 'banned') => {
  const { error } = await supabase
    .from('mesa_players')
    .update({ status })
    .eq('mesa_id', mesaId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const promotePlayer = async (mesaId: string, userId: string) => {
  const { error } = await supabase
    .from('mesa_players')
    .update({ role: 'gm' })
    .eq('mesa_id', mesaId)
    .eq('user_id', userId);

  if (error) throw error;
};