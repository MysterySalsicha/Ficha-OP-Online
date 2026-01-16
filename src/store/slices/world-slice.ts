import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, Scene, Token, Character } from '../../core/types';
import { supabase } from '../../lib/supabase';
import monstersData from '../../data/rules/monsters.json';

export interface WorldSlice {
    activeScene: Scene | null;
    tokens: Token[];
    createScene: (name: string, imageUrl: string) => Promise<ActionResult>;
    updateScene: (data: Partial<Omit<Scene, 'id' | 'mesa_id'>>) => Promise<ActionResult>;
    createPlayerToken: (characterId: string) => Promise<ActionResult>;
    moveToken: (tokenId: string, x: number, y: number) => Promise<void>;
    spawnMonster: (monsterId: string, position: { x: number, y: number }) => Promise<ActionResult>;
}

export const createWorldSlice: StateCreator<GameState, [], [], WorldSlice> = (set, get) => ({
    activeScene: null,
    tokens: [],

    createScene: async (name, imageUrl) => {
        const { currentMesa } = get();
        if (!currentMesa) return { success: false, message: "Mesa não encontrada." };
        
        // Deactivate old scenes first
        await supabase.from('scenes').update({ is_active: false }).eq('mesa_id', currentMesa.id);

        const { data, error } = await supabase.from('scenes').insert({ 
            mesa_id: currentMesa.id, 
            name, 
            image_url: imageUrl, 
            is_active: true, 
            grid_size: 50,
            scale_meters: 1.5,
        }).select().single();

        if (error) return { success: false, message: "Falha ao criar a cena." };
        
        return { success: true, message: "Cena criada com sucesso." };
    },

    updateScene: async (data) => {
        const { activeScene } = get();
        if (!activeScene) return { success: false, message: 'Nenhuma cena ativa para atualizar.' };

        const { error } = await supabase.from('scenes').update(data).eq('id', activeScene.id);
        if (error) return { success: false, message: 'Não foi possível atualizar as configurações do mapa.' };
        
        return { success: true, message: 'Configurações do mapa atualizadas.' };
    },

    createPlayerToken: async (characterId) => {
        const { activeScene, tokens } = get();
        if (!activeScene) return { success: false, message: "Nenhuma cena ativa." };
        if (tokens.some(t => t.character_id === characterId)) return { success: false, message: "Este personagem já possui um token no mapa." };

        const { error } = await supabase.from('tokens').insert({
            scene_id: activeScene.id,
            character_id: characterId,
            x: 100,
            y: 100,
            size: 1,
            is_visible: true
        });

        if (error) return { success: false, message: "Não foi possível adicionar o token ao mapa." };
        return { success: true, message: "Token adicionado ao mapa!" };
    },

    moveToken: async (tokenId, x, y) => {
        // Optimistic update
        set(state => ({
            tokens: state.tokens.map(t => t.id === tokenId ? { ...t, x, y } : t)
        }));
        await supabase.from('tokens').update({ x, y }).eq('id', tokenId);
    },

    spawnMonster: async (monsterId, position) => {
        const { currentMesa, activeScene, createCharacter, sendChatMessage } = get();
        if (!currentMesa || !activeScene) return { success: false, message: "Nenhuma cena ativa." };

        const monsterTemplate = (monstersData as any[]).find(m => m.id === monsterId);
        if(!monsterTemplate) return { success: false, message: "Monstro não encontrado." };

        // Create a character for the monster
        const newMonsterChar: Omit<Character, 'id' | 'created_at'> = {
            mesa_id: currentMesa.id,
            name: `${monsterTemplate.name} #${Math.floor(Math.random() * 100)}`,
            class: 'nenhuma', // Monsters don't have classes in the same way
            nex: monsterTemplate.vd, // Use VD as NEX
            origin: 'monstro',
            attributes: monsterTemplate.attributes,
            stats: { max_pv: monsterTemplate.stats.pv, max_pe: 0, max_san: 0 },
            current_status: { pv: monsterTemplate.stats.pv, pe: 0, san: 0, conditions: [], is_dying: false, is_stable: true },
            defenses: { passiva: monsterTemplate.stats.defesa, esquiva: 0, bloqueio: 0, mental: 0 },
            inventory_meta: { load_limit: 0, credit_limit: 'Nenhum', current_load: 0 },
            movement: monsterTemplate.stats.deslocamento,
            stress: 0,
            resources: { fome: 0, sede: 0, fadiga: 0 },
            skills: {},
            powers: [],
            rituals: [],
            inventory: [],
            is_npc: true,
            is_approved_evolve: false,
            user_id: null,
        };

        const { data: createdChar, error: charError } = await supabase.from('characters').insert(newMonsterChar).select().single();
        if (charError || !createdChar) return { success: false, message: `Falha ao criar o personagem do monstro: ${charError?.message}`};

        // Create a token for the monster
        const { error: tokenError } = await supabase.from('tokens').insert({
            scene_id: activeScene.id,
            character_id: createdChar.id,
            x: position.x,
            y: position.y,
            size: monsterTemplate.stats.tamanho || 1,
            is_visible: true,
        });

        if (tokenError) return { success: false, message: "Falha ao criar o token do monstro." };

        await sendChatMessage(`Uma criatura medonha surgiu: ${newMonsterChar.name}`, 'system');
        return { success: true, message: "Monstro invocado!" };
    },
});
