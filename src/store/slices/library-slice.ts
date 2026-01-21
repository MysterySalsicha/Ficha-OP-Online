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
        const userId = get().currentUser?.id;
        if (!userId) {
            console.error("User not found to fetch monsters");
            return;
        };

        const { data, error } = await supabase
            .from('library_creatures')
            .select('*')
            .or(`owner_id.eq.${userId},is_public.eq.true,owner_id.is.null`);

        if (error) {
            console.error("Error fetching monsters:", error);
            return;
        }

        set({ monsters: data || [] });
    },

    createMonster: async (monster) => {
        const { error } = await supabase
            .from('library_creatures')
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
            .from('library_creatures')
            .update(updates)
            .eq('id', monsterId)
            .eq('owner_id', get().currentUser?.id); // Only owner can update

        if (error) return { success: false, message: `Falha ao atualizar monstro: ${error.message}` };
        return { success: true, message: "Monstro atualizado com sucesso!" };
    },

    deleteMonster: async (monsterId) => {
        const { error } = await supabase
            .from('library_creatures')
            .delete()
            .eq('id', monsterId)
            .eq('owner_id', get().currentUser?.id); // Only owner can delete

        if (error) return { success: false, message: `Falha ao deletar monstro: ${error.message}` };
        return { success: true, message: "Monstro deletado com sucesso!" };
    },

    fetchItems: async (mesaId: string) => {
        const userId = get().currentUser?.id;
        if (!userId) {
            console.error("User not found to fetch items");
            return;
        }

        const { data, error } = await supabase
            .from('library_items')
            .select('*')
            .or(`owner_id.eq.${userId},is_public.eq.true,owner_id.is.null`);

        if (error) {
            console.error("Error fetching items:", error);
            return;
        }

        set({ items: data || [] });
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
