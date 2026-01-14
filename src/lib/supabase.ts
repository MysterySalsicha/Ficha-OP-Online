import { createClient } from '@supabase/supabase-js';

// Casting para ignorar erro de tipagem do Vite no build
const env = (import.meta as any).env;

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);