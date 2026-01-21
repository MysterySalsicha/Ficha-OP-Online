import { StateCreator } from 'zustand';
import { GameState } from '../game-store'; // This will be the main store interface
import { ActionResult, AttackResult, DamageInput, AttributeName, Character, InventoryItem, DieRoll } from '../../core/types';
import { rollDice } from '../../engine/dice';
import { supabase } from '../../lib/supabase';

export interface CombatSlice {
    selectedTargetId: string | null;
    performAttack: (weaponId: string, targetCharacterId: string) => Promise<AttackResult>;
    performDamage: (damageInput: DamageInput) => Promise<ActionResult>;
    handleReaction: (attackResult: AttackResult, reactionType: 'dodge' | 'block' | 'counter' | 'none') => Promise<AttackResult>;
    startCombat: () => Promise<ActionResult>;
    nextTurn: () => Promise<ActionResult>;
    revertTurn: () => Promise<ActionResult>; // Added revertTurn
    passTurn: () => Promise<ActionResult>; // Added passTurn
    reorderTurn: (characterId: string, direction: 'up' | 'down') => Promise<ActionResult>;
    endCombat: () => Promise<ActionResult>;
    selectTarget: (tokenId: string | null) => void;
}

export const createCombatSlice: StateCreator<GameState, [], [], CombatSlice> = (set, get) => ({
    selectedTargetId: null,
    selectTarget: (tokenId) => set({ selectedTargetId: tokenId }),

    startCombat: async () => {
        const { currentMesa, allCharacters, sendChatMessage } = get();
        if (!currentMesa) return { success: false, message: "Mesa não encontrada." };

        const turnOrder = allCharacters
            .filter(c => c.stats_current.pv > 0) // Apenas personagens vivos
            .map(char => {
                const iniciativa = char.attributes.agi;
                const roll = rollDice('1d20', 'atributo', 20, iniciativa);
                return { character_id: char.id, initiative: roll.total };
            })
            .sort((a, b) => b.initiative - a.initiative);

        const combat_state = { in_combat: true, turn_order: turnOrder, current_turn_index: 0, round: 1 };
        const { error } = await supabase.from('mesas').update({ combat_state }).eq('id', currentMesa.id);
        if (error) return { success: false, message: "Falha ao iniciar o combate." };
        
        await sendChatMessage('system', "⚔️ COMBATE INICIADO!");
        return { success: true, message: "Combate iniciado!" };
    },

    nextTurn: async () => {
        const { currentMesa, allCharacters, sendChatMessage } = get();
        if (!currentMesa?.combat_state.in_combat || !currentMesa.combat_state.turn_order) return { success: false, message: "Não está em combate." };

        let nextIndex = (currentMesa.combat_state.current_turn_index ?? -1) + 1;
        let nextRound = currentMesa.combat_state.round || 1;

        if (nextIndex >= currentMesa.combat_state.turn_order.length) {
            nextIndex = 0;
            nextRound++;
            await sendChatMessage('system', `🔔 RODADA ${nextRound} INICIADA`);
        }
        const combat_state = { ...currentMesa.combat_state, current_turn_index: nextIndex, round: nextRound };
        const { error } = await supabase.from('mesas').update({ combat_state }).eq('id', currentMesa.id);
        if (error) return { success: false, message: "Falha ao avançar o turno." };

        const turnData = currentMesa.combat_state.turn_order[nextIndex];
        const charOnTurn = allCharacters.find(c => c.id === turnData.character_id);
        if (charOnTurn) {
            await sendChatMessage('system', `Vez de: ${charOnTurn.name}`);
        }
        return { success: true, message: "Próximo turno." };
    },

    revertTurn: async () => {
        const { currentMesa, allCharacters, sendChatMessage } = get();
        if (!currentMesa?.combat_state.in_combat || !currentMesa.combat_state.turn_order) return { success: false, message: "Não está em combate." };

        let prevIndex = (currentMesa.combat_state.current_turn_index ?? 0) - 1;
        let prevRound = currentMesa.combat_state.round || 1;

        if (prevIndex < 0) {
            if (prevRound <= 1) return { success: false, message: "Não há turno anterior." }; // Cannot go before Round 1
            prevRound--;
            prevIndex = currentMesa.combat_state.turn_order.length - 1;
            await sendChatMessage('system', `🔔 RETROCEDENDO para RODADA ${prevRound}`);
        }
        const combat_state = { ...currentMesa.combat_state, current_turn_index: prevIndex, round: prevRound };
        const { error } = await supabase.from('mesas').update({ combat_state }).eq('id', currentMesa.id);
        if (error) return { success: false, message: "Falha ao retroceder o turno." };

        const turnData = currentMesa.combat_state.turn_order[prevIndex];
        const charOnTurn = allCharacters.find(c => c.id === turnData.character_id);
        if (charOnTurn) {
            await sendChatMessage('system', `Retrocedendo para: ${charOnTurn.name}`);
        }
        return { success: true, message: "Retrocedido para turno anterior." };
    },

    passTurn: async () => {
        return get().nextTurn();
    },

    reorderTurn: async (characterId, direction) => {
        const { currentMesa } = get();
        const combatState = currentMesa?.combat_state;

        if (!combatState || !combatState.in_combat || !combatState.turn_order) {
            return { success: false, message: "Não está em combate." };
        }

        const turnOrder = [...combatState.turn_order];
        const charIndex = turnOrder.findIndex(t => t.character_id === characterId);

        if (charIndex === -1) {
            return { success: false, message: "Personagem não encontrado na ordem de turno." };
        }

        const swapIndex = direction === 'up' ? charIndex - 1 : charIndex + 1;

        if (swapIndex < 0 || swapIndex >= turnOrder.length) {
            return { success: false, message: "Movimento inválido." }; // Cannot move further
        }

        // Swap elements
        [turnOrder[charIndex], turnOrder[swapIndex]] = [turnOrder[swapIndex], turnOrder[charIndex]];
        
        const newCombatState = { ...combatState, turn_order: turnOrder };

        const { error } = await supabase
            .from('mesas')
            .update({ combat_state: newCombatState })
            .eq('id', currentMesa.id);

        if (error) {
            console.error("Erro ao reordenar turno:", error)
            return { success: false, message: "Falha ao reordenar o turno." };
        }

        // We don't need to set state locally, as the subscription will handle it
        return { success: true, message: "Ordem de turno atualizada." };
    },

    endCombat: async () => {
        const { currentMesa, sendChatMessage } = get();
        if (!currentMesa) return { success: false, message: "Mesa não encontrada." };
        
        const combat_state = { ...currentMesa.combat_state, in_combat: false, turn_order: [], current_turn_index: -1 };
        const { error } = await supabase.from('mesas').update({ combat_state }).eq('id', currentMesa.id);
        if (error) return { success: false, message: "Falha ao encerrar o combate." };

        await sendChatMessage('system', "🏳️ Combate Encerrado.");
        return { success: true, message: "Combate encerrado." };
    },

    performAttack: async (weaponId, targetCharacterId) => {
        const { character, allCharacters, sendChatMessage, consumeItem } = get();
        // Helper to return a default AttackResult for early exits
        const defaultAttackResult = (message: string): AttackResult => ({
            success: false,
            message,
            isHit: false,
            isCriticalThreat: false,
            attackRoll: {} as DieRoll, // Empty DieRoll for type compatibility
            targetDefense: 0,
            weapon: {} as InventoryItem, // Empty InventoryItem for type compatibility
            attackerId: character?.id || '',
            targetId: targetCharacterId
        });

        if (!character) return defaultAttackResult("Personagem atacante não encontrado.");

        const weapon = character.inventory.find(item => item.id === weaponId);
        if (!weapon) return defaultAttackResult("Arma não encontrada no inventário.");

        const target = allCharacters.find(char => char.id === targetCharacterId);
        if (!target) return defaultAttackResult("Alvo não encontrado.");

        const attackAttribute = (weapon.stats?.type === 'Arma de Fogo' || weapon.stats?.type === 'Arma de Disparo') ? 'agi' : 'for'; // Added optional chaining
        const attackerAttributeValue = character.attributes[attackAttribute];
        const attackRoll = rollDice('1d20', 'atributo', 20, attackerAttributeValue);
        
        const targetDefense = target.defenses.passiva;
        const isHit = attackRoll.total >= targetDefense;

        const critString = weapon.stats?.critico || '20'; // Added optional chaining
        const weaponCritThreat = parseInt(critString.split('/')[0]);
        const isCriticalThreat = attackRoll.results[0] >= weaponCritThreat;

        const message = `${character.name} atacou ${target.name} com ${weapon.name}: Rolagem ${attackRoll.total} vs Defesa ${targetDefense}. ${isHit ? 'ACERTOU!' : 'ERROU!'}${isCriticalThreat && isHit ? ' (Ameaça de Crítico!)' : ''}`;
        await sendChatMessage('system', message);

        if (weapon.stats?.ammo_id && weapon.stats?.ammo_per_shot) { // Added optional chaining
            await consumeItem(character.id, weapon.stats.ammo_id, weapon.stats.ammo_per_shot);
        }

        return {
            success: isHit,
            message: isHit ? "Ataque bem-sucedido!" : "Ataque falhou.",
            isHit,
            isCriticalThreat: isCriticalThreat && isHit,
            attackRoll: attackRoll as DieRoll,
            targetDefense,
            weapon: weapon as any,
            attackerId: character.id,
            targetId: target.id
        };
    },

    performDamage: async (damageInput) => {
        const { allCharacters, updateCharacterStatus, sendChatMessage } = get();
        const { attackResult, damageDice, damageBonus, isCriticalConfirmed } = damageInput;
        const { weapon, targetId, attackerId } = attackResult;

        if (!weapon || !targetId || !attackerId) return { success: false, message: "Dados de dano incompletos." };
        
        const target = allCharacters.find(char => char.id === targetId);
        if (!target) return { success: false, message: "Alvo não encontrado para aplicar dano." };

        let damageMultiplier = 1;
        let critMessage = '';
        if (isCriticalConfirmed) {
            const critString = weapon.stats?.critico || '20/x2'; // Added optional chaining
            damageMultiplier = parseInt(critString.split('/')[1]?.replace('x', '')) || 2;
            critMessage = ' (CRÍTICO!)';
        }

        const damageRoll = rollDice(damageDice, 'dano', 0, damageBonus || 0);
        const totalDamage = damageRoll.total * damageMultiplier;

        const newTargetPV = Math.max(0, target.stats_current.pv - totalDamage);

        await updateCharacterStatus(target.id, { pv: newTargetPV });
        
        const attacker = allCharacters.find(char => char.id === attackerId);
        const message = `${attacker?.name || 'Um ataque'} causou ${totalDamage} de dano${critMessage} a ${target.name}. PV restantes: ${newTargetPV}`;
        await sendChatMessage('system', message);

        if (newTargetPV <= 0 && !target.stats_current.is_dying) {
            await updateCharacterStatus(target.id, { is_dying: true });
            await sendChatMessage('system', `${target.name} está Morrendo!`);
        }

        return { success: true, message: "Dano aplicado com sucesso!" };
    },

    handleReaction: async (attackResult, reactionType) => {
        const { sendChatMessage, allCharacters } = get();
        const { targetId } = attackResult;
        const target = allCharacters.find(c => c.id === targetId);

        if (!target) return attackResult;

        let reactionMessage = '';
        let modifiedAttackResult = { ...attackResult };

        switch (reactionType) {
            case 'dodge':
                reactionMessage = `${target.name} tentou Esquivar do ataque! (Lógica de rolagem pendente)`;
                break;
            case 'block':
                reactionMessage = `${target.name} tentou Bloquear o ataque! (Lógica de rolagem pendente)`;
                break;
            case 'none':
                reactionMessage = `${target.name} não reagiu ao ataque.`;
                break;
        }

        await sendChatMessage('system', reactionMessage);
        return modifiedAttackResult;
    },
});
