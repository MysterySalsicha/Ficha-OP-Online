export type ClassName = 'combatente' | 'especialista' | 'ocultista';
export type AttributeName = 'agi' | 'for' | 'int' | 'pre' | 'vig';
export type SkillName = string;
export type ItemCategory = 'arma' | 'equipamento' | 'veiculo' | 'pet' | 'componente' | 'municao' | 'poder';
export type Affinity = 'morte' | 'sangue' | 'energia' | 'conhecimento' | 'medo' | null;

export type VitalStatus = 'vivo' | 'morrendo' | 'morto';
export type MentalStatus = 'sao' | 'abalado' | 'enlouquecendo';

// --- RICH ACTION RESULT (UX) ---
export interface ActionResult {
  success: boolean;
  message: string;      // Short toast message
  explanation?: string; // Long educational text
  impact?: Record<string, any>; // UI updates (e.g., { pv_diff: +4 })
  trigger?: 'LEVEL_UP_TRAIL' | 'LEVEL_UP_POWER' | 'LEVEL_UP_AFFINITY' | null;
}

// --- DATABASE SCHEMA V2 ---
export interface Character {
  id: string;
  user_id: string;
  mesa_id?: string;
  name: string;
  class: ClassName;
  nex: number;
  patente: string;

  // Identidade Mecânica
  origin?: string;
  trail?: string;
  affinity?: Affinity;

  // Atributos Base
  attributes: Record<AttributeName, number>;

  // Stats Calculados (Snapshot)
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

  // Resistências e Movimento
  defenses: {
    passiva: number;
    esquiva: number;
    bloqueio: number;
  };
  movement: number;

  // Inventário e SaH
  inventory_slots_max: number;
  survivor_mode: boolean;
  stress: number;

  // Progressão
  skills: Record<SkillName, number>; // 0, 5, 10, 15
  powers: string[]; // IDs or Names of powers
  rituals: RitualRule[];

  // Flags de Estado
  status_flags: {
    vida: VitalStatus;
    mental: MentalStatus;
    sobrecarregado: boolean;
  };
  is_gm_mode: boolean;

  created_at: string;
}

export interface Item {
  id: string;
  character_id: string;
  name: string;
  category: ItemCategory;
  description?: string;

  // Mecânicas
  slots: number;
  access_category: number; // 0=Livre, 1=I, etc.
  quantity: number;
  weight: number;

  stats: Record<string, any>; // Generic stats

  // Weapon Specifics
  critical_range?: number; // e.g., 19 (for 19-20)
  critical_multiplier?: number; // e.g., 3 (for x3)
  damage_dice?: string; // "1d8"

  is_custom: boolean;
}

// --- LOGIC HELPERS ---
export interface RollData {
  totalDice: number;
  bonus: number;
  explanation: string;
}

export interface ClassRule {
  pvBase: number;
  pvPerNex: number;
  peBase: number;
  pePerNex: number;
  sanBase: number;
  sanPerNex: number;
  trainedSkills: number;
  proficiencies: string[];
}

export interface RitualRule {
  id: string;
  name: string;
  element: string;
  circle: number;
  cost_pe: number;
  execution?: string;
  range?: string;
  target?: string;
  duration?: string;
  resistance?: string;
  description?: string;
  tutorial_text?: string;
  mechanical_effect?: Record<string, any>;
  components?: string[];
}

// --- APP CONTEXT ---

export interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
}

export interface Mesa {
    id: string;
    code: string;
    gm_id: string;
    name: string;
    created_at: string;
    is_active: boolean;
    settings: {
        survivor_mode: boolean;
        turn_timer_seconds?: number;
    }
}

export interface ChatMessage {
    id: string;
    mesa_id: string;
    user_id: string;
    character_name?: string; // Cache for display
    type: 'text' | 'roll' | 'item_transfer' | 'system';
    content: string; // JSON string for complex types
    is_hidden: boolean;
    created_at: string;
}

export interface DieRoll {
    dice_code: string; // "3d20"
    results: number[];
    total: number;
    is_critical: boolean;
}
