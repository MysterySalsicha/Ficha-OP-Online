import { create } from 'zustand';
import {
  SheetStore,
  CharacterDB,
  ActionResult,
  AttributeName,
  ItemDB,
  ClassName,
  SheetMode,
  WizardStep
} from '../types/Types';
import classesData from '../data/rules/classes.json';
import progressionData from '../data/rules/progression.json';
import ritualsSeed from '../data/seed_rituals.json';
import { validateAttributeIncrease, validateAttack, validateRitualCast } from '../engine/validator';

// --- MOCK INITIAL DATA ---
const initialCharacter: CharacterDB = {
  id: 'temp-id',
  user_id: 'temp-user',
  name: 'Agente Novato',
  class: 'combatente', // Default, will be reset in creation
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
  rituals: [],
  status_flags: { vida: 'vivo', mental: 'sao', sobrecarregado: false },
  is_gm_mode: false,
  created_at: new Date().toISOString()
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
    if (!cls) return { ...char.stats_max, slots: char.inventory_slots_max }; // Fail safe

    const nex = char.nex;
    const vig = char.attributes.vig;
    const pre = char.attributes.pre;

    // Survivor Mode Special Logic (Stage based)
    if (char.class === 'sobrevivente') {
        const stage = char.survivor_stage || 1;
        const pv = cls.pv_inicial + vig + (stage - 1) * (cls.pv_por_estagio + vig);
        const pe = cls.pe_inicial + pre + (stage - 1) * (cls.pe_por_estagio + pre);
        const san = cls.san_inicial + (stage - 1) * cls.san_por_estagio;
        const slots = 5 + (char.attributes.for * 5); // Default rule for now
        return { pv, pe, san, slots };
    }

    // Standard NEX Logic
    const levels = Math.floor(nex / 5);
    const pv = cls.pv_inicial + vig + (levels - 1) * (cls.pv_por_nex + vig);
    const pe = cls.pe_inicial + pre + (levels - 1) * (cls.pe_por_nex + pre);
    const san = cls.san_inicial + (levels - 1) * cls.san_por_nex;
    const slots = 5 + (char.attributes.for * 5);

    return { pv, pe, san, slots };
}

export const useSheetStore = create<SheetStore>((set, get) => ({
  character: initialCharacter,
  items: [],
  mode: 'view',
  creation_step: 'concept',
  creation_points_spent: 0,

  // --- ACTIONS ---

  toggleMode: (mode: SheetMode) => set({ mode }),
  setCreationStep: (step: WizardStep) => set({ creation_step: step }),

  setName: (name) => {
      const { mode, character } = get();
      if (mode !== 'creation' && mode !== 'edit' && !character.is_gm_mode) return;
      set((s) => ({ character: { ...s.character, name } }));
  },

  setClass: (className: ClassName): ActionResult => {
      const { mode, character, creation_step } = get();

      // Strict Check: Only in Creation (Step Class) or if GM
      if (!character.is_gm_mode) {
          if (mode !== 'creation' || creation_step !== 'class') {
              return { success: false, message: "Mudança de classe bloqueada." };
          }
      }

      // Check Requirements (e.g. Survivor -> Base Class requires Stage 5/NEX 5)
      // For now, allow simple set.
      set((s) => ({ character: { ...s.character, class: className } }));
      get().recalculateDerivedStats();

      return { success: true, message: `Classe definida: ${className}` };
  },

  setOrigin: (origin: string): ActionResult => {
      const { mode, character, creation_step } = get();
       if (!character.is_gm_mode) {
          if (mode !== 'creation' || creation_step !== 'origin') {
              return { success: false, message: "Mudança de origem bloqueada." };
          }
      }
      set((s) => ({ character: { ...s.character, origin } }));
      // Should apply skills here? For MVP just set string.
      return { success: true, message: "Origem definida" };
  },

  increaseAttribute: (attr: AttributeName): ActionResult => {
    const { character, mode, creation_points_spent } = get();

    // GM Override
    if (character.is_gm_mode) {
         const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
         set((s) => ({ character: { ...s.character, attributes: newAttrs } }));
         get().recalculateDerivedStats();
         return { success: true, message: "Atributo editado (GM)" };
    }

    // Creation Mode Logic
    if (mode === 'creation') {
        if (creation_points_spent >= 4) {
            return { success: false, message: "Pontos esgotados", explanation: "Você só pode distribuir 4 pontos extras." };
        }
        if (character.attributes[attr] >= 3) {
            return { success: false, message: "Máximo inicial atingido", explanation: "Atributos iniciais não podem passar de 3." };
        }

        const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
        set((s) => ({
            character: { ...s.character, attributes: newAttrs },
            creation_points_spent: s.creation_points_spent + 1
        }));
        get().recalculateDerivedStats();
        return { success: true, message: "+1 ponto aplicado" };
    }

    // Evolution Mode Logic
    if (mode === 'evolution') {
        const limit = getProgressionLimit(character.nex);
        const validation = validateAttributeIncrease(character, attr);
        if (!validation.success) return validation;

        const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
        set((s) => ({ character: { ...s.character, attributes: newAttrs } }));
        get().recalculateDerivedStats();
        return { success: true, message: "Atributo evoluído!" };
    }

    return { success: false, message: "Edição bloqueada", explanation: "Entre no modo de Evolução ou Criação." };
  },

  increaseNEX: (amount: number): ActionResult => {
    const { character } = get();
    // Logic: Only GM or explicit Event? Usually GM controls NEX.

    let newNex = character.nex + amount;
    if (newNex > 99) newNex = 99;

    set((s) => ({ character: { ...s.character, nex: newNex } }));
    get().recalculateDerivedStats();

    return { success: true, message: `NEX ${newNex}%` };
  },

  transcend: (): ActionResult => {
      const { character, mode } = get();
      if (mode !== 'evolution' && !character.is_gm_mode) return { success: false, message: "Apenas na evolução" };

      // Logic: Cost Sanity, Pick Power.
      // 1. Sanity Cost check (simplified)
      // usually costs nothing to pick, but permanent Sanity is lost?
      // Rule: "Ao transcender, você não perde sanidade atual, mas deixa de ganhar sanidade máxima no próximo nível?"
      // Actually rule is: "Escolher um poder paranormal... transcender...".
      // Let's assume standard rule: No immediate cost, but narrative/mechanic implications.

      // For now, just a stub.
      return { success: true, message: "Transcender iniciado (Stub)" };
  },

  equipItem: (item: ItemDB): ActionResult => {
    set((s) => ({ items: [...s.items, item] }));
    get().recalculateDerivedStats();
    return { success: true, message: "Item adicionado" };
  },

  castRitual: (ritualId: string): ActionResult => {
    const { character } = get();
    // Use seed for lookup
    const ritual = ritualsSeed.find(r => r.id === ritualId);
    if (!ritual) return { success: false, message: "Erro ritual" };

    const validation = validateRitualCast(character, ritual);
    if (!validation.success) return validation;

    const newPE = character.stats_current.pe - ritual.cost_pe;
    set((s) => ({
        character: { ...s.character, stats_current: { ...s.character.stats_current, pe: newPE } }
    }));

    return { success: true, message: "Ritual Conjurado" };
  },

  performAttack: (weaponId: string): ActionResult => {
      const { character, items } = get();
      const weapon = items.find(i => i.id === weaponId);
      if (!weapon) return { success: false, message: "Arma não encontrada" };

      // Validate Ammo
      // Logic to find ammo item?
      const ammo = items.find(i => i.category === 'municao'); // Simplistic
      const validation = validateAttack(character, weapon, ammo);

      if (!validation.success) return validation;

      // Deduct Ammo if needed
      if (weapon.stats.uses_ammo && ammo) {
          // decrement ammo logic
           const newItems = items.map(i => i.id === ammo.id ? { ...i, quantity: i.quantity - 1 } : i);
           set({ items: newItems });
      }

      return { success: true, message: "Ataque realizado!" };
  },

  // --- HELPERS ---

  recalculateDerivedStats: () => {
      const state = get();
      const char = state.character;

      const { pv, pe, san, slots } = calculateMaxStats(char);

      const totalSlots = state.items.reduce((sum, i) => sum + i.slots * i.quantity, 0);
      const sobrecarregado = totalSlots > slots;

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
