import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, Item, InventoryItem, Message } from '../../core/types'; // Added Message
import { supabase } from '../../lib/supabase';
import { rollDice } from '../../engine/dice';
import ritualsSeed from '../../data/seed_rituals.json'; // Placeholder, should come from a library

export interface UtilitySlice {
    messages: any[];
    sendChatMessage: (content: string, type?: Message['type'], options?: { imageUrl?: string; targetUserId?: string }) => Promise<void>; // Updated signature
    consumeItem: (characterId: string, itemId: string, quantity?: number) => Promise<ActionResult>;
    giveItemToCharacter: (item: InventoryItem, targetCharId: string) => Promise<ActionResult>;
    castRitual: (ritualId: string) => Promise<ActionResult>;
}

export const createUtilitySlice: StateCreator<GameState, [], [], UtilitySlice> = (set, get) => ({
    messages: [],
    sendChatMessage: async (content: string, type: Message['type'] = 'text', options?: { imageUrl?: string; targetUserId?: string }) => {
        const { currentMesa, currentUser, character } = get();
        if (!currentMesa || !currentUser) return;

        let messageContent: any = { text: content };
        let msgType = type;
        
        // Handle roll command if message type is 'text'
        const rollMatch = content.match(/^\/(d|r|roll)\s*(.*)/i);
        if (msgType === 'text' && rollMatch) {
            let rollCommand = rollMatch[2].trim();
            // Handle simple /d20 syntax
            if (rollMatch[1] === 'd' && !rollCommand.includes('d')) {
                rollCommand = `1d${rollCommand}`;
            }
            const roll = rollDice(rollCommand, 'dado');
            msgType = 'roll';
            messageContent = { ...roll, details: rollCommand };
        } else if (msgType === 'image' && options?.imageUrl) {
            messageContent = { imageUrl: options.imageUrl };
        } else if (msgType === 'whisper') {
            // Content is already text for whisper
        }
        
        await supabase.from('messages').insert({
            mesa_id: currentMesa.id,
            user_id: currentUser.id,
            character_id: character?.id,
            type: msgType,
            content: messageContent,
            target_user_id: options?.targetUserId || null // Use targetUserId from options
        });
    },

    consumeItem: async (characterId, itemId, quantity = 1) => {
        const { allCharacters, sendChatMessage } = get();
        const character = allCharacters.find(c => c.id === characterId);
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const inventory = [...character.inventory];
        const itemIndex = inventory.findIndex(i => i.id === itemId);

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
        const existingItemIndex = inventory.findIndex(i => i.item_id_ref === item.item_id_ref);

        if (existingItemIndex !== -1) {
            inventory[existingItemIndex].quantity += item.quantity || 1;
        } else {
            inventory.push({ ...item, id: crypto.randomUUID() });
        }
        
        const { error } = await supabase.from('characters').update({ inventory }).eq('id', targetCharId);
        if (error) return { success: false, message: `Falha ao entregar item: ${error.message}` };
        
        await sendChatMessage(`Entregou ${item.name} para ${target.name}.`, 'system');
        return { success: true, message: "Item entregue." };
    },

    castRitual: async (ritualId) => {
        const { character, sendChatMessage, updateCharacterStatus } = get();
        if (!character) return { success: false, message: "Personagem não encontrado." };

        const ritual = ritualsSeed.find((r: any) => r.id === ritualId);
        if (!ritual) return { success: false, message: "Ritual desconhecido." };

        if (character.stats_current.pe < ritual.cost_pe) {
            return { success: false, message: "PE Insuficiente." };
        }
        
        const newPE = character.stats_current.pe - ritual.cost_pe;
        const statusUpdateResult = await updateCharacterStatus(character.id, { pe: newPE });

        if (!statusUpdateResult.success) return statusUpdateResult;

        await sendChatMessage(`${character.name} conjurou ${ritual.name}!`, 'system');
        return { success: true, message: `Ritual ${ritual.name} conjurado!` };
    },
});