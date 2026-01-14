export type ClassName = 'combatente' | 'especialista' | 'ocultista';
export type AttributeName = 'agi' | 'for' | 'int' | 'pre' | 'vig';
export type SkillName = string;
export type ItemCategory = 'arma' | 'equipamento' | 'veiculo' | 'pet' | 'componente' | 'municao' | 'poder';
export type Affinity = 'morte' | 'sangue' | 'energia' | 'conhecimento' | 'medo' | null;

export type VitalStatus = 'vivo' | 'morrendo' | 'morto';
export type MentalStatus = 'sao' | 'abalado' | 'enlouquecendo';

export interface ActionResult {
  success: boolean;
  message: string;
  explanation?: string;
  impact?: Record<string, any>;
  trigger?: 'LEVEL_UP_TRAIL' | 'LEVEL_UP_POWER' | 'LEVEL_UP_AFFINITY' | null;
}

export interface Character {
  id: string;
  user_id: string | null;
  mesa_id: string;
  name: string;
  class: ClassName;
  nex: number;
  patente: string;
  
  origin?: string;
  trail?: string;
  affinity?: Affinity;

  attributes: Record<AttributeName, number>;

  stats_max: {
    pv: number;
    pe: number;
    san: number;
  };
  stats_current: {
    pv: number;
    pe: number;
    san: number;
  };

  defenses: {
    passiva: number;
    esquiva: number;
    bloqueio: number;
  };
  
  inventory_slots_max: number;
  is_npc: boolean;
  is_gm_mode: boolean;
  
  status_flags: {
    vida: VitalStatus;
    mental: MentalStatus;
    sobrecarregado: boolean;
  };

  // Campos adicionados para compatibilidade
  skills: Record<string, number>;
  powers: string[];
  rituals: any[];
}

export interface Item {
  id: string;
  character_id: string;
  name: string;
  category: ItemCategory;
  slots: number;
  quantity: number;
  stats: Record<string, any>;
  access_category?: number;
}

export interface User {
    id: string;
    email?: string;
    name?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    };
}

export interface Mesa {
    id: string;
    code: string;
    gm_id: string;
    name: string;
    is_active: boolean;
    created_at: string; // Adicionado
    
    combat_active: boolean;
    turn_order: { character_id: string, initiative: number }[];
    current_turn_index: number;
    round_count: number;

    settings: {
        survivor_mode: boolean;
    }
}

export interface RitualRule {
  id: string;
  name: string;
  circle: number;
  cost_pe: number;
}

export interface DieRoll {
    dice_code: string;
    results: number[];
    total: number;
    is_critical: boolean;
}
