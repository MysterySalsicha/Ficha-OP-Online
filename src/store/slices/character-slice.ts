import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, LevelUpChoices, Character, AttributeName, ClassName, Affinity } from '../../core/types';
import { supabase } from '../../lib/supabase';
import { calculateMaxPV, calculateMaxPE, calculateMaxSAN, calculatePassiveDefense } from '../../engine/rules';
import { getProgressionInfo } from '../../engine/progression';

export interface CharacterSlice {
    createCharacter: (data: { name: string, isSurvivor: boolean, origin: string, class: ClassName, attributes: Record<AttributeName, number> }) => Promise<ActionResult>;
    updateCharacterStatus: (characterId: string, newStatus: Partial<Character['current_status']>) => Promise<ActionResult>;
    toggleCanEvolve: (characterId: string, value: boolean) => Promise<ActionResult>;
    completeLevelUp: (choices: LevelUpChoices) => Promise<ActionResult>;
    increaseAttribute: (attribute: AttributeName, characterId: string) => Promise<ActionResult>;
}

export const createCharacterSlice: StateCreator<GameState, [], [], CharacterSlice> = (set, get) => ({
    createCharacter: async (data) => {
        const { currentMesa, currentUser } = get();
        if (!currentMesa || !currentUser) return { success: false, message: "Erro de sessão" };

        const charForRules = { class: data.class, nex: data.isSurvivor ? 0 : 5, attributes: data.attributes };
        const maxPV = calculateMaxPV(charForRules);
        const maxPE = calculateMaxPE(charForRules);
        const maxSAN = calculateMaxSAN(charForRules);
        const passiveDefense = calculatePassiveDefense(charForRules);

        const newChar: Omit<Character, 'id' | 'created_at'> = {
            user_id: currentUser.id,
            mesa_id: currentMesa.id,
            name: data.name,
            class: data.class,
            nex: charForRules.nex,
            origin: data.origin,
            attributes: data.attributes,
            stats: { max_pv: maxPV, max_pe: maxPE, max_san: maxSAN },
            current_status: { pv: maxPV, pe: maxPE, san: maxSAN, conditions: [], is_dying: false, is_stable: true },
            defenses: { passiva: passiveDefense, esquiva: 0, bloqueio: 0, mental: 0 },
            inventory_meta: { load_limit: 5 + (data.attributes.for || 0), credit_limit: 'I', current_load: 0 },
            movement: 9,
            stress: 0,
            resources: { fome: 0, sede: 0, fadiga: 0 },
            skills: {},
            powers: [],
            rituals: [],
            inventory: [],
            is_npc: false,
            is_approved_evolve: false
        };

        const { data: created, error } = await supabase.from('characters').insert(newChar).select().single();
        if (error) return { success: false, message: `Erro ao criar ficha: ${error.message}` };

        return { success: true, message: "Agente registrado com sucesso!" };
    },
    
    updateCharacterStatus: async (characterId, newStatus) => {
        const { allCharacters } = get();
        const character = allCharacters.find(c => c.id === characterId);
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const updatedStatus = { ...character.current_status, ...newStatus };
        const { error } = await supabase.from('characters').update({ current_status: updatedStatus }).eq('id', characterId);

        if (error) return { success: false, message: "Falha ao atualizar status." };
        return { success: true, message: "Status atualizado." };
    },

    toggleCanEvolve: async (characterId, value) => {
        const { currentMesa, currentUser, allCharacters, sendChatMessage } = get();
        const characterToUpdate = allCharacters.find(c => c.id === characterId);
        if (!characterToUpdate) return { success: false, message: "Personagem não encontrado." };
        
        // GM check logic might need to be enhanced based on roles
        const isGM = currentMesa?.gm_id === currentUser?.id;
        if (!isGM) return { success: false, message: "Apenas o Mestre pode autorizar a evolução." };

        const { error } = await supabase.from('characters').update({ is_approved_evolve: value }).eq('id', characterId);
        if (error) return { success: false, message: "Falha ao atualizar permissão de evolução." };
        
        const message = value ? `${characterToUpdate.name} agora pode evoluir!` : `A permissão de evolução de ${characterToUpdate.name} foi revogada.`;
        await sendChatMessage(message, 'system');
        return { success: true, message };
    },

    completeLevelUp: async (choices) => {
        const { character, sendChatMessage, updateCharacterStatus } = get();
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const progression = getProgressionInfo(choices.newNex, character);
        if (!progression) return { success: false, message: "Informação de progressão não encontrada." };
        
        let updatedCharacter = { ...character };

        // Apply new NEX
        updatedCharacter.nex = choices.newNex;

        // Apply attribute increase
        if (choices.attributeChoice) {
            updatedCharacter.attributes[choices.attributeChoice]++;
        }

        // Apply class change
        if (character.class === 'sobrevivente' && choices.newClass) {
            updatedCharacter.class = choices.newClass;
        }

        // Recalculate stats based on new attributes/class/nex
        const newMaxPV = calculateMaxPV(updatedCharacter);
        const newMaxPE = calculateMaxPE(updatedCharacter);
        const newMaxSAN = calculateMaxSAN(updatedCharacter);
        
        updatedCharacter.stats = { max_pv: newMaxPV, max_pe: newMaxPE, max_san: newMaxSAN };
        updatedCharacter.current_status.pv = newMaxPV; // Full heal on level up
        updatedCharacter.current_status.pe = newMaxPE;
        updatedCharacter.current_status.san = newMaxSAN;

        // TODO: Apply other choices like powers, skills, etc.

        // Sanity cost for transcending
        if(choices.selectedAffinity) {
            const sanityCostReward = progression.rewards.find(r => r.type === 'versatility');
            if (sanityCostReward && sanityCostReward.data.sanityCost) {
                const newSan = updatedCharacter.current_status.san - sanityCostReward.data.sanityCost;
                updatedCharacter.current_status.san = Math.max(0, newSan);
            }
        }
        
        // Finalize: reset evolution flag and update DB
        updatedCharacter.is_approved_evolve = false;
        
        const { error } = await supabase.from('characters').update(updatedCharacter).eq('id', character.id);
        if (error) return { success: false, message: "Falha ao salvar evolução no banco de dados." };

        await sendChatMessage(`${character.name} evoluiu para NEX ${choices.newNex}%!`, 'system');
        return { success: true, message: "Evolução completa!" };
    },

    increaseAttribute: async (attribute, characterId) => {
        // This is now part of completeLevelUp, but can be a separate GM tool
        const { allCharacters } = get();
        const character = allCharacters.find(c => c.id === characterId);
        if (!character) return { success: false, message: "Personagem não encontrado."};

        const newAttributes = { ...character.attributes, [attribute]: character.attributes[attribute] + 1 };
        
        const { error } = await supabase.from('characters').update({ attributes: newAttributes }).eq('id', characterId);
        if (error) return { success: false, message: "Falha ao aumentar atributo."};

        return { success: true, message: `Atributo ${attribute.toUpperCase()} de ${character.name} aumentado.`};
    }
});
