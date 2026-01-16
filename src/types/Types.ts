export type ClassName = 'combatente' | 'especialista' | 'ocultista' | 'sobrevivente' | 'mundano';
export type AttributeName = 'agi' | 'for' | 'int' | 'pre' | 'vig';
export type SheetMode = 'view' | 'edit' | 'evolution' | 'creation';
export type WizardStep = 'concept' | 'attributes' | 'origin' | 'class' | 'trail' | 'skills' | 'powers' | 'inventory' | 'finished';
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
export interface CharacterDB {
  id: string;
  user_id: string;
  name: string;
  class: ClassName;
  nex: number;
  survivor_stage?: number; // 0-5
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

export interface ItemDB {
  id: string;
  character_id: string;
  name: string;
  category: ItemCategory;
  description?: string;

  // Mecânicas
  slots: number;
  access_category: number; // 0=Livre, 1=I, etc.
  quantity: number;
  weight: number; // Keep for legacy/mass calculation if needed, but slots is priority

  stats: Record<string, any>;
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

// --- STORE INTERFACE ---
export interface SheetStore {
  character: CharacterDB;
  items: ItemDB[];

  mode: SheetMode;
  creation_step: WizardStep;
  creation_points_spent: number; // Track attribute points spent during creation

  // Actions
  toggleMode: (mode: SheetMode) => void;
  setCreationStep: (step: WizardStep) => void;

  setName: (name: string) => void;
  setClass: (className: ClassName) => ActionResult;
  setOrigin: (origin: string) => ActionResult;

  increaseAttribute: (attr: AttributeName) => ActionResult;
  increaseNEX: (amount: number) => ActionResult;
  transcend: () => ActionResult;

  equipItem: (item: ItemDB) => ActionResult;
  castRitual: (ritualId: string) => ActionResult;
  performAttack: (weaponId: string) => ActionResult;

  // Helpers
  recalculateDerivedStats: () => void;
  getRollData: (skill: SkillName, attr: AttributeName) => RollData;
}
