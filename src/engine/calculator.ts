import { Character, ClassName, Item } from '../core/types';
import classesData from '../data/rules/classes.json';
import progressionData from '../data/rules/progression.json';

// Types for the JSON data to avoid TS errors
type ClassData = {
  pvBase: number;
  pvPerNex: number;
  peBase: number;
  pePerNex: number;
  sanBase: number;
  sanPerNex: number;
  trainedSkills: number;
  proficiencies: string[];
};

type ProgressionStage = {
    patent: string;
    limits: {
        maxAttribute: number;
        maxSkill: string;
    }
};

const classes: Record<string, ClassData> = classesData as any;
const progression: Record<string, ProgressionStage> = progressionData as any;

/**
 * Calculates the Maximum Stats (PV, PE, SAN) based on Class, NEX, and Attributes.
 */
export function calculateMaxStats(char: Character) {
  const className = char.class.charAt(0).toUpperCase() + char.class.slice(1);
  const cls = classes[className];

  if (!cls) {
      // Fallback for custom classes or errors
      return { pv: 1, pe: 1, san: 1 };
  }

  const nex = char.nex;
  const vig = char.attributes.vig;
  const pre = char.attributes.pre;

  // Levels starting from 1. NEX 5 = Level 1? No, NEX 5 is 5% exposure.
  // Standard Ordem:
  // Initial (NEX 5): Base + Attr
  // Per NEX Step (every 5%): + (PerNex + Attr) ?
  // Actually, usually it's Base + (Level-1)*Growth.
  // Let's assume standard RPG progression:
  // Level 1 (NEX 5): Base + Vig
  // Each subsequent 5% adds: PvPerNex + Vig (if Combatant/Specialist?) or just PvPerNex?
  // Usually: PV = Base + VIG + (NEX/5 - 1) * (PerNex + VIG)
  // Let's implement that formula.

  const level = Math.max(1, Math.floor(nex / 5));

  const pv = cls.pvBase + vig + ((level - 1) * (cls.pvPerNex + vig));
  const pe = cls.peBase + pre + ((level - 1) * (cls.pePerNex + pre));
  const san = cls.sanBase + ((level - 1) * cls.sanPerNex);

  return { pv, pe, san };
}

/**
 * Calculates the Maximum Inventory Slots (Load Capacity).
 */
export function calculateInventorySlots(char: Character): number {
    // Base 5 + 5 per Strength point
    const base = 5;
    const fromStr = char.attributes.for * 5;
    // Add backpack or other items logic here if needed (would need to check items list)
    return base + fromStr;
}

/**
 * Calculates current defenses (Passive, Dodge, Block).
 */
export function calculateDefenses(char: Character, equippedItems: Item[]) {
    // Base 10 + AGI
    const base = 10;
    const agi = char.attributes.agi;

    // Sum bonuses from equipped items (armor, shields)
    // Assuming item.stats has 'defense_bonus'
    let equipmentBonus = 0;
    equippedItems.forEach(item => {
        if (item.stats && item.stats.defense_bonus) {
            equipmentBonus += Number(item.stats.defense_bonus);
        }
    });

    // Modifiers from conditions/rituals would go here.

    const passiva = base + agi + equipmentBonus;

    // Esquiva usually adds Reflexos skill? For now just AGI-based or same as passive + skill.
    // Let's keep it simple: Same as passive unless explicit dodge bonus.
    const esquiva = passiva; // + Reflexos skill rank bonus

    // Block: Damage reduction, not AC. But sometimes stored as a value.
    const bloqueio = 0; // Calculated during reaction usually (Fight skill + Fortitude)

    return { passiva, esquiva, bloqueio };
}

/**
 * Gets the progression limits (Max Attribute, Max Skill Rank) for the current NEX.
 */
export function getProgressionLimits(nex: number) {
    // Find highest key <= nex
    const levels = Object.keys(progression).map(Number).sort((a, b) => a - b);
    let bestLevel = 0;
    for (const level of levels) {
      if (nex >= level) bestLevel = level;
    }

    return progression[bestLevel.toString()].limits;
}

/**
 * Updates a Character's derived stats based on its base stats and rules.
 * Returns a new Character object.
 */
export function recalculateCharacter(char: Character, items: Item[]): Character {
    const maxStats = calculateMaxStats(char);
    const slots = calculateInventorySlots(char);
    const defenses = calculateDefenses(char, items);

    // Update patent based on NEX
    const levels = Object.keys(progression).map(Number).sort((a, b) => a - b);
    let bestLevel = 0;
    for (const level of levels) {
      if (char.nex >= level) bestLevel = level;
    }
    const patent = progression[bestLevel.toString()].patent;

    return {
        ...char,
        patente: patent,
        stats_max: maxStats,
        inventory_slots_max: slots,
        defenses: defenses
    };
}
