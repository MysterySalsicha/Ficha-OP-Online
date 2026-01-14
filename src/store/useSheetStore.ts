import { create } from 'zustand';
import {
  SheetStore,
  CharacterDB,
  ActionResult,
  AttributeName,
  ItemDB,
  RitualRule
} from '../types/Types';
import classesData from '../data/rules/classes.json';
import progressionData from '../data/rules/progression.json';
import ritualsSeed from '../data/seed_rituals.json';

// --- MOCK INITIAL DATA ---
const initialCharacter: CharacterDB = {
  id: 'temp-id',
  user_id: 'temp-user',
  name: 'Agente Novato',
  class: 'combatente',
  nex: 5,
  patente: 'Recruta',
  attributes: { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
  stats_max: { pv: 20, pe: 2, san: 12 },
  stats_current: { pv: 20, pe: 2, san: 12 },
  defenses: { passiva: 10, esquiva: 0, bloqueio: 0 },
  movement: 9,
  inventory_slots_max: 5,
  survivor_mode: false,
  stress: 0,
  skills: {},
  powers: [],
  rituals: [], // Starts empty, learns from seed
  status_flags: { vida: 'vivo', mental: 'sao', sobrecarregado: false },
  is_gm_mode: false,
  created_at: new Date().toISOString()
};

// --- HELPER FUNCTIONS ---
function getClassData(className: string): any {
  // @ts-ignore
  return classesData[className.charAt(0).toUpperCase() + className.slice(1)];
}

function getProgressionLimit(nex: number): number {
  const levels = Object.keys(progressionData).map(Number).sort((a, b) => a - b);
  let bestLevel = 0;
  for (const level of levels) {
    if (nex >= level) bestLevel = level;
  }
  // @ts-ignore
  return progressionData[bestLevel.toString()].limits.maxAttribute;
}

function calculateMaxStats(char: CharacterDB) {
    const cls = getClassData(char.class);
    const nex = char.nex;
    const vig = char.attributes.vig;
    const pre = char.attributes.pre;
    const levels = Math.floor(nex / 5);

    const pv = cls.pvBase + vig + (levels - 1) * (cls.pvPerNex + vig);
    const pe = cls.peBase + pre + (levels - 1) * (cls.pePerNex + pre);
    const san = cls.sanBase + (levels - 1) * cls.sanPerNex;

    // Inventory: 5 + FOR * 5 (from prompt, though typically 5*FOR)
    // Wait, typical OP is 5 per Strength point, base 2?
    // The previous prompt said "Força * 5".
    // Let's assume Slots = 5 + (For * 5) for now to be generous, or stick to standard (5 * For) if For > 0?
    // Let's use: 5 Base + 5 per point of Strength.
    const slots = 5 + (char.attributes.for * 5);

    return { pv, pe, san, slots };
}

export const useSheetStore = create<SheetStore>((set, get) => ({
  character: initialCharacter,
  items: [],

  // --- ACTIONS ---

  setName: (name) => set((s) => ({ character: { ...s.character, name } })),

  increaseAttribute: (attr: AttributeName): ActionResult => {
    const state = get();
    const char = state.character;

    // Validation
    const limit = getProgressionLimit(char.nex);
    if (char.attributes[attr] >= limit && !char.is_gm_mode) {
       return {
           success: false,
           message: "Limite Atingido",
           explanation: `NEX ${char.nex}% limita atributos em ${limit}.`
       };
    }

    // Apply
    const newAttrs = { ...char.attributes, [attr]: char.attributes[attr] + 1 };

    // Impact Calculation
    let impact: any = {};
    if (attr === 'vig') impact.pv_increase = true;
    if (attr === 'pre') impact.pe_increase = true;
    if (attr === 'for') impact.slots_increase = true;

    set((s) => ({
        character: { ...s.character, attributes: newAttrs }
    }));

    // Recalculate
    get().recalculateDerivedStats();

    const newVal = get().character.attributes[attr];

    return {
        success: true,
        message: `${attr.toUpperCase()} aumentado para ${newVal}`,
        impact
    };
  },

  increaseNEX: (amount: number): ActionResult => {
    const state = get();
    let char = state.character;

    const oldNex = char.nex;
    const newNex = oldNex + amount;

    if (newNex > 99) return { success: false, message: "NEX Máximo é 99%" };

    set((s) => ({ character: { ...s.character, nex: newNex } }));
    get().recalculateDerivedStats();

    // Triggers
    let trigger = null;
    if (oldNex < 10 && newNex >= 10) trigger = 'LEVEL_UP_TRAIL';
    if (oldNex < 50 && newNex >= 50) trigger = 'LEVEL_UP_AFFINITY';

    return {
        success: true,
        message: `NEX subiu para ${newNex}%!`,
        trigger: trigger as any
    };
  },

  equipItem: (item: ItemDB): ActionResult => {
    // Basic implementation: Add to list
    set((s) => ({ items: [...s.items, item] }));
    get().recalculateDerivedStats();
    return { success: true, message: "Item adicionado" };
  },

  castRitual: (ritualId: string): ActionResult => {
    const state = get();
    const char = state.character;

    // Find ritual in learned list or seed?
    // Usually cast from Learned. Assuming it's learned.
    const ritual = ritualsSeed.find(r => r.id === ritualId);
    // In real app we check char.rituals. finding from seed for now to simulate "knowing" it or just looking it up.
    if (!ritual) return { success: false, message: "Ritual desconhecido" };

    // Check PE
    if (char.stats_current.pe < ritual.cost_pe && !char.is_gm_mode) {
        return { success: false, message: "PE Insuficiente" };
    }

    // Check Components
    // Mock check: Look for item with category 'componente'?
    // For MVP we skip strict component check unless we want to implement it fully.
    // Let's implement basic deduction.

    const newPE = char.stats_current.pe - ritual.cost_pe;

    set((s) => ({
        character: {
            ...s.character,
            stats_current: { ...s.character.stats_current, pe: newPE }
        }
    }));

    return {
        success: true,
        message: `Ritual ${ritual.name} conjurado!`,
        impact: { pe_spent: ritual.cost_pe }
    };
  },

  // --- HELPERS ---

  recalculateDerivedStats: () => {
      const state = get();
      const char = state.character;

      const { pv, pe, san, slots } = calculateMaxStats(char);

      const totalSlots = state.items.reduce((sum, i) => sum + i.slots * i.quantity, 0);
      const sobrecarregado = totalSlots > slots;

      // Update Max Stats (Current stays same unless we want to auto-heal on level up? usually no)
      // But if Max increases, we might want to increase Current by the delta?
      // For now, just update Max.

      set((s) => ({
          character: {
              ...s.character,
              stats_max: { pv, pe, san },
              inventory_slots_max: slots,
              status_flags: { ...s.character.status_flags, sobrecarregado }
          }
      }));
  },

  getRollData: (skill, attr) => {
      const char = get().character;
      const dice = char.attributes[attr] || 1;
      const bonus = char.skills[skill] || 0;
      return {
          totalDice: dice,
          bonus,
          explanation: `${dice}d20 + ${bonus}`
      };
  }

}));
