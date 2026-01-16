// Re-export new types to maintain compatibility and strictness
import {
    CharacterDB,
    ItemDB,
    InventoryItem as NewInventoryItem,
    ClassName as NewClassName,
    AttributeName as NewAttributeName,
    ActionResult as NewActionResult,
    RitualRule as NewRitualRule,
    Affinity as NewAffinity,
    VitalStatus as NewVitalStatus,
    MentalStatus as NewMentalStatus,
    ItemCategory as NewItemCategory,
    Scene as NewScene,
    Token as NewToken
} from '../types/Types';

export type Character = CharacterDB;
export type Item = ItemDB;
export type InventoryItem = NewInventoryItem;
export type ClassName = NewClassName;
export type AttributeName = NewAttributeName;
export type ActionResult = NewActionResult;
export type RitualRule = NewRitualRule;
export type Affinity = NewAffinity;
export type VitalStatus = NewVitalStatus;
export type MentalStatus = NewMentalStatus;
export type ItemCategory = NewItemCategory;
export type Scene = NewScene;
export type Token = NewToken;

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
    codigo: string;
    mestre_id: string;
    name: string;
    is_active: boolean;
    jogadores: string[];
    modo_sah: boolean;
    modo_tutorial: boolean;
    created_at: string;
    
    combat_state: {
        in_combat: boolean;
        round: number;
        turn_order: { character_id: string, initiative: number }[];
        current_turn_index: number;
    };
}

export interface DieRoll {
    dice_code: string;
    results: number[];
    total: number;
    isCritical: boolean;
    details: string;
}

export interface AttackResult extends ActionResult {
    isHit?: boolean;
    isCriticalThreat?: boolean;
    attackRoll?: DieRoll;
    targetDefense?: number;
    weapon?: Item;
    attackerId?: string;
    targetId?: string;
}

export interface DamageInput {
    attackResult: AttackResult;
    damageDice: string;
    damageBonus?: number;
    isCriticalConfirmed?: boolean;
}

export interface LevelUpChoices {
    newNex: number;
    attributeChoice?: AttributeName;
    newClass?: ClassName;
    selectedPower?: string;
    selectedPath?: string;
    selectedAffinity?: Affinity;
}
