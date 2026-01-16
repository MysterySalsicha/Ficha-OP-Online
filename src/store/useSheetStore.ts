import { create, StateCreator } from 'zustand';
import {
  SheetStore,
  CharacterDB,
  ActionResult,
  AttributeName,
  ItemDB,
  ClassName,
  SheetMode,
  WizardStep,
  InventoryItem,
  RollData,
  SkillName // Added SkillName import
} from '../core/types';
import classesData from '../data/rules/classes.json';
import progressionData from '../data/rules/progression.json';
import ritualsSeed from '../data/seed_rituals.json';
import { validateAttributeIncrease, validateAttack, validateRitualCast } from '../engine/validator';

// --- MOCK INITIAL DATA ---
const initialCharacter: CharacterDB = {
  id: 'temp-id',
  user_id: 'temp-user',
  mesa_id: 'temp-mesa', // Added
  name: 'Agente Novato',
  class: 'combatente',
  nex: 5,
  patente: 'Recruta',
  type: 'player', // Added
  attributes: { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
  stats_max: { pv: 20, pe: 2, san: 12 },
  stats_current: { 
    pv: 20, 
    pe: 2, 
    san: 12, 
    max_pv: 20, // Added
    max_pe: 2, // Added
    max_san: 12, // Added
    conditions: [], 
    is_dying: false, 
    is_unconscious: false, // Added
    is_stable: true, 
    is_incapacitated: false // Added
  },
  defenses: { passiva: 10, esquiva: 0, bloqueio: 0, mental: 0 },
  inventory_meta: { load_limit: 25, credit_limit: 'I', current_load: 0 },
  movement: 9,
  survivor_mode: false,
  stress: 0,
  skills: {},
  powers: [],
  rituals: [],
  inventory: [],
  // status_flags: { vida: 'vivo', mental: 'sao', sobrecarregado: false }, // Removed
  is_gm_mode: false,
  is_npc: false,
  is_approved_evolve: true,
  created_at: new Date().toISOString(),
  image_url: null, // Added
};

// --- HELPER FUNCTIONS ---
function getClassData(className: string): any {
  const key = className.charAt(0).toUpperCase() + className.slice(1);
  // @ts-ignore
  return classesData.classes[key];
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
    if (!cls) return { pv: 0, pe: 0, san: 0, slots: 0 }; // Return sensible defaults

    const nex = char.nex;
    const vig = char.attributes.vig;
    const pre = char.attributes.pre;

    if (char.class === 'sobrevivente') {
        const stage = char.survivor_stage || 1;
        const pv = (cls.pv_inicial || 8) + vig + (stage - 1) * ((cls.pv_por_estagio || 2) + vig);
        const pe = (cls.pe_inicial || 2) + pre + (stage - 1) * ((cls.pe_por_estagio || 1) + pre);
        const san = (cls.san_inicial || 8) + (stage - 1) * (cls.san_por_estagio || 2);
        const slots = 5 + (char.attributes.for * 5);
        return { pv, pe, san, slots };
    }

    const levels = Math.floor(nex / 5);
    const pv = cls.pv_inicial + vig + (levels - 1) * (cls.pv_por_nex + vig);
    const pe = cls.pe_inicial + pre + (levels - 1) * (cls.pe_por_nex + pre);
    const san = cls.san_inicial + (levels - 1) * (cls.san_por_nex);
    const slots = 5 + (char.attributes.for * 5);

    return { pv, pe, san, slots };
}

export const useSheetStore = create<SheetStore>()((set, get) => ({ // Removed explicit type for set
  character: initialCharacter,
  items: [],
  mode: 'view',
  creation_step: 'concept',
  creation_points_spent: 0,
  
  setCharacter: (character: CharacterDB) => set({ character }),
  setItems: (items: InventoryItem[]) => set({ items }),

  toggleMode: (mode: SheetMode) => set({ mode }),
  setCreationStep: (step: WizardStep) => set({ creation_step: step }),

  setName: (name) => {
      const { mode, character } = get();
      if (mode !== 'creation' && mode !== 'edit' && !character.is_gm_mode) return;
      set((s: SheetStore) => ({ character: { ...s.character, name } })); // Explicitly typed s
  },
  
  // Original actions re-added
  setClass: (className: ClassName) => { 
      const { mode, character, creation_step } = get();
      if (!character.is_gm_mode && (mode !== 'creation' || creation_step !== 'class')) {
        return { success: false, message: "Mudança de classe bloqueada." };
      }
      set((s: SheetStore) => ({ character: { ...s.character, class: className } })); // Explicitly typed s
      get().recalculateDerivedStats();
      return { success: true, message: `Classe definida: ${className}` };
  },
  setOrigin: (origin: string) => { 
      const { mode, character, creation_step } = get();
      if (!character.is_gm_mode && (mode !== 'creation' || creation_step !== 'origin')) {
        return { success: false, message: "Mudança de origem bloqueada." };
      }
      set((s: SheetStore) => ({ character: { ...s.character, origin } })); // Explicitly typed s
      return { success: true, message: "Origem definida" };
  },
  increaseAttribute: (attr: AttributeName) => { 
    const { character, mode, creation_points_spent } = get();
    if (character.is_gm_mode) {
         const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
         set((s: SheetStore) => ({ character: { ...s.character, attributes: newAttrs } })); // Explicitly typed s
         get().recalculateDerivedStats();
         return { success: true, message: "Atributo editado (GM)" };
    }
    if (mode === 'creation') {
        if (creation_points_spent >= 4) return { success: false, message: "Pontos esgotados" };
        if (character.attributes[attr] >= 3) return { success: false, message: "Máximo inicial atingido" };
        const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
        set((s: SheetStore) => ({ // Explicitly typed s
            character: { ...s.character, attributes: newAttrs },
            creation_points_spent: s.creation_points_spent + 1
        }));
        get().recalculateDerivedStats();
        return { success: true, message: "+1 ponto aplicado" };
    }
    if (mode === 'evolution') {
        const validation = validateAttributeIncrease(character, attr);
        if (!validation.success) return validation;
        const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
        set((s: SheetStore) => ({ character: { ...s.character, attributes: newAttrs } })); // Explicitly typed s
        get().recalculateDerivedStats();
        return { success: true, message: "Atributo evoluído!" };
    }
    return { success: false, message: "Edição bloqueada" };
  },
  increaseNEX: (amount: number) => { 
    let newNex = get().character.nex + amount;
    if (newNex > 99) newNex = 99;
    set((s: SheetStore) => ({ character: { ...s.character, nex: newNex } })); // Explicitly typed s
    get().recalculateDerivedStats();
    return { success: true, message: `NEX ${newNex}%` };
  },
  transcend: () => { 
    const { character, mode } = get();
    if (mode !== 'evolution' && !character.is_gm_mode) return { success: false, message: "Apenas na evolução" };
    return { success: true, message: "Transcender iniciado (Stub)" };
  },
  equipItem: (item: ItemDB) => { 
    set((s: SheetStore) => ({ items: [...s.items, item as any] })); // Explicitly typed s
    get().recalculateDerivedStats();
    return { success: true, message: "Item adicionado" };
  },
  castRitual: (ritualId: string) => { 
    const { character } = get();
    const ritual = ritualsSeed.find(r => r.id === ritualId);
    if (!ritual) return { success: false, message: "Erro ritual" };
    const validation = validateRitualCast(character, ritual);
    if (!validation.success) return validation;
    const newPE = character.stats_current.pe - ritual.cost_pe;
    set((s: SheetStore) => ({ // Explicitly typed s
        character: { ...s.character, stats_current: { ...s.character.stats_current, pe: newPE } }
    }));
    return { success: true, message: "Ritual Conjurado" };
  },
  performAttack: (weaponId: string) => { 
      const { character, items } = get();
      const weapon = items.find((i: InventoryItem) => i.id === weaponId); // Explicitly typed i
      if (!weapon) return { success: false, message: "Arma não encontrada" };
      const ammo = items.find((i: InventoryItem) => i.category === 'municao'); // Explicitly typed i
      const validation = validateAttack(character, weapon as any, ammo as any);
      if (!validation.success) return validation;
      return { success: true, message: "Ataque realizado!" };
  },
  recalculateDerivedStats: () => {
      const state = get();
      const char = state.character;
      const { pv, pe, san, slots } = calculateMaxStats(char);
      const totalSlots = state.items.reduce((sum, i: InventoryItem) => sum + i.slots * i.quantity, 0); // Explicitly typed i
      const sobrecarregado = totalSlots > slots;
      set((s: SheetStore) => ({ // Explicitly typed s
          character: {
              ...s.character,
              stats_max: { pv, pe, san },
              inventory_meta: { ...s.character.inventory_meta, load_limit: slots },
              // Removed status_flags as it was causing issues and is likely managed by DB or a different part of the app
              // status_flags: { ...s.character.status_flags, sobrecarregado }
          }
      }));
  },
  getRollData: (skill: SkillName, attr: AttributeName) => { // Explicitly typed skill and attr
      const char = get().character;
      const dice = char.attributes[attr] || 1;
      const bonus = char.skills[skill]?.bonus || 0;
      return {
          totalDice: dice,
          bonus,
          explanation: `${dice}d20 + ${bonus}`
      };
  },
}));