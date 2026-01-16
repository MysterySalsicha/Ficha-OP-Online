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

// --- DATABASE SCHEMA V2 & MERGED TYPES ---

export interface InventoryItem {
    id: string; // UUID ou ID único local para a instância do item
    item_id_ref: string; // ID do item na library_items
    name: string;
    category: ItemCategory;
    quantity: number;
    slots: number;
    current_ammo?: number; // Para armas
    is_equipped: boolean;
    stats: Record<string, any>; // Dados específicos do item (dano, critico, slots, etc.)
}

export interface CharacterDB {
  id:string;
  user_id: string | null;
  mesa_id?: string;
  name: string;
  class: ClassName;
  nex: number;
  patente: string;

  origin?: string;
  trail?: string;
  affinity?: Affinity | 'versatilidade';

  attributes: Record<AttributeName, number>;

  stats_max: { pv: number; pe: number; san: number; };
  stats_current: { pv: number; pe: number; san: number; conditions: string[], is_dying: boolean, is_stable: boolean };
  
  inventory_meta: {
    load_limit: number;
    credit_limit: string;
    current_load: number;
  };

  defenses: {
    passiva: number;
    esquiva: number;
    bloqueio: number;
    mental: number;
  };

  movement: number;
  stress: number;
  resources?: { fome: number; sede: number; fadiga: number; };

  skills: Record<string, { grau: 'destreinado' | 'treinado' | 'veterano' | 'expert', bonus: number }>;
  powers: string[];
  rituals: RitualRule[];
  inventory: InventoryItem[];

  status_flags: {
    vida: VitalStatus;
    mental: MentalStatus;
    sobrecarregado: boolean;
  };

  is_gm_mode: boolean;
  is_npc: boolean;
  is_approved_evolve: boolean;
  survivor_stage?: number;
  survivor_mode: boolean;

  created_at: string;
}

export interface ItemDB {
  id: string;
  character_id: string;
  name: string;
  category: ItemCategory;
  description?: string;

  slots: number;
  access_category: number;
  quantity: number;
  weight: number;

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

export interface Scene {
    id: string;
    mesa_id: string;
    name: string;
    image_url: string;
    grid_size: number;
    scale_meters: number;
    is_active: boolean;
}

export interface Token {
    id: string;
    scene_id: string;
    character_id?: string;
    x: number;
    y: number;
    size: number;
    is_visible: boolean;
}

// --- STORE INTERFACE ---
export interface SheetStore {
  character: CharacterDB;
  items: InventoryItem[];

  mode: SheetMode;
  creation_step: WizardStep;
  creation_points_spent: number;

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

  recalculateDerivedStats: () => void;
  getRollData: (skill: SkillName, attr: AttributeName) => RollData;

  // New actions
  setCharacter: (character: CharacterDB) => void;
  setItems: (items: InventoryItem[]) => void;
}