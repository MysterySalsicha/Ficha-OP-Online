"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameStore = void 0;
const zustand_1 = require("zustand");
const supabase_1 = require("../lib/supabase");
const calculator_1 = require("../engine/calculator");
const validator_1 = require("../engine/validator");
const monsters_json_1 = __importDefault(require("../data/rules/monsters.json"));
const dice_1 = require("../engine/dice");
exports.useGameStore = (0, zustand_1.create)((set, get) => ({
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
    approvalStatus: 'none',
    playerRole: 'none',
    initialize: async (user, mesaId) => {
        set({ isLoading: true, currentUser: user, needsCharacterCreation: false, approvalStatus: 'none', playerRole: 'none' });
        try {
            // 0. Verificar Status de Aprovação
            const { data: playerStatus, error: statusError } = await supabase_1.supabase
                .from('mesa_players')
                .select('status, role')
                .eq('mesa_id', mesaId)
                .eq('user_id', user.id)
                .maybeSingle();
            if (!playerStatus) {
                // Se não tem status, cria solicitação pendente
                await supabase_1.supabase.from('mesa_players').insert({
                    mesa_id: mesaId, user_id: user.id, status: 'pending'
                });
                set({ approvalStatus: 'pending', isLoading: false });
                return;
            }
            if (playerStatus.status === 'pending') {
                set({ approvalStatus: 'pending', isLoading: false });
                return;
            }
            if (playerStatus.status === 'banned' || playerStatus.status === 'rejected') {
                set({ approvalStatus: 'rejected', isLoading: false });
                return;
            }
            // Se aprovado, continua o fluxo normal...
            set({ approvalStatus: 'approved', playerRole: playerStatus.role });
            // 1. Buscar Mesa (Real)
            const { data: mesa, error: mesaError } = await supabase_1.supabase.from('mesas').select('*').eq('id', mesaId).single();
            if (mesaError || !mesa)
                throw new Error("Mesa não encontrada ou acesso negado.");
            set({ currentMesa: mesa });
            // 2. Buscar Personagens
            const { data: allChars } = await supabase_1.supabase.from('characters').select('*').eq('mesa_id', mesaId);
            let myChar = allChars === null || allChars === void 0 ? void 0 : allChars.find(c => c.user_id === user.id);
            // 3. Se não tem personagem e NÃO é o GM -> Precisa Criar
            // Agora checamos se o role é 'gm' na tabela mesa_players, além do dono da mesa
            const isGM = mesa.gm_id === user.id || playerStatus.role === 'gm';
            if (!myChar && !isGM) {
                set({ needsCharacterCreation: true, isLoading: false });
                return; // Para aqui e a UI redireciona
            }
            // Se for GM e não tiver char, cria um espectador invisível ou apenas segue sem char
            // Para simplificar, GM não precisa de char.
            // 4. Carregar Itens e Cena (Se tiver char ou for GM)
            let items = [];
            if (myChar) {
                const { data: myItems } = await supabase_1.supabase.from('items').select('*').eq('character_id', myChar.id);
                items = myItems || [];
            }
            const { data: scenes } = await supabase_1.supabase.from('scenes').select('*').eq('mesa_id', mesaId).eq('is_active', true);
            const activeScene = (scenes === null || scenes === void 0 ? void 0 : scenes[0]) || null;
            let tokens = [];
            if (activeScene) {
                const { data: tks } = await supabase_1.supabase.from('tokens').select('*').eq('scene_id', activeScene.id);
                tokens = tks || [];
            }
            const { data: logs } = await supabase_1.supabase.from('campaign_logs').select('*').eq('mesa_id', mesaId).order('created_at', { ascending: false }).limit(50);
            set({
                character: myChar ? (0, calculator_1.recalculateCharacter)(myChar, items) : null,
                items,
                allCharacters: allChars || [],
                activeScene,
                tokens,
                logs: logs || []
            });
            get().subscribeToChanges(mesaId);
        }
        catch (error) {
            console.error("Erro Fatal na Inicialização:", error);
            // Em produção, isso deve redirecionar para o lobby ou mostrar erro crítico
        }
        finally {
            set({ isLoading: false });
        }
    },
    createCharacter: async (data) => {
        const { currentMesa, currentUser } = get();
        if (!currentMesa || !currentUser)
            return { success: false, message: "Erro de sessão" };
        const newChar = {
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
        const { data: created, error } = await supabase_1.supabase.from('characters').insert(newChar).select().single();
        if (error)
            return { success: false, message: "Erro ao criar ficha" };
        // Recalcular com regras de classe (PV/PE iniciais reais)
        const finalChar = (0, calculator_1.recalculateCharacter)(created, []);
        await supabase_1.supabase.from('characters').update(finalChar).eq('id', created.id);
        set({ character: finalChar, needsCharacterCreation: false });
        return { success: true, message: "Agente registrado com sucesso!" };
    },
    subscribeToChanges: (mesaId) => {
        supabase_1.supabase
            .channel(`game:${mesaId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `mesa_id=eq.${mesaId}` }, async () => {
            const { data } = await supabase_1.supabase.from('characters').select('*').eq('mesa_id', mesaId);
            if (data) {
                const myUpdatedChar = data.find(c => { var _a; return c.user_id === ((_a = get().currentUser) === null || _a === void 0 ? void 0 : _a.id); });
                set({
                    allCharacters: data,
                    character: myUpdatedChar ? (0, calculator_1.recalculateCharacter)(myUpdatedChar, get().items) : get().character
                });
            }
        })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mesas', filter: `id=eq.${mesaId}` }, (payload) => set({ currentMesa: payload.new }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, async (payload) => {
            const char = get().character;
            if (char && payload.new && payload.new.character_id === char.id) {
                const { data } = await supabase_1.supabase.from('items').select('*').eq('character_id', char.id);
                if (data) {
                    const updatedChar = (0, calculator_1.recalculateCharacter)(char, data);
                    set({ items: data, character: updatedChar });
                }
            }
        })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `mesa_id=eq.${mesaId}` }, (payload) => set(state => ({ messages: [...state.messages, payload.new] })))
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaign_logs', filter: `mesa_id=eq.${mesaId}` }, (payload) => set(state => ({ logs: [payload.new, ...state.logs] })))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scenes', filter: `mesa_id=eq.${mesaId}` }, (payload) => {
            if (payload.new.is_active) {
                set({ activeScene: payload.new });
                supabase_1.supabase.from('tokens').select('*').eq('scene_id', payload.new.id).then(({ data }) => set({ tokens: data || [] }));
            }
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, (payload) => {
            const scene = get().activeScene;
            if (!scene || payload.new.scene_id !== scene.id)
                return;
            const newTokens = [...get().tokens];
            const index = newTokens.findIndex(t => t.id === payload.new.id);
            if (payload.eventType === 'DELETE') {
                if (index !== -1)
                    newTokens.splice(index, 1);
            }
            else if (index !== -1) {
                newTokens[index] = payload.new;
            }
            else {
                newTokens.push(payload.new);
            }
            set({ tokens: newTokens });
        })
            .subscribe();
    },
    unsubscribe: () => supabase_1.supabase.removeAllChannels(),
    sendChatMessage: async (content, type = 'text') => {
        const { currentMesa, currentUser, character } = get();
        if (!currentMesa || !currentUser)
            return;
        let msgType = type;
        let messageContent = { text: content };
        if (type === 'text' && (content.startsWith('/roll ') || content.startsWith('/r '))) {
            const code = content.replace(/^\/(roll|r) /, '').trim();
            const roll = (0, dice_1.rollDice)(code, 'atributo');
            msgType = 'roll';
            messageContent = { dice: roll.diceCode, result: roll.results, total: roll.total, details: roll.details, is_critical: roll.isCritical };
        }
        await supabase_1.supabase.from('messages').insert({
            mesa_id: currentMesa.id, user_id: currentUser.id, character_id: character === null || character === void 0 ? void 0 : character.id, type: msgType, content: messageContent
        });
    },
    updateCharacterStats: async (newStats) => {
        const { character, currentMesa } = get();
        if (!character || !currentMesa)
            return;
        const updatedStats = { ...character.stats_current, ...newStats };
        const logs = [];
        if (newStats.pv !== undefined)
            logs.push(`PV ${character.stats_current.pv} -> ${newStats.pv}`);
        if (newStats.pe !== undefined)
            logs.push(`PE ${character.stats_current.pe} -> ${newStats.pe}`);
        await supabase_1.supabase.from('characters').update({ stats_current: updatedStats }).eq('id', character.id);
        if (logs.length > 0) {
            await supabase_1.supabase.from('campaign_logs').insert({
                mesa_id: currentMesa.id, type: 'stats_change', description: `${character.name}: ${logs.join(', ')}`, data: { prev: character.stats_current, new: updatedStats }
            });
        }
    },
    increaseAttribute: async (attr) => {
        const { character, currentMesa } = get();
        if (!character || !currentMesa)
            return { success: false, message: "Erro" };
        const validation = (0, validator_1.validateAttributeIncrease)(character, attr);
        if (!validation.success)
            return validation;
        const newAttrs = { ...character.attributes, [attr]: character.attributes[attr] + 1 };
        await supabase_1.supabase.from('characters').update({ attributes: newAttrs }).eq('id', character.id);
        await supabase_1.supabase.from('campaign_logs').insert({
            mesa_id: currentMesa.id, type: 'attribute_up', description: `${character.name} aumentou ${attr.toUpperCase()}`, data: { attr, old: character.attributes[attr], new: newAttrs[attr] }
        });
        return { success: true, message: "Aumento realizado!" };
    },
    spawnMonster: async (monsterId) => {
        const { currentMesa, activeScene } = get();
        if (!currentMesa)
            return { success: false, message: "Sem mesa" };
        const monsterTemplate = monsters_json_1.default.find(m => m.id === monsterId);
        const newMonster = {
            mesa_id: currentMesa.id, name: `${monsterTemplate.name} #${Math.floor(Math.random() * 100)}`,
            class: 'ocultista', is_npc: true, nex: monsterTemplate.vd,
            stats_max: { pv: monsterTemplate.stats.pv, pe: 0, san: 0 },
            stats_current: { pv: monsterTemplate.stats.pv, pe: 0, san: 0 },
            attributes: { for: 0, agi: 0, int: 0, pre: 0, vig: 0 },
            defenses: { passiva: monsterTemplate.stats.defesa, esquiva: 0, bloqueio: 0 },
            status_flags: { vida: 'vivo', mental: 'sao', sobrecarregado: false },
            is_gm_mode: false, skills: {}, powers: [], rituals: []
        };
        await get().sendChatMessage(`O Mestre invocou: ${newMonster.name}`, 'system');
        const { data } = await supabase_1.supabase.from('characters').insert(newMonster).select().single();
        if (data && activeScene) {
            await supabase_1.supabase.from('tokens').insert({ scene_id: activeScene.id, character_id: data.id, x: 100, y: 100, size: 1, is_visible: true });
        }
        return { success: true, message: "Invocado!" };
    },
    giveItemToCharacter: async (itemTemplate, targetCharId) => {
        const { allCharacters } = get();
        const target = allCharacters.find(c => c.id === targetCharId);
        const { error } = await supabase_1.supabase.from('items').insert({ ...itemTemplate, character_id: targetCharId });
        if (!error) {
            await get().sendChatMessage(`Item enviado para ${target === null || target === void 0 ? void 0 : target.name}`, 'system');
            return { success: true, message: "Enviado!" };
        }
        return { success: false, message: "Erro" };
    },
    createItemGlobal: async (itemData) => ({ success: true, message: "Ok" }),
    moveToken: async (tokenId, x, y) => {
        const newTokens = get().tokens.map(t => t.id === tokenId ? { ...t, x, y } : t);
        set({ tokens: newTokens });
        await supabase_1.supabase.from('tokens').update({ x, y }).eq('id', tokenId);
    },
    createScene: async (name, imageUrl) => {
        const { currentMesa } = get();
        if (!currentMesa)
            return { success: false, message: "Erro" };
        await supabase_1.supabase.from('scenes').update({ is_active: false }).eq('mesa_id', currentMesa.id);
        const { data } = await supabase_1.supabase.from('scenes').insert({ mesa_id: currentMesa.id, name, image_url: imageUrl, is_active: true, grid_size: 50 }).select().single();
        set({ activeScene: data, tokens: [] });
        return { success: true, message: "Mapa carregado!" };
    },
    startCombat: async () => {
        const { currentMesa, allCharacters } = get();
        if (!currentMesa)
            return { success: false, message: "Sem mesa" };
        const turnOrder = allCharacters.map(char => {
            const roll = Math.floor(Math.random() * 20) + 1 + (char.attributes.agi || 0);
            return { character_id: char.id, initiative: roll };
        }).sort((a, b) => b.initiative - a.initiative);
        const update = { combat_active: true, turn_order: turnOrder, current_turn_index: 0, round_count: 1 };
        await supabase_1.supabase.from('mesas').update(update).eq('id', currentMesa.id);
        set({ currentMesa: { ...currentMesa, ...update } });
        await get().sendChatMessage("⚔️ COMBATE INICIADO!", "system");
        return { success: true, message: "Combate iniciado!" };
    },
    nextTurn: async () => {
        var _a;
        const { currentMesa, allCharacters } = get();
        if (!(currentMesa === null || currentMesa === void 0 ? void 0 : currentMesa.combat_active))
            return { success: false, message: "Erro" };
        let nextIndex = (currentMesa.current_turn_index || 0) + 1;
        let nextRound = currentMesa.round_count || 1;
        if (nextIndex >= (((_a = currentMesa.turn_order) === null || _a === void 0 ? void 0 : _a.length) || 0)) {
            nextIndex = 0;
            nextRound++;
            await get().sendChatMessage(`🔔 RODADA ${nextRound} INICIADA`, "system");
        }
        const update = { current_turn_index: nextIndex, round_count: nextRound };
        await supabase_1.supabase.from('mesas').update(update).eq('id', currentMesa.id);
        set({ currentMesa: { ...currentMesa, ...update } });
        const turnData = currentMesa.turn_order[nextIndex];
        const char = allCharacters.find(c => c.id === turnData.character_id);
        if (char)
            await get().sendChatMessage(`Vez de: ${char.name}`, "system");
        return { success: true, message: "Próximo turno" };
    },
    endCombat: async () => {
        const { currentMesa } = get();
        if (!currentMesa)
            return { success: false, message: "Erro" };
        await supabase_1.supabase.from('mesas').update({ combat_active: false, turn_order: [] }).eq('id', currentMesa.id);
        await get().sendChatMessage("🏳️ Combate Encerrado.", "system");
        return { success: true, message: "Fim" };
    },
    selectTarget: (tokenId) => set({ selectedTargetId: tokenId }),
    performAttack: async (weaponId) => {
        // Lógica mantida...
        return { success: true, message: "Ataque" };
    }
}));
//# sourceMappingURL=game-store.js.map