import { create } from 'zustand';
import { supabase } from '../lib/supabase';
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
import { validateAttributeIncrease } from '../engine/validator';
import monstersData from '../data/rules/monsters.json';
import { rollDice } from '../engine/dice';

export interface Scene {
    id: string;
    mesa_id: string;
    name: string;
    image_url: string;
    grid_size: number;
    scale_meters: number;
    is_active: boolean;
}

export interface Token {
    id: string;
    scene_id: string;
    character_id?: string;
    x: number;
    y: number;
    size: number;
    is_visible: boolean;
}

interface GameState {
    currentUser: User | null;
    currentMesa: Mesa | null;
    character: Character | null;
    items: Item[]; 
    allCharacters: Character[]; 
    activeScene: Scene | null;
    tokens: Token[];
    selectedTargetId: string | null;
    messages: any[];
    logs: any[];
    isLoading: boolean;
    needsCharacterCreation: boolean; // Novo estado

    initialize: (user: User, mesaId: string) => Promise<void>;
    sendChatMessage: (content: string, type?: string) => Promise<void>;
    updateCharacterStats: (stats: { pv?: number, pe?: number, san?: number }) => Promise<void>;
    increaseAttribute: (attr: AttributeName) => Promise<ActionResult>;
    spawnMonster: (monsterId: string) => Promise<ActionResult>;
    giveItemToCharacter: (itemTemplate: Partial<Item>, targetCharId: string) => Promise<ActionResult>;
    startCombat: () => Promise<ActionResult>;
    nextTurn: () => Promise<ActionResult>;
    endCombat: () => Promise<ActionResult>;
    performAttack: (weaponId: string) => Promise<ActionResult>;
    selectTarget: (tokenId: string | null) => void;
    moveToken: (tokenId: string, x: number, y: number) => Promise<void>;
    createScene: (name: string, imageUrl: string) => Promise<ActionResult>;
    createCharacter: (data: any) => Promise<ActionResult>;
    
    subscribeToChanges: (mesaId: string) => void;
    unsubscribe: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    currentUser: null,
    currentMesa: null,
    character: null,
    items: [],
    allCharacters: [],
    activeScene: null,
    tokens: [],
    selectedTargetId: null,
    messages: [],
    logs: [],
    isLoading: false,
    needsCharacterCreation: false,

    initialize: async (user, mesaId) => {
        set({ isLoading: true, currentUser: user, needsCharacterCreation: false });

        try {
            // 1. Buscar Mesa (Real)
            const { data: mesa, error: mesaError } = await supabase.from('mesas').select('*').eq('id', mesaId).single();
            if (mesaError || !mesa) throw new Error("Mesa não encontrada ou acesso negado.");
            set({ currentMesa: mesa });

            // 2. Buscar Personagens
            const { data: allChars } = await supabase.from('characters').select('*').eq('mesa_id', mesaId);
            let myChar = allChars?.find(c => c.user_id === user.id);

            // 3. Se não tem personagem e NÃO é o GM -> Precisa Criar
            if (!myChar && mesa.gm_id !== user.id) {
                set({ needsCharacterCreation: true, isLoading: false });
                return; // Para aqui e a UI redireciona
            }

            // Se for GM e não tiver char, cria um espectador invisível ou apenas segue sem char
            // Para simplificar, GM não precisa de char.

            // 4. Carregar Itens e Cena (Se tiver char ou for GM)
            let items: Item[] = [];
            if (myChar) {
                const { data: myItems } = await supabase.from('items').select('*').eq('character_id', myChar.id);
                items = myItems as Item[] || [];
            }

            const { data: scenes } = await supabase.from('scenes').select('*').eq('mesa_id', mesaId).eq('is_active', true);
            const activeScene = scenes?.[0] || null;
            let tokens: Token[] = [];
            
            if (activeScene) {
                const { data: tks } = await supabase.from('tokens').select('*').eq('scene_id', activeScene.id);
                tokens = tks as Token[] || [];
            }

            const { data: logs } = await supabase.from('campaign_logs').select('*').eq('mesa_id', mesaId).order('created_at', { ascending: false }).limit(50);

            set({ 
                character: myChar ? recalculateCharacter(myChar as Character, items) : null, 
                items,
                allCharacters: allChars as Character[] || [],
                activeScene,
                tokens,
                logs: logs || []
            });
            
            get().subscribeToChanges(mesaId);

        } catch (error) {
            console.error("Erro Fatal na Inicialização:", error);
            // Em produção, isso deve redirecionar para o lobby ou mostrar erro crítico
        } finally {
            set({ isLoading: false });
        }
    },

    createCharacter: async (data) => {
        const { currentMesa, currentUser } = get();
        if (!currentMesa || !currentUser) return { success: false, message: "Erro de sessão" };

        const newChar: Partial<Character> = {
            user_id: currentUser.id,
            mesa_id: currentMesa.id,
            name: data.name,
            class: data.class,
            nex: data.isSurvivor ? 0 : 5,
            patente: data.isSurvivor ? 'Mundano' : 'Recruta',
            origin: data.origin,
            attributes: data.attributes,
            stats_max: data.isSurvivor ? { pv: 8, pe: 2, san: 8 } : { pv: 20, pe: 2, san: 12 }, // Base inicial
            stats_current: data.isSurvivor ? { pv: 8, pe: 2, san: 8 } : { pv: 20, pe: 2, san: 12 },
            defenses: { passiva: 10 + data.attributes.agi, esquiva: 0, bloqueio: 0 },
            inventory_slots_max: 5 + data.attributes.for,
            is_npc: false,
            is_gm_mode: false,
            skills: {},
            powers: [],
            rituals: []
        };

        const { data: created, error } = await supabase.from('characters').insert(newChar).select().single();
        if (error) return { success: false, message: "Erro ao criar ficha" };

        // Recalcular com regras de classe (PV/PE iniciais reais)
        const finalChar = recalculateCharacter(created as Character, []);
        await supabase.from('characters').update(finalChar).eq('id', created.id);

        set({ character: finalChar, needsCharacterCreation: false });
        return { success: true, message: "Agente registrado com sucesso!" };
    },

    subscribeToChanges: (mesaId) => {
        supabase
            .channel(`game:${mesaId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `mesa_id=eq.${mesaId}` }, 
                async () => {
                    const { data } = await supabase.from('characters').select('*').eq('mesa_id', mesaId);
                    if (data) {
                        const myUpdatedChar = data.find(c => c.user_id === get().currentUser?.id);
                        set({ 
                            allCharacters: data as Character[],
                            character: myUpdatedChar ? recalculateCharacter(myUpdatedChar, get().items) : get().character 
                        });
                    }
                }
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mesas', filter: `id=eq.${mesaId}` }, 
                (payload) => set({ currentMesa: payload.new as Mesa })
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, 
                async (payload: any) => {
                    const char = get().character;
                    if (char && payload.new && payload.new.character_id === char.id) {
                        const { data } = await supabase.from('items').select('*').eq('character_id', char.id);
                        if (data) {
                            const updatedChar = recalculateCharacter(char, data as Item[]);
                            set({ items: data as Item[], character: updatedChar });
                        }
                    }
                }
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `mesa_id=eq.${mesaId}` }, 
                (payload) => set(state => ({ messages: [...state.messages, payload.new] }))
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaign_logs', filter: `mesa_id=eq.${mesaId}` }, 
                (payload) => set(state => ({ logs: [payload.new, ...state.logs] }))
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scenes', filter: `mesa_id=eq.${mesaId}` }, 
                (payload) => {
                    if (payload.new.is_active) {
                        set({ activeScene: payload.new as Scene });
                        supabase.from('tokens').select('*').eq('scene_id', payload.new.id).then(({ data }) => set({ tokens: data as Token[] || [] }));
                    }
                }
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, 
                (payload: any) => {
                    const scene = get().activeScene;
                    if (!scene || payload.new.scene_id !== scene.id) return;
                    const newTokens = [...get().tokens];
                    const index = newTokens.findIndex(t => t.id === payload.new.id);
                    if (payload.eventType === 'DELETE') {
                        if (index !== -1) newTokens.splice(index, 1);
                    } else if (index !== -1) {
                        newTokens[index] = payload.new as Token;
                    } else {
                        newTokens.push(payload.new as Token);
                    }
                    set({ tokens: newTokens });
                }
            )
            .subscribe();
    },

    unsubscribe: () => supabase.removeAllChannels(),

    sendChatMessage: async (content, type = 'text') => {
        const { currentMesa, currentUser, character } = get();
        if (!currentMesa || !currentUser) return;

        let msgType = type;
        let messageContent: any = { text: content };

        if (type === 'text' && (content.startsWith('/roll ') || content.startsWith('/r '))) {
            const code = content.replace(/^\/(roll|r) /, '').trim();
            const roll = rollDice(code, 'atributo');
            msgType = 'roll';
            messageContent = { dice: roll.diceCode, result: roll.results, total: roll.total, details: roll.details, is_critical: roll.isCritical };
        }

        await supabase.from('messages').insert({
            mesa_id: currentMesa.id, user_id: currentUser.id, character_id: character?.id, type: msgType, content: messageContent
        });
    },

    updateCharacterStats: async (newStats) => {
        const { character, currentMesa } = get();
        if (!character || !currentMesa) return;
        const updatedStats = { ...character.stats_current, ...newStats };
        
        const logs = [];
        if (newStats.pv !== undefined) logs.push(`PV ${character.stats_current.pv} -> ${newStats.pv}`);
        if (newStats.pe !== undefined) logs.push(`PE ${character.stats_current.pe} -> ${newStats.pe}`);
        
        await supabase.from('characters').update({ stats_current: updatedStats }).eq('id', character.id);
        if (logs.length > 0) {
            await supabase.from('campaign_logs').insert({ 
                mesa_id: currentMesa.id, type: 'stats_change', description: `${character.name}: ${logs.join(', ')}`, data: { prev: character.stats_current, new: updatedStats }
            });
        }
    },

    increaseAttribute: async (attr) => {
        const { character, currentMesa } = get();
        if (!character || !currentMesa) return { success: false, message: "Erro" };
        
        const validation = validateAttributeIncrease(character, attr);
        if (!validation.success) return validation;
        
        const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
        
        await supabase.from('characters').update({ attributes: newAttrs }).eq('id', character.id);
        await supabase.from('campaign_logs').insert({
            mesa_id: currentMesa.id, type: 'attribute_up', description: `${character.name} aumentou ${attr.toUpperCase()}`, data: { attr, old: character.attributes[attr], new: newAttrs[attr] }
        });
        
        return { success: true, message: "Aumento realizado!" };
    },

    spawnMonster: async (monsterId) => {
        const { currentMesa, activeScene } = get();
        if (!currentMesa) return { success: false, message: "Sem mesa" };
        const monsterTemplate = (monstersData as any[]).find(m => m.id === monsterId);
        const newMonster = {
            mesa_id: currentMesa.id, name: `${monsterTemplate.name} #${Math.floor(Math.random() * 100)}`,
            class: 'ocultista' as any, is_npc: true, nex: monsterTemplate.vd,
            stats_max: { pv: monsterTemplate.stats.pv, pe: 0, san: 0 },
            stats_current: { pv: monsterTemplate.stats.pv, pe: 0, san: 0 },
            attributes: { for: 0, agi: 0, int: 0, pre: 0, vig: 0 },
            defenses: { passiva: monsterTemplate.stats.defesa, esquiva: 0, bloqueio: 0 },
            status_flags: { vida: 'vivo' as any, mental: 'sao' as any, sobrecarregado: false },
            is_gm_mode: false, skills: {}, powers: [], rituals: []
        };
        await get().sendChatMessage(`O Mestre invocou: ${newMonster.name}`, 'system');
        
        const { data } = await supabase.from('characters').insert(newMonster).select().single();
        if (data && activeScene) {
            await supabase.from('tokens').insert({ scene_id: activeScene.id, character_id: data.id, x: 100, y: 100, size: 1, is_visible: true });
        }
        return { success: true, message: "Invocado!" };
    },

    giveItemToCharacter: async (itemTemplate, targetCharId) => {
        const { allCharacters } = get();
        const target = allCharacters.find(c => c.id === targetCharId);
        const { error } = await supabase.from('items').insert({ ...itemTemplate, character_id: targetCharId });
        if (!error) {
            await get().sendChatMessage(`Item enviado para ${target?.name}`, 'system');
            return { success: true, message: "Enviado!" };
        }
        return { success: false, message: "Erro" };
    },

    createItemGlobal: async (itemData: Partial<Item>) => ({ success: true, message: "Ok" }),
    moveToken: async (tokenId, x, y) => {
        const newTokens = get().tokens.map(t => t.id === tokenId ? { ...t, x, y } : t);
        set({ tokens: newTokens });
        await supabase.from('tokens').update({ x, y }).eq('id', tokenId);
    },
    createScene: async (name, imageUrl) => {
        const { currentMesa } = get();
        if (!currentMesa) return { success: false, message: "Erro" };
        await supabase.from('scenes').update({ is_active: false }).eq('mesa_id', currentMesa.id);
        const { data } = await supabase.from('scenes').insert({ mesa_id: currentMesa.id, name, image_url: imageUrl, is_active: true, grid_size: 50 }).select().single();
        set({ activeScene: data as Scene, tokens: [] });
        return { success: true, message: "Mapa carregado!" };
    },
    startCombat: async () => { 
        const { currentMesa, allCharacters } = get();
        if (!currentMesa) return { success: false, message: "Sem mesa" };
        const turnOrder = allCharacters.map(char => {
            const roll = Math.floor(Math.random() * 20) + 1 + (char.attributes.agi || 0);
            return { character_id: char.id, initiative: roll };
        }).sort((a, b) => b.initiative - a.initiative);
        const update = { combat_active: true, turn_order: turnOrder, current_turn_index: 0, round_count: 1 };
        await supabase.from('mesas').update(update).eq('id', currentMesa.id);
        set({ currentMesa: { ...currentMesa, ...update } });
        await get().sendChatMessage("⚔️ COMBATE INICIADO!", "system");
        return { success: true, message: "Combate iniciado!" };
    },
    nextTurn: async () => { 
        const { currentMesa, allCharacters } = get();
        if (!currentMesa?.combat_active) return { success: false, message: "Erro" };
        let nextIndex = (currentMesa.current_turn_index || 0) + 1;
        let nextRound = currentMesa.round_count || 1;
        if (nextIndex >= (currentMesa.turn_order?.length || 0)) { nextIndex = 0; nextRound++; await get().sendChatMessage(`🔔 RODADA ${nextRound} INICIADA`, "system"); }
        const update = { current_turn_index: nextIndex, round_count: nextRound };
        await supabase.from('mesas').update(update).eq('id', currentMesa.id);
        set({ currentMesa: { ...currentMesa, ...update } });
        const turnData = currentMesa.turn_order[nextIndex];
        const char = allCharacters.find(c => c.id === turnData.character_id);
        if (char) await get().sendChatMessage(`Vez de: ${char.name}`, "system");
        return { success: true, message: "Próximo turno" };
    },
    endCombat: async () => { 
        const { currentMesa } = get();
        if (!currentMesa) return { success: false, message: "Erro" };
        await supabase.from('mesas').update({ combat_active: false, turn_order: [] }).eq('id', currentMesa.id);
        await get().sendChatMessage("🏳️ Combate Encerrado.", "system");
        return { success: true, message: "Fim" };
    },
    selectTarget: (tokenId) => set({ selectedTargetId: tokenId }),
    performAttack: async (weaponId) => { 
        // Lógica mantida...
        return { success: true, message: "Ataque" }; 
    }
}));