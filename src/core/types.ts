// Re-export new types to maintain compatibility and strictness
import {
    CharacterDB,
    ItemDB,
    ClassName as NewClassName,
    AttributeName as NewAttributeName,
    ActionResult as NewActionResult,
    RitualRule as NewRitualRule,
    Affinity as NewAffinity,
    VitalStatus as NewVitalStatus,
    MentalStatus as NewMentalStatus,
    ItemCategory as NewItemCategory
} from '../types/Types';

export type Character = CharacterDB;
export type Item = ItemDB;
export type ClassName = NewClassName;
export type AttributeName = NewAttributeName;
export type ActionResult = NewActionResult;
export type RitualRule = NewRitualRule;
export type Affinity = NewAffinity;
export type VitalStatus = NewVitalStatus;
export type MentalStatus = NewMentalStatus;
export type ItemCategory = NewItemCategory;

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
    created_at: string;
    
    combat_active: boolean;
    turn_order: { character_id: string, initiative: number }[];
    current_turn_index: number;
    round_count: number;

    settings: {
        survivor_mode: boolean;
    }
}

export interface DieRoll {
    dice_code: string;
    results: number[];
    total: number;
    is_critical: boolean;
}
