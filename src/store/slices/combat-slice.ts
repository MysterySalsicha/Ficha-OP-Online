import { StateCreator } from 'zustand';
import { GameState } from '../game-store'; // This will be the main store interface
import { ActionResult, AttackResult, DamageInput, AttributeName, Character, Item } from '../../core/types';
import { rollDice } from '../../engine/dice';
import { supabase } from '../../lib/supabase';

export interface CombatSlice {
    selectedTargetId: string | null;
    performAttack: (weaponId: string, targetCharacterId: string) => Promise<AttackResult>;
    performDamage: (damageInput: DamageInput) => Promise<ActionResult>;
    handleReaction: (attackResult: AttackResult, reactionType: 'dodge' | 'block' | 'counter' | 'none') => Promise<AttackResult>;
    startCombat: () => Promise<ActionResult>;
    nextTurn: () => Promise<ActionResult>;
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
            .filter(c => c.current_status.pv > 0) // Apenas personagens vivos
            .map(char => {
                const iniciativa = char.attributes.agi;
                const roll = rollDice('1d20', 'atributo', 20, iniciativa);
                return { character_id: char.id, initiative: roll.total };
            })
            .sort((a, b) => b.initiative - a.initiative);

        const update = { combat_active: true, turn_order: turnOrder, current_turn_index: 0, round_count: 1 };
        const { error } = await supabase.from('mesas').update(update).eq('id', currentMesa.id);
        if (error) return { success: false, message: "Falha ao iniciar o combate." };
        
        await sendChatMessage("⚔️ COMBATE INICIADO!", "system");
        return { success: true, message: "Combate iniciado!" };
    },

    nextTurn: async () => {
        const { currentMesa, allCharacters, sendChatMessage } = get();
        if (!currentMesa?.combat_active || !currentMesa.turn_order) return { success: false, message: "Não está em combate." };

        let nextIndex = (currentMesa.current_turn_index ?? -1) + 1;
        let nextRound = currentMesa.round_count || 1;

        if (nextIndex >= currentMesa.turn_order.length) {
            nextIndex = 0;
            nextRound++;
            await sendChatMessage(`🔔 RODADA ${nextRound} INICIADA`, "system");
        }

        const { error } = await supabase.from('mesas').update({ current_turn_index: nextIndex, round_count: nextRound }).eq('id', currentMesa.id);
        if (error) return { success: false, message: "Falha ao avançar o turno." };

        const turnData = currentMesa.turn_order[nextIndex];
        const charOnTurn = allCharacters.find(c => c.id === turnData.character_id);
        if (charOnTurn) {
            await sendChatMessage(`Vez de: ${charOnTurn.name}`, "system");
        }
        return { success: true, message: "Próximo turno." };
    },

    endCombat: async () => {
        const { currentMesa, sendChatMessage } = get();
        if (!currentMesa) return { success: false, message: "Mesa não encontrada." };
        
        const { error } = await supabase.from('mesas').update({ combat_active: false, turn_order: [], current_turn_index: -1 }).eq('id', currentMesa.id);
        if (error) return { success: false, message: "Falha ao encerrar o combate." };

        await sendChatMessage("🏳️ Combate Encerrado.", "system");
        return { success: true, message: "Combate encerrado." };
    },

    performAttack: async (weaponId, targetCharacterId) => {
        const { character, allCharacters, sendChatMessage, consumeItem } = get();
        if (!character) return { success: false, message: "Personagem atacante não encontrado." };

        const weapon = character.inventory.find(item => item.id === weaponId);
        if (!weapon) return { success: false, message: "Arma não encontrada no inventário." };

        const target = allCharacters.find(char => char.id === targetCharacterId);
        if (!target) return { success: false, message: "Alvo não encontrado." };

        const attackAttribute = (weapon.type === 'Arma de Fogo' || weapon.type === 'Arma de Disparo') ? 'agi' : 'for';
        const attackerAttributeValue = character.attributes[attackAttribute];
        const attackRoll = rollDice('1d20', 'atributo', 20, attackerAttributeValue);
        
        const targetDefense = target.defenses.passiva;
        const isHit = attackRoll.total >= targetDefense;

        const weaponCritThreat = weapon.crit_threat_range ?? 20;
        const isCriticalThreat = attackRoll.results[0] >= weaponCritThreat;

        const message = `${character.name} atacou ${target.name} com ${weapon.name}: Rolagem ${attackRoll.total} vs Defesa ${targetDefense}. ${isHit ? 'ACERTOU!' : 'ERROU!'}${isCriticalThreat && isHit ? ' (Ameaça de Crítico!)' : ''}`;
        await sendChatMessage(message, 'system');

        if (weapon.ammo_id && weapon.ammo_per_shot) {
            await consumeItem(character.id, weapon.ammo_id, weapon.ammo_per_shot);
        }

        return {
            success: isHit,
            message: isHit ? "Ataque bem-sucedido!" : "Ataque falhou.",
            isHit,
            isCriticalThreat: isCriticalThreat && isHit,
            attackRoll,
            targetDefense,
            weapon,
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
            damageMultiplier = weapon.crit_multiplier ?? 2;
            critMessage = ' (CRÍTICO!)';
        }

        const damageRoll = rollDice(damageDice, 'dano', 0, damageBonus || 0);
        const totalDamage = damageRoll.total * damageMultiplier;

        // TODO: Considerar resistência/vulnerabilidade do alvo
        const newTargetPV = Math.max(0, target.current_status.pv - totalDamage);

        await updateCharacterStatus(target.id, { pv: newTargetPV });
        
        const attacker = allCharacters.find(char => char.id === attackerId);
        const message = `${attacker?.name || 'Um ataque'} causou ${totalDamage} de dano${critMessage} a ${target.name}. PV restantes: ${newTargetPV}`;
        await sendChatMessage(message, 'system');

        if (newTargetPV <= 0 && !target.current_status.is_dying) {
            await updateCharacterStatus(target.id, { is_dying: true });
            await sendChatMessage(`${target.name} está Morrendo!`, 'system');
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
                // Placeholder para lógica de esquiva
                reactionMessage = `${target.name} tentou Esquivar do ataque! (Lógica de rolagem pendente)`;
                break;
            case 'block':
                 // Placeholder para lógica de bloqueio
                reactionMessage = `${target.name} tentou Bloquear o ataque! (Lógica de rolagem pendente)`;
                break;
            case 'none':
                reactionMessage = `${target.name} não reagiu ao ataque.`;
                break;
        }

        await sendChatMessage(reactionMessage, 'system');
        return modifiedAttackResult;
    },
});
