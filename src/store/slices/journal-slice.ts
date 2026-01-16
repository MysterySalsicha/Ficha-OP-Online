import { StateCreator } from 'zustand';
import { GameState } from '../game-store';
import { ActionResult, JournalEntry } from '../../core/types';
import { supabase } from '../../lib/supabase';

export interface JournalSlice {
    journalEntries: JournalEntry[];
    fetchJournalEntries: (mesaId: string, userId: string) => Promise<void>;
    createJournalEntry: (entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<ActionResult>;
    updateJournalEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<ActionResult>;
    deleteJournalEntry: (entryId: string) => Promise<ActionResult>;
}

export const createJournalSlice: StateCreator<GameState, [], [], JournalSlice> = (set, get) => ({
    journalEntries: [],

    fetchJournalEntries: async (mesaId: string, userId: string) => {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('mesa_id', mesaId)
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Error fetching journal entries:", error);
            return;
        }
        set({ journalEntries: data || [] });
    },

    createJournalEntry: async (entry) => {
        const { error } = await supabase
            .from('journal_entries')
            .insert(entry);
        
        if (error) return { success: false, message: `Falha ao criar entrada: ${error.message}` };
        
        // Refresh entries after creation
        if (get().currentMesa && get().currentUser) {
            get().fetchJournalEntries(get().currentMesa!.id, get().currentUser!.id);
        }
        return { success: true, message: "Entrada criada com sucesso!" };
    },

    updateJournalEntry: async (entryId, updates) => {
        const { error } = await supabase
            .from('journal_entries')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', entryId)
            .eq('user_id', get().currentUser?.id); // Only owner can update

        if (error) return { success: false, message: `Falha ao atualizar entrada: ${error.message}` };
        
        // Refresh entries after update
        if (get().currentMesa && get().currentUser) {
            get().fetchJournalEntries(get().currentMesa!.id, get().currentUser!.id);
        }
        return { success: true, message: "Entrada atualizada com sucesso!" };
    },

    deleteJournalEntry: async (entryId) => {
        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', entryId)
            .eq('user_id', get().currentUser?.id); // Only owner can delete

        if (error) return { success: false, message: `Falha ao deletar entrada: ${error.message}` };
        
        // Refresh entries after deletion
        if (get().currentMesa && get().currentUser) {
            get().fetchJournalEntries(get().currentMesa!.id, get().currentUser!.id);
        }
        return { success: true, message: "Entrada deletada com sucesso!" };
    },
});
