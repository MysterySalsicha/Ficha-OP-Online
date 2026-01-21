import { UUID } from "crypto"; // Assuming UUID is a type or globally available

// ==================================================
// Core Types
// ==================================================

export type ClassName = 'combatente' | 'especialista' | 'ocultista' | 'sobrevivente' | 'mundano';
export type Alignment = 'ordem' | 'neutro' | 'caos';
export type AttributeName = 'for' | 'agi' | 'int' | 'pre' | 'vig';
export type Element = 'morte' | 'sangue' | 'energia' | 'conhecimento' | 'medo' | 'fisico' | 'mental' | 'detrimento' | 'versatilidade';
export type RitualType = 'passiva' | 'ativa';
export type TokenType = 'player' | 'npc' | 'object';

// From old Types.ts file
export type SheetMode = 'view' | 'edit' | 'evolution' | 'creation';
export type WizardStep = 'concept' | 'attributes' | 'origin' | 'class' | 'trail' | 'skills' | 'powers' | 'inventory' | 'finished';
export type SkillName = string;
export type ItemCategory = 'arma' | 'equipamento' | 'veiculo' | 'pet' | 'componente' | 'municao' | 'poder' | 'vestimenta';
export type Affinity = 'morte' | 'sangue' | 'energia' | 'conhecimento' | 'medo' | null;

export type VitalStatus = 'vivo' | 'morrendo' | 'morto';
export type MentalStatus = 'sao' | 'abalado' | 'enlouquecendo';

export type PlayerRole = 'player' | 'gm' | 'co-gm';
export type PlayerStatus = 'pending' | 'approved' | 'rejected' | 'banned';

export interface PlayerMesaStatus {
    mesa_id: string;
    user_id: string;
    status: PlayerStatus;
    role: PlayerRole;
}

export interface User {
    id: string;
    email?: string; // Optional to match Supabase User
    username?: string; // Optional to match Supabase User
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    };
}

export interface CharacterDB {
    id: string;
    user_id: string | null;
    mesa_id: string;
    name: string;
    nex: number;
    class: ClassName;
    origin?: string;
    trail?: string;
    affinity?: Element | null;
    image_url: string | null;
    profile_image_url?: string; // New field for character profile image
    token_image_url?: string; // New field for character token image

    type: 'player' | 'npc';
    patente: string;
    attributes: Record<AttributeName, number>;

    stats_max: { // Moved to top-level
        pv: number;
        pe: number;
        san: number;
    };
    stats_current: {
        pv: number;
        pe: number;
        san: number;
        max_pv: number; // For display
        max_pe: number; // For display
        max_san: number; // For display
        is_dying: boolean;
        is_unconscious: boolean; // Added
        is_stable: boolean;
        is_incapacitated: boolean; // Added
        conditions: string[];
    };
    inventory_meta: {
        load_limit: number;
        current_load: number;
        credit_limit: string;
    };
    movement: number;
    stress: number;
    resources?: { fome: number; sede: number; fadiga: number; };
    inventory: InventoryItem[];
    defenses: {
        passiva: number;
        esquiva: number;
        bloqueio: number;
        mental: number;
    };
    is_approved_evolve: boolean;
    is_gm_mode: boolean;
    is_npc: boolean; // Keep for now as it's used
    survivor_stage?: number;
    survivor_mode: boolean;

    skills: Record<string, { grau: 'destreinado' | 'treinado' | 'veterano' | 'expert', bonus: number }>;
    powers: string[];
    rituals: RitualRule[];

    created_at?: string; // Added
}

export type Character = CharacterDB;

export interface Token {
    id: string;
    character_id?: string;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    image_url: string;
    size: number;
    is_controlled_by?: string;
    type: TokenType;
    is_visible?: boolean;
}

export interface Scene {
    id: string;
    mesa_id: string;
    name: string;
    image_url: string;
    is_active: boolean;
    tokens: Token[];
    grid_size: number;
    scale_meters: number;
    grid?: { // Made optional, as it might not be fully implemented everywhere
        size: number;
        color: string;
        opacity: number;
        offsetX: number;
        offsetY: number;
    };
}

export interface Mesa {
    id: string;
    name: string;
    code: string;
    mestre_id: string;
    current_scene_id: string | null;
    scenes: Scene[];
    log: any[];
    combat_state: {
        in_combat: boolean;
        turn_order: { character_id: string; initiative: number }[];
        current_turn_index: number;
        round: number;
    };
    jogadores: any[];
    modo_sah: boolean;
    modo_tutorial: boolean;
    created_at?: string;
}

export interface Message {
    id: string;
    mesa_id: string;
    user_id: string;
    character_id: string | null;
    type: 'text' | 'roll' | 'system' | 'image' | 'whisper';
    content: {
        text?: string;
        results?: number[];
        total?: number;
        details?: string;
        modifier?: number;
        imageUrl?: string;
        dice_code?: string; // Added from DieRoll in previous build errors
        isCritical?: boolean; // Added from DieRoll in previous build errors
        rollMode?: 'normal' | 'advantage' | 'disadvantage';
        originalDiceCount?: number;
        isKeepLowest?: boolean;
        is_hidden?: boolean; // Adicionado para rolagens ocultas
    };
    created_at: string;
    target_user_id: string | null;
}

export interface ItemDB {
    id: string;
    name: string;
    description?: string;
    category: ItemCategory;
    data?: any;
    slots: number;
    access_category: number;
    weight: number;
    is_custom?: boolean;
    stats?: Record<string, any>; // Make optional for safety
}

export type Item = ItemDB;

export interface InventoryItem extends ItemDB {
    id: string; // UUID ou ID único local para a instância do item NO INVENTARIO
    item_id_ref: string;
    quantity: number;
    is_equipped: boolean;
    current_ammo?: number;
}

export interface DieRoll {
    results: number[];
    total: number;
    details: string;
    modifier: number;
    dice_code?: string; // Re-added
    isCritical?: boolean; // Re-added
    rollMode?: 'normal' | 'advantage' | 'disadvantage';
    originalDiceCount?: number;
    isKeepLowest?: boolean;
}

export interface ActionResult {
    success: boolean;
    message: string;
    explanation?: string;
    impact?: Record<string, any>;
    trigger?: 'LEVEL_UP_TRAIL' | 'LEVEL_UP_POWER' | 'LEVEL_UP_AFFINITY' | null;
}

export interface AttackResult extends ActionResult {
    isHit: boolean;
    isCriticalThreat: boolean;
    attackRoll: DieRoll;
    targetDefense: number;
    weapon: InventoryItem;
    attackerId: string;
    targetId: string;
}

export interface DamageInput {
    attackResult: AttackResult;
    damageDice: string;
    damageBonus?: number;
    isCriticalConfirmed?: boolean;
}

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

export interface LevelUpChoices {
    newNex: number;
    attributeChoice?: AttributeName;
    newClass?: ClassName;
    selectedPower?: string;
    selectedPath?: string;
    selectedAffinity?: Affinity;
}

export interface MonsterTemplate {
    id: string;
    owner_id: string | null; // null for official bestiary
    name: string;
    description?: string;
    category?: string; // e.g., "Mundo", "Outro Lado"
    profile_image_url?: string; // New field
    token_image_url?: string;   // New field
    attributes: Record<AttributeName, number>; // New structured field
    stats_max: { // New structured field
        pv: number;
        pe: number;
        san: number;
    };
    defenses: { // New structured field
        passiva: number;
        esquiva: number;
        bloqueio: number;
        mental: number;
    };
    abilities?: string[]; // New structured field (array of strings for now)
    is_public: boolean; // can others see/use this template
    created_at?: string;
}

export interface ItemTemplate { // For reusable item definitions (library items)
    id: string;
    owner_id: string | null; // null for official bestiary
    name: string;
    description?: string;
    category: ItemCategory;
    image_url?: string;
    roll_type?: 'none' | 'attack' | 'damage' | 'save'; // New field for special roll type
    roll_data?: string; // New field for roll expression (e.g., "1d20+agi")
    stats?: Record<string, any>; // More structured stats, aligning with ItemDB
    is_public: boolean;
    created_at?: string;
}

export interface JournalEntry { // Added JournalEntry
    id: string;
    user_id: string; // Owner of the note
    mesa_id: string; // The mesa it belongs to
    title: string;
    content: string; // Markdown or rich text content
    created_at?: string;
    updated_at?: string;
}


// --- STORE INTERFACE (useSheetStore) ---
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
    setProfileImageUrl: (url: string) => void; // New action
    setTokenImageUrl: (url: string) => void;   // New action
    isRollModalOpen: boolean; // New state for roll modal
    setIsRollModalOpen: (isOpen: boolean) => void; // New action for roll modal
    rollModalInputValue: string;
    setRollModalInputValue: (value: string) => void;
    rollFaces: number;
    openRollModal: (faces: number) => void;
    updateCharacterCurrentStats: (key: 'pv' | 'pe' | 'san', value: number) => void;
}