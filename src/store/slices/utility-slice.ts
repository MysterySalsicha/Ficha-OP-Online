import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, Item, InventoryItem } from '../../core/types';
import { supabase } from '../../lib/supabase';
import { rollDice } from '../../engine/dice';
import ritualsSeed from '../../data/seed_rituals.json'; // Placeholder, should come from a library

export interface UtilitySlice {
    messages: any[];
    sendChatMessage: (content: string, type?: string, targetUserId?: string | null) => Promise<void>;
    consumeItem: (characterId: string, itemTemplateId: string, quantity?: number) => Promise<ActionResult>;
    giveItemToCharacter: (item: InventoryItem, targetCharId: string) => Promise<ActionResult>;
    castRitual: (ritualId: string) => Promise<ActionResult>;
}

export const createUtilitySlice: StateCreator<GameState, [], [], UtilitySlice> = (set, get) => ({
    messages: [],
    sendChatMessage: async (content, type = 'text', targetUserId = null) => {
        const { currentMesa, currentUser, character } = get();
        if (!currentMesa || !currentUser) return;

        let messageContent: any = { text: content };
        let msgType = type;

        // Handle dice rolls
        if (type === 'text' && (content.startsWith('/r ') || content.startsWith('/roll '))) {
            const rollCommand = content.replace(/^\/(r|roll)\s+/, '').trim();
            const roll = rollDice(rollCommand, 'dado');
            msgType = 'roll';
            messageContent = { ...roll, details: rollCommand };
        }
        
        await supabase.from('messages').insert({
            mesa_id: currentMesa.id,
            user_id: currentUser.id,
            character_id: character?.id,
            type: msgType,
            content: messageContent,
            target_user_id: targetUserId
        });
    },

    consumeItem: async (characterId, itemTemplateId, quantity = 1) => {
        const { allCharacters, sendChatMessage } = get();
        const character = allCharacters.find(c => c.id === characterId);
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const inventory = [...character.inventory];
        const itemIndex = inventory.findIndex(i => i.template_id === itemTemplateId);

        if (itemIndex === -1) return { success: false, message: "Item não encontrado." };
        
        const item = inventory[itemIndex];
        if (!item.quantity || item.quantity < quantity) return { success: false, message: `Quantidade insuficiente de ${item.name}.` };

        const newQuantity = item.quantity - quantity;

        if (newQuantity > 0) {
            inventory[itemIndex].quantity = newQuantity;
        } else {
            inventory.splice(itemIndex, 1);
        }

        const { error } = await supabase.from('characters').update({ inventory }).eq('id', characterId);
        if (error) return { success: false, message: "Falha ao consumir item." };
        
        await sendChatMessage(`${character.name} consumiu ${quantity}x ${item.name}.`, 'system');
        return { success: true, message: "Item consumido." };
    },

    giveItemToCharacter: async (item, targetCharId) => {
        const { allCharacters, sendChatMessage } = get();
        const target = allCharacters.find(c => c.id === targetCharId);
        if (!target) return { success: false, message: "Personagem alvo não encontrado." };

        const inventory = [...target.inventory];
        // Check if the item already exists to stack it
        const existingItemIndex = inventory.findIndex(i => i.template_id === item.template_id && i.is_stackable);

        if (existingItemIndex !== -1) {
            inventory[existingItemIndex].quantity = (inventory[existingItemIndex].quantity || 1) + (item.quantity || 1);
        } else {
            inventory.push({ ...item, id: crypto.randomUUID() }); // Assign a new UUID for the inventory instance
        }
        
        const { error } = await supabase.from('characters').update({ inventory }).eq('id', targetCharId);
        if (error) return { success: false, message: `Falha ao entregar item: ${error.message}` };
        
        await sendChatMessage(`Entregou ${item.name} para ${target.name}.`, 'system');
        return { success: true, message: "Item entregue." };
    },

    castRitual: async (ritualId) => {
        const { character, sendChatMessage, updateCharacterStatus } = get();
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const ritual = ritualsSeed.find((r: any) => r.id === ritualId); // Placeholder
        if (!ritual) return { success: false, message: "Ritual desconhecido." };

        if (character.current_status.pe < ritual.cost_pe) {
            return { success: false, message: "PE Insuficiente." };
        }
        
        // Consume components if necessary (future implementation)

        const newPE = character.current_status.pe - ritual.cost_pe;
        const statusUpdateResult = await updateCharacterStatus(character.id, { pe: newPE });

        if (!statusUpdateResult.success) return statusUpdateResult;

        await sendChatMessage(`${character.name} conjurou ${ritual.name}!`, 'system');
        return { success: true, message: `Ritual ${ritual.name} conjurado!` };
    },
});
