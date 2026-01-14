import { supabase } from './supabase';
import { Mesa } from '../core/types';

const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createMesa = async (name: string, gmId: string) => {
  const code = generateCode();
  
  const { data, error } = await supabase
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

  if (error) throw new Error(`Erro ao criar mesa: ${error.message}`);
  return data as Mesa;
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