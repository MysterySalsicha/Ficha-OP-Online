import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, Scene, Token, Character, TokenType } from '../../core/types'; // Added TokenType
import { supabase } from '../../lib/supabase';
import monstersData from '../../data/rules/monsters.json';

export interface WorldSlice {
    activeScene: Scene | null;
    tokens: Token[];
    createScene: (name: string, imageUrl: string) => Promise<ActionResult>;
    updateScene: (mesaId: string, sceneId: string, updates: Partial<Scene>) => Promise<ActionResult>;
    deleteScene: (mesaId: string, sceneId: string) => Promise<ActionResult>; // Added
    createToken: (sceneId: string, characterId: string | null, position: { x: number, y: number }, type: TokenType, size: number, imageUrl: string) => Promise<ActionResult>; // Added
    updateToken: (tokenId: string, updates: Partial<Token>) => Promise<ActionResult>; // Added
    deleteToken: (tokenId: string) => Promise<ActionResult>; // Added
    createPlayerToken: (characterId: string) => Promise<ActionResult>;
    moveToken: (tokenId: string, x: number, y: number) => Promise<void>;
    spawnMonster: (monsterId: string, position: { x: number, y: number }) => Promise<ActionResult>;
    shareImage: (imageUrl: string, userIds: string[]) => Promise<void>;
}

export const createWorldSlice: StateCreator<GameState, [], [], WorldSlice> = (set, get) => ({
    activeScene: null,
    tokens: [],

    shareImage: async (imageUrl, userIds) => {
        const { currentMesa, currentUser } = get();
        if (!currentMesa || !currentUser) return;

        const messagesToInsert = userIds.map(userId => ({
            mesa_id: currentMesa.id,
            user_id: currentUser.id,
            type: 'image',
            content: { text: `O Mestre compartilhou uma pista visual.`, imageUrl },
            target_user_id: userId
        }));

        await supabase.from('messages').insert(messagesToInsert);
    },

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
            tokens: [] // Initialize tokens as an empty array
        }).select().single();

        if (error) return { success: false, message: "Falha ao criar a cena." };
        
        return { success: true, message: "Cena criada com sucesso." };
    },

    updateScene: async (mesaId, sceneId, updates) => {
        const { error } = await supabase.from('scenes')
            .update(updates)
            .eq('mesa_id', mesaId)
            .eq('id', sceneId);
            
        if (error) return { success: false, message: 'Não foi possível atualizar as configurações da cena.' };
        
        return { success: true, message: 'Configurações da cena atualizadas.' };
    },

    deleteScene: async (mesaId, sceneId) => { // Added
        const { error } = await supabase.from('scenes')
            .delete()
            .eq('mesa_id', mesaId)
            .eq('id', sceneId);

        if (error) return { success: false, message: 'Não foi possível deletar a cena.' };
        return { success: true, message: 'Cena deletada com sucesso.' };
    },

    createToken: async (sceneId, characterId, position, type, size, imageUrl) => { // Added
        const { error } = await supabase.from('tokens').insert({
            scene_id: sceneId,
            character_id: characterId,
            x: position.x,
            y: position.y,
            type: type,
            size: size,
            image_url: imageUrl,
            is_visible: true
        });

        if (error) return { success: false, message: "Não foi possível adicionar o token." };
        return { success: true, message: "Token adicionado!" };
    },

    updateToken: async (tokenId, updates) => { // Added
        const { error } = await supabase.from('tokens')
            .update(updates)
            .eq('id', tokenId);

        if (error) return { success: false, message: "Não foi possível atualizar o token." };
        return { success: true, message: "Token atualizado!" };
    },

    deleteToken: async (tokenId) => { // Added
        const { error } = await supabase.from('tokens')
            .delete()
            .eq('id', tokenId);

        if (error) return { success: false, message: "Não foi possível deletar o token." };
        return { success: true, message: "Token deletado!" };
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
        const { currentMesa, activeScene, sendChatMessage } = get();
        if (!currentMesa || !activeScene) return { success: false, message: "Nenhuma cena ativa." };

        const monsterTemplate = (monstersData as any[]).find(m => m.id === monsterId);
        if(!monsterTemplate) return { success: false, message: "Monstro não encontrado." };

        const newMonsterChar: Omit<Character, 'id' | 'created_at'> = {
            mesa_id: currentMesa.id,
            name: `${monsterTemplate.name} #${Math.floor(Math.random() * 100)}`,
            class: 'mundano',
            nex: monsterTemplate.vd,
            origin: 'monstro',
            attributes: monsterTemplate.attributes,
            stats_max: { pv: monsterTemplate.stats.pv, pe: 0, san: 0 },
            stats_current: { 
                pv: monsterTemplate.stats.pv, 
                pe: 0, 
                san: 0, 
                max_pv: monsterTemplate.stats.pv, // Added
                max_pe: 0, // Added
                max_san: 0, // Added
                conditions: [], 
                is_dying: false, 
                is_unconscious: false, // Added
                is_stable: true, 
                is_incapacitated: false // Added
            },
            defenses: { passiva: monsterTemplate.stats.defesa, esquiva: 0, bloqueio: 0, mental: 0 },
            inventory_meta: { load_limit: 0, credit_limit: 'Nenhum', current_load: 0 },
            movement: monsterTemplate.stats.deslocamento,
            stress: 0,
            skills: {},
            powers: [],
            rituals: [],
            inventory: [],
            is_npc: true,
            is_approved_evolve: false,
            user_id: null,
            patente: 'Criatura',
            survivor_mode: false,
            is_gm_mode: false,
            image_url: null, // Added
            type: 'npc', // Added
        };

        const { data: createdChar, error: charError } = await supabase.from('characters').insert(newMonsterChar).select().single();
        if (charError || !createdChar) return { success: false, message: `Falha ao criar o personagem do monstro: ${charError?.message}`};

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
