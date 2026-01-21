import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, LevelUpChoices, Character, AttributeName, ClassName, Affinity } from '../../core/types';
import { supabase } from '../../lib/supabase';
import { calculateMaxPV, calculateMaxPE, calculateMaxSAN, calculatePassiveDefense } from '../../engine/rules';
import { getProgressionInfo } from '../../engine/progression';

export interface CharacterSlice {
    createCharacter: (data: { name: string, isSurvivor: boolean, origin: string, class: ClassName, attributes: Record<AttributeName, number> }) => Promise<ActionResult>;
    updateCharacterStatus: (characterId: string, newStatus: Partial<Character['stats_current']>) => Promise<ActionResult>;
    updateCharacterFull: (data: Partial<Character>) => Promise<ActionResult>;
    toggleCanEvolve: (characterId: string, value: boolean) => Promise<ActionResult>;
    completeLevelUp: (choices: LevelUpChoices) => Promise<ActionResult>;
    increaseAttribute: (attribute: AttributeName, characterId: string) => Promise<ActionResult>;
    fetchUserCharacters: () => Promise<void>;
    importCharacter: (characterId: string, targetMesaId: string) => Promise<ActionResult>;
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
            stats_max: { pv: maxPV, pe: maxPE, san: maxSAN },
            stats_current: { 
                pv: maxPV, 
                pe: maxPE, 
                san: maxSAN, 
                max_pv: maxPV, // Added
                max_pe: maxPE, // Added
                max_san: maxSAN, // Added
                conditions: [], 
                is_dying: false, 
                is_unconscious: false, // Added
                is_stable: true, 
                is_incapacitated: false // Added
            },
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
            is_approved_evolve: false,
            survivor_mode: false,
            patente: 'Recruta',
            is_gm_mode: false,
            image_url: null, // Added
            type: 'player', // Added
        };

        const { data: created, error } = await supabase.from('characters').insert(newChar).select().single();
        if (error) return { success: false, message: `Erro ao criar ficha: ${error.message}` };

        return { success: true, message: "Agente registrado com sucesso!" };
    },
    
    updateCharacterStatus: async (characterId, newStatus) => {
        const { allCharacters } = get();
        const character = allCharacters.find(c => c.id === characterId);
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const updatedStatus = { ...character.stats_current, ...newStatus };
        const { error } = await supabase.from('characters').update({ stats_current: updatedStatus }).eq('id', characterId);

        if (error) return { success: false, message: "Falha ao atualizar status." };
        return { success: true, message: "Status atualizado." };
    },

    updateCharacterFull: async (data) => {
        const { character } = get();
        if (!character) return { success: false, message: "Personagem não encontrado" };

        const { error } = await supabase.from('characters').update(data).eq('id', character.id);
        if (error) {
            console.error("Error updating character:", error);
            return { success: false, message: "Falha ao atualizar a ficha." };
        }
        return { success: true, message: "Ficha atualizada!" };
    },

    toggleCanEvolve: async (characterId, value) => {
        const { currentMesa, currentUser, allCharacters, sendChatMessage } = get();
        const characterToUpdate = allCharacters.find(c => c.id === characterId);
        if (!characterToUpdate) return { success: false, message: "Personagem não encontrado." };
        
        const isGM = currentMesa?.mestre_id === currentUser?.id;
        if (!isGM) return { success: false, message: "Apenas o Mestre pode autorizar a evolução." };

        const { error } = await supabase.from('characters').update({ is_approved_evolve: value }).eq('id', characterId);
        if (error) return { success: false, message: "Falha ao atualizar permissão de evolução." };
        
        const message = value ? `${characterToUpdate.name} agora pode evoluir!` : `A permissão de evolução de ${characterToUpdate.name} foi revogada.`;
        await sendChatMessage('system', message);
        return { success: true, message };
    },

    completeLevelUp: async (choices) => {
        const { character, sendChatMessage, updateCharacterStatus } = get();
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const progression = getProgressionInfo(choices.newNex, character);
        if (!progression) return { success: false, message: "Informação de progressão não encontrada." };
        
        let updatedCharacter = { ...character };

        updatedCharacter.nex = choices.newNex;

        if (choices.attributeChoice) {
            updatedCharacter.attributes[choices.attributeChoice]++;
        }

        if (character.class === 'sobrevivente' && choices.newClass) {
            updatedCharacter.class = choices.newClass;
        }

        const newMaxPV = calculateMaxPV(updatedCharacter);
        const newMaxPE = calculateMaxPE(updatedCharacter);
        const newMaxSAN = calculateMaxSAN(updatedCharacter);
        
        updatedCharacter.stats_max = { pv: newMaxPV, pe: newMaxPE, san: newMaxSAN };
        updatedCharacter.stats_current.pv = newMaxPV;
        updatedCharacter.stats_current.pe = newMaxPE;
        updatedCharacter.stats_current.san = newMaxSAN;
        updatedCharacter.stats_current.max_pv = newMaxPV; // Added
        updatedCharacter.stats_current.max_pe = newMaxPE; // Added
        updatedCharacter.stats_current.max_san = newMaxSAN; // Added


        if(choices.selectedAffinity) {
            const sanityCostReward = progression.rewards.find(r => r.type === 'versatility');
            if (sanityCostReward && (sanityCostReward.data as any).sanityCost) {
                const newSan = updatedCharacter.stats_current.san - (sanityCostReward.data as any).sanityCost;
                updatedCharacter.stats_current.san = Math.max(0, newSan);
            }
        }
        
        updatedCharacter.is_approved_evolve = false;
        
        const { error } = await supabase.from('characters').update(updatedCharacter).eq('id', character.id);
        if (error) return { success: false, message: "Falha ao salvar evolução no banco de dados." };

        await sendChatMessage('system', `${character.name} evoluiu para NEX ${choices.newNex}%!`);
        return { success: true, message: "Evolução completa!" };
    },

    increaseAttribute: async (attribute, characterId) => {
        const { allCharacters } = get();
        const character = allCharacters.find(c => c.id === characterId);
        if (!character) return { success: false, message: "Personagem não encontrado."};

        const newAttributes = { ...character.attributes, [attribute]: character.attributes[attribute] + 1 };
        
        const { error } = await supabase.from('characters').update({ attributes: newAttributes }).eq('id', characterId);
        if (error) return { success: false, message: "Falha ao aumentar atributo."};

        return { success: true, message: `Atributo ${attribute.toUpperCase()} de ${character.name} aumentado.`};
    },

    fetchUserCharacters: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', currentUser.id);

        if (error) {
            console.error("Error fetching user characters:", error);
            return;
        }
        
        set({ availableCharacters: data || [] });
    },

    importCharacter: async (characterId, targetMesaId) => {
        const { availableCharacters } = get();
        const characterToImport = availableCharacters.find(c => c.id === characterId);

        if (!characterToImport) {
            return { success: false, message: "Personagem para importação não encontrado." };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, ...newCharData } = characterToImport;

        const charToInsert = {
            ...newCharData,
            mesa_id: targetMesaId
        };
        
        const { error } = await supabase.from('characters').insert(charToInsert);

        if (error) {
            console.error("Error importing character:", error);
            return { success: false, message: "Falha ao importar o personagem." };
        }

        return { success: true, message: "Personagem importado com sucesso!" };
    },
});