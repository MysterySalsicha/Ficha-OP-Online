import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, MonsterTemplate, ItemTemplate, ItemCategory } from '../../core/types';
import { supabase } from '../../lib/supabase';

export interface LibrarySlice {
    monsters: MonsterTemplate[];
    items: ItemTemplate[];
    fetchMonsters: (mesaId: string) => Promise<void>;
    createMonster: (monster: Omit<MonsterTemplate, 'id' | 'created_at'>) => Promise<ActionResult>;
    updateMonster: (monsterId: string, updates: Partial<MonsterTemplate>) => Promise<ActionResult>;
    deleteMonster: (monsterId: string) => Promise<ActionResult>;
    fetchItems: (mesaId: string) => Promise<void>;
    createItem: (item: Omit<ItemTemplate, 'id' | 'created_at'>) => Promise<ActionResult>;
    updateItem: (itemId: string, updates: Partial<ItemTemplate>) => Promise<ActionResult>;
    deleteItem: (itemId: string) => Promise<ActionResult>;
}

export const createLibrarySlice: StateCreator<GameState, [], [], LibrarySlice> = (set, get) => ({
    monsters: [],
    items: [],

    fetchMonsters: async (mesaId: string) => {
        // Fetch official (owner_id is null) and user-owned monsters
        const { data: officialMonsters, error: officialError } = await supabase
            .from('library_monsters')
            .select('*')
            .is('owner_id', null);

        const { data: userMonsters, error: userError } = await supabase
            .from('library_monsters')
            .select('*')
            .eq('owner_id', get().currentUser?.id);

        if (officialError || userError) {
            console.error("Error fetching monsters:", officialError || userError);
            return;
        }

        const allMonsters = [...(officialMonsters || []), ...(userMonsters || [])];
        set({ monsters: allMonsters });
    },

    createMonster: async (monster) => {
        const { error } = await supabase
            .from('library_monsters')
            .insert({ 
                name: monster.name,
                description: monster.description,
                profile_image_url: monster.profile_image_url,
                token_image_url: monster.token_image_url,
                attributes: monster.attributes,
                stats_max: monster.stats_max,
                defenses: monster.defenses,
                abilities: monster.abilities,
                is_public: monster.is_public,
                owner_id: get().currentUser?.id 
            });
        
        if (error) return { success: false, message: `Falha ao criar monstro: ${error.message}` };
        return { success: true, message: "Monstro criado com sucesso!" };
    },

    updateMonster: async (monsterId, updates) => {
        const { error } = await supabase
            .from('library_monsters')
            .update(updates)
            .eq('id', monsterId)
            .eq('owner_id', get().currentUser?.id); // Only owner can update

        if (error) return { success: false, message: `Falha ao atualizar monstro: ${error.message}` };
        return { success: true, message: "Monstro atualizado com sucesso!" };
    },

    deleteMonster: async (monsterId) => {
        const { error } = await supabase
            .from('library_monsters')
            .delete()
            .eq('id', monsterId)
            .eq('owner_id', get().currentUser?.id); // Only owner can delete

        if (error) return { success: false, message: `Falha ao deletar monstro: ${error.message}` };
        return { success: true, message: "Monstro deletado com sucesso!" };
    },

    fetchItems: async (mesaId: string) => {
        // Fetch official (owner_id is null) and user-owned items
        const { data: officialItems, error: officialError } = await supabase
            .from('library_items')
            .select('*')
            .is('owner_id', null);

        const { data: userItems, error: userError } = await supabase
            .from('library_items')
            .select('*')
            .eq('owner_id', get().currentUser?.id);

        if (officialError || userError) {
            console.error("Error fetching items:", officialError || userError);
            return;
        }

        const allItems = [...(officialItems || []), ...(userItems || [])];
        set({ items: allItems });
    },

    createItem: async (item) => {
        const { error } = await supabase
            .from('library_items')
            .insert({ 
                name: item.name,
                description: item.description,
                category: item.category,
                image_url: item.image_url,
                roll_type: item.roll_type,
                roll_data: item.roll_data,
                stats: item.stats,
                is_public: item.is_public,
                owner_id: get().currentUser?.id 
            });
        
        if (error) return { success: false, message: `Falha ao criar item: ${error.message}` };
        return { success: true, message: "Item criado com sucesso!" };
    },

    updateItem: async (itemId, updates) => {
        const { error } = await supabase
            .from('library_items')
            .update(updates)
            .eq('id', itemId)
            .eq('owner_id', get().currentUser?.id); // Only owner can update

        if (error) return { success: false, message: `Falha ao atualizar item: ${error.message}` };
        return { success: true, message: "Item atualizado com sucesso!" };
    },

    deleteItem: async (itemId) => {
        const { error } = await supabase
            .from('library_items')
            .delete()
            .eq('id', itemId)
            .eq('owner_id', get().currentUser?.id); // Only owner can delete

        if (error) return { success: false, message: `Falha ao deletar item: ${error.message}` };
        return { success: true, message: "Item deletado com sucesso!" };
    },
});
