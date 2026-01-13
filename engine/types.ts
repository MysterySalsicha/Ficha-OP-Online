export interface Attributes {
  agi: number;
  for: number;
  int: number;
  pre: number;
  vig: number;
}

export interface CharacterSheet {
  name: string;
  nex: number;
  class?: string;
  origin?: string;
  attributes: Attributes;
  skills: string[];
  hp: {
    current: number;
    max: number; // usually calculated, but sometimes overriden
    temp: number;
  };
  san: {
    current: number;
    max: number;
  };
  pe: {
    current: number;
    max: number;
  };
  inventory: InventoryItem[];
}

export interface InventoryItem {
  name: string;
  weight: number;
  category: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TransitionRequest {
  character: CharacterSheet;
  type: 'damage' | 'healing' | 'sanityLoss' | 'sanityRestore';
  amount: number;
  gmOverride?: boolean;
}
