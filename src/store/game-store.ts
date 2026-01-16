import { create, StateCreator } from 'zustand';
import { supabase } from '../lib/supabase';
import { Character, Mesa, User, Item } from '../core/types';

import { CharacterSlice, createCharacterSlice } from './slices/character-slice';
import { CombatSlice, createCombatSlice } from './slices/combat-slice';
import { UtilitySlice, createUtilitySlice } from './slices/utility-slice';
import { WorldSlice, createWorldSlice } from './slices/world-slice';
import { recalculateCharacter } from '../engine/calculator';

// --- MAIN STATE & CORE LOGIC ---

export type GameState = CharacterSlice & CombatSlice & UtilitySlice & WorldSlice & {
    // Core state properties
    currentUser: User | null;
    currentMesa: Mesa | null;
    character: Character | null;
    allCharacters: Character[];
    items: Item[];
    logs: any[];
    isLoading: boolean;
    needsCharacterCreation: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'banned' | 'none';
    playerRole: 'player' | 'gm' | 'co-gm' | 'none';

    // Core lifecycle methods
    initialize: (user: User, mesaId: string) => Promise<void>;
    subscribeToChanges: (mesaId: string) => void;
    unsubscribe: () => void;
};

const coreSlice: StateCreator<GameState, [], [], Omit<GameState, keyof (CharacterSlice & CombatSlice & UtilitySlice & WorldSlice)>> = (set, get) => ({
    // Initial State
    currentUser: null,
    currentMesa: null,
    character: null,
    allCharacters: [],
    items: [],
    logs: [],
    isLoading: false,
    needsCharacterCreation: false,
    approvalStatus: 'none',
    playerRole: 'none',

    // --- INITIALIZATION & SUBSCRIPTIONS ---
    initialize: async (user, mesaId) => {
        set({ isLoading: true, currentUser: user, needsCharacterCreation: false, approvalStatus: 'none', playerRole: 'none' });
        try {
            const { data: playerStatus } = await supabase.from('mesa_players').select('status, role').eq('mesa_id', mesaId).eq('user_id', user.id).maybeSingle();
            
            if (!playerStatus) {
                await supabase.from('mesa_players').insert({ mesa_id: mesaId, user_id: user.id, status: 'pending' });
                set({ approvalStatus: 'pending', isLoading: false }); return;
            }
            if (playerStatus.status !== 'approved') {
                set({ approvalStatus: playerStatus.status as any, isLoading: false }); return;
            }
            set({ approvalStatus: 'approved', playerRole: playerStatus.role as any });

            const { data: mesa, error: mesaError } = await supabase.from('mesas').select('*').eq('id', mesaId).single();
            if (mesaError || !mesa) throw new Error("Mesa não encontrada ou acesso negado.");
            set({ currentMesa: mesa });

            const { data: allChars } = await supabase.from('characters').select('*').eq('mesa_id', mesaId);
            const myChar = allChars?.find(c => c.user_id === user.id) || null;
            
            const isGM = mesa.mestre_id === user.id || playerStatus.role === 'gm' || playerStatus.role === 'co-gm';
            if (!myChar && !isGM) {
                set({ needsCharacterCreation: true, isLoading: false }); return;
            }

            const { data: items } = myChar ? await supabase.from('items').select('*').eq('character_id', myChar.id) : { data: [] };
            
            set({
                character: myChar ? recalculateCharacter(myChar as Character, items || []) : null,
                items: items || [],
                allCharacters: (allChars as Character[]) || [],
            });

            get().subscribeToChanges(mesaId);
        } catch (error) {
            console.error("Erro na Inicialização:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    subscribeToChanges: (mesaId) => {
        const characterChannel = supabase.channel(`db-characters:${mesaId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `mesa_id=eq.${mesaId}` }, payload => {
                 console.log('Character change received!', payload);
                 // Simple refetch for now
                 get().initialize(get().currentUser!, mesaId);
            }).subscribe();
            
        const itemsChannel = supabase.channel(`db-items:${mesaId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, payload => {
                 console.log('Item change received!', payload);
                 // Simple refetch for now
                 get().initialize(get().currentUser!, mesaId);
            }).subscribe();
    },

    unsubscribe: () => {
        supabase.removeAllChannels();
    },
});

// --- COMBINED STORE ---

export const useGameStore = create<GameState>()((...a) => ({
    ...coreSlice(...a),
    ...createCharacterSlice(...a),
    ...createCombatSlice(...a),
    ...createUtilitySlice(...a),
    ...createWorldSlice(...a),
}));
