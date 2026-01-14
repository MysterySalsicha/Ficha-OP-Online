import { create } from 'zustand';
import {
    Character,
    Mesa,
    User,
    ActionResult,
    AttributeName,
    RitualRule,
    Item
} from '../core/types';
import { recalculateCharacter } from '../engine/calculator';
import { validateAttributeIncrease, validateRitualCast, validateItemAdd, validateAttack } from '../engine/validator';

interface GameState {
    currentUser: User | null;
    currentMesa: Mesa | null;
    character: Character | null; // The active character sheet (player's or GM's view)
    items: Item[]; // Items of the current character

    // Actions
    setCurrentUser: (user: User | null) => void;
    setMesa: (mesa: Mesa | null) => void;
    loadCharacter: (char: Character, items: Item[]) => void;

    // Atomic Actions (Rigid Rules)
    increaseAttribute: (attr: AttributeName) => ActionResult;
    castRitual: (ritual: RitualRule) => ActionResult;
    addItem: (item: Item) => ActionResult;

    // Combat Actions
    performAttack: (weaponId: string) => ActionResult;

    // Gameplay Actions
    rollDice: (diceCode: string, purpose?: string) => ActionResult;
    createMesa: (name: string) => Promise<ActionResult>;
    joinMesa: (code: string) => Promise<ActionResult>;

    // Utils
    toggleGmMode: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    currentUser: null,
    currentMesa: null,
    character: null,
    items: [],

    setCurrentUser: (user) => set({ currentUser: user }),
    setMesa: (mesa) => set({ currentMesa: mesa }),

    createMesa: async (name) => {
        // In a real app, this calls Supabase.
        // Mock implementation for the architecture:
        const user = get().currentUser;
        if (!user) return { success: false, message: "Login necessário" };

        const newMesa: Mesa = {
            id: 'mock-mesa-id',
            code: 'MOCK-CODE',
            gm_id: user.id,
            name: name,
            is_active: true,
            created_at: new Date().toISOString(),
            settings: { survivor_mode: false }
        };
        set({ currentMesa: newMesa });
        return { success: true, message: "Mesa criada com sucesso", impact: { code: 'MOCK-CODE' } };
    },

    joinMesa: async (code) => {
        // Mock implementation
        if (code === 'INVALID') return { success: false, message: "Código inválido" };

        const mockMesa: Mesa = {
            id: 'joined-mesa-id',
            code: code,
            gm_id: 'gm-id',
            name: 'Mesa Encontrada',
            is_active: true,
            created_at: new Date().toISOString(),
            settings: { survivor_mode: false }
        };
        set({ currentMesa: mockMesa });
        return { success: true, message: "Entrou na mesa!" };
    },

    performAttack: (weaponId) => {
        const { character, items } = get();
        if (!character) return { success: false, message: "Sem personagem" };

        const weapon = items.find(i => i.id === weaponId);
        if (!weapon) return { success: false, message: "Arma não encontrada" };

        // 1. Identify Ammo (Simplified: assumes 1st ammo found or specific link)
        // In a real app, user selects ammo.
        // For MVP, if weapon uses ammo, find 'municao' item.
        let ammo: Item | undefined;
        if (weapon.stats.uses_ammo) {
            ammo = items.find(i => i.category === 'municao'); // Should filter by caliber
        }

        // 2. Validate (Atomic)
        const validation = validateAttack(character, weapon, ammo);
        if (!validation.success) return validation;

        // 3. Consume Ammo (Trigger Effect)
        let newItems = [...items];
        if (ammo) {
            const ammoIndex = newItems.findIndex(i => i.id === ammo!.id);
            if (ammoIndex >= 0) {
                newItems[ammoIndex] = { ...newItems[ammoIndex], quantity: newItems[ammoIndex].quantity - 1 };
                // If 0, remove? Or keep as empty? Usually keep.
                set({ items: newItems });
            }
        }

        // 4. Roll Attack
        // Standard O.P. Attack: d20 + Bonus (Strength or Agility + Proficiency)
        // Simplification: Roll 1d20 + 0
        const d20 = Math.floor(Math.random() * 20) + 1;
        const rollTotal = d20; // + bonus

        // 5. Check Critical
        const threat = weapon.critical_range || 20;
        const multiplier = weapon.critical_multiplier || 2;
        const isCritical = d20 >= threat;

        // 6. Calculate Damage (Simulated)
        // If critical, roll dice * multiplier
        const damageStr = weapon.damage_dice || "1d6";
        const damage = isCritical ? `${damageStr} (x${multiplier})` : damageStr;

        return {
            success: true,
            message: `Ataque com ${weapon.name}: ${rollTotal} (${isCritical ? 'CRÍTICO!' : 'Acerto?'})`,
            impact: {
                roll: rollTotal,
                isCritical,
                damage,
                ammoConsumed: !!ammo
            }
        };
    },

    rollDice: (diceCode, purpose) => {
        // diceCode ex: "3d20"
        const [countStr, typeStr] = diceCode.split('d');
        const count = parseInt(countStr) || 1;
        const type = parseInt(typeStr) || 20;

        const results = [];
        let total = 0;
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * type) + 1;
            results.push(roll);
            total += roll;
        }

        // Logic for O.P. (Attributes = d20 count, take highest?)
        // If purpose implies attribute test, we might handle "Take Highest".
        // For now, standard sum or return raw.
        // Let's assume standard sum for generic rolls, but O.P. attribute rolls are "Success if > X"?
        // Or O.P. standard: Roll N d20, take HIGHEST result.

        let finalValue = total;
        let isCritical = false;

        if (type === 20 && count > 0) {
            // Check for Advantage/Disadvantage logic from Prompt?
            // "Vantagem: +1d20, pega maior"
            // Default O.P. mechanic is often "Roll Attribute dice, take high".
            finalValue = Math.max(...results);
            isCritical = results.includes(20);
        }

        // Store result in chat (mock)
        console.log(`Rolled ${diceCode}: [${results.join(', ')}] -> ${finalValue}`);

        return {
            success: true,
            message: `Rolou ${diceCode}: ${finalValue}`,
            impact: { results, total: finalValue, isCritical }
        };
    },

    loadCharacter: (char, items) => {
        // Initial calculation to ensure data integrity
        const calculatedChar = recalculateCharacter(char, items);
        set({ character: calculatedChar, items });
    },

    increaseAttribute: (attr) => {
        const { character } = get();
        if (!character) return { success: false, message: "Nenhum personagem selecionado" };

        // 1. Validate
        const validation = validateAttributeIncrease(character, attr);
        if (!validation.success) return validation;

        // 2. Apply
        const newAttributes = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
        const updatedCharRaw = { ...character, attributes: newAttributes };

        // 3. Recalculate Derived Stats
        const finalChar = recalculateCharacter(updatedCharRaw, get().items);

        set({ character: finalChar });
        return { success: true, message: `${attr.toUpperCase()} aumentado!` };
    },

    castRitual: (ritual) => {
        const { character } = get();
        if (!character) return { success: false, message: "Nenhum personagem selecionado" };

        // 1. Validate
        const validation = validateRitualCast(character, ritual);
        if (!validation.success) return validation;

        // 2. Apply Cost
        const newPE = character.stats_current.pe - ritual.cost_pe;

        set({
            character: {
                ...character,
                stats_current: { ...character.stats_current, pe: newPE }
            }
        });

        return { success: true, message: `${ritual.name} conjurado!` };
    },

    addItem: (item) => {
        const { character, items } = get();
        if (!character) return { success: false, message: "Nenhum personagem selecionado" };

        // 1. Calculate current weight
        const currentWeight = items.reduce((sum, i) => sum + (i.slots * i.quantity), 0);

        // 2. Validate
        const validation = validateItemAdd(character, item.slots * item.quantity, currentWeight);
        // Note: validateItemAdd currently permits overload with a warning.
        // If we wanted to block strict overload, we would check validation.success logic deeper.

        const newItems = [...items, item];

        // 3. Recalculate (e.g. defenses might change if armor)
        const finalChar = recalculateCharacter(character, newItems);

        // Check if overloaded flag needs setting
        const newWeight = currentWeight + (item.slots * item.quantity);
        const isOverloaded = newWeight > finalChar.inventory_slots_max;

        set({
            items: newItems,
            character: {
                ...finalChar,
                status_flags: { ...finalChar.status_flags, sobrecarregado: isOverloaded }
            }
        });

        return validation; // Return the success (or warning) message
    },

    toggleGmMode: () => {
        const { character } = get();
        if (character) {
            set({ character: { ...character, is_gm_mode: !character.is_gm_mode } });
        }
    }
}));
