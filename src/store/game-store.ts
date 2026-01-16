import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { Character, Mesa, User, InventoryItem, ItemTemplate } from '../core/types';

import { CharacterSlice, createCharacterSlice } from './slices/character-slice';
import { CombatSlice, createCombatSlice } from './slices/combat-slice';
import { UtilitySlice, createUtilitySlice } from './slices/utility-slice';
import { WorldSlice, createWorldSlice } from './slices/world-slice';
import { LibrarySlice, createLibrarySlice } from './slices/library-slice';
import { JournalSlice, createJournalSlice } from './slices/journal-slice'; // Added JournalSlice
import { recalculateCharacter } from '../engine/calculator';

// --- MAIN STATE & CORE LOGIC ---

export type GameState = CharacterSlice & CombatSlice & UtilitySlice & WorldSlice & LibrarySlice & JournalSlice & { // Added JournalSlice
// Temporary comment to force re-evaluation
    // Core state properties
    currentUser: User | null;
    currentMesa: Mesa | null;
    character: Character | null;
    currentMesaId: string | null; // Track current Mesa ID to pass to slices init
    allCharacters: Character[];
    items: ItemTemplate[]; // Corrected type to ItemTemplate[]
    messages: any[];
    isLoading: boolean;
    needsCharacterCreation: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'banned' | 'none';
    playerRole: 'player' | 'gm' | 'co-gm' | 'none';
    visualMode: 'horizontal' | 'vertical'; // Added visualMode

    // Core lifecycle methods
    initialize: (user: User, mesaId: string) => Promise<void>;
    fetchUserMesas: (userId: string) => Promise<Mesa[]>;
    subscribeToChanges: (mesaId: string) => void;
    unsubscribe: () => void;
    setVisualMode: (mode: 'horizontal' | 'vertical') => void;
};

const coreSlice: StateCreator<GameState, [], [], Omit<GameState, keyof (CharacterSlice & CombatSlice & UtilitySlice & WorldSlice & LibrarySlice & JournalSlice)>> = (set, get) => ({ // Added JournalSlice
    // Initial State
    currentUser: null,
    currentMesa: null,
    currentMesaId: null, // Initial current Mesa ID
    character: null,
    allCharacters: [],
    items: [],
    messages: [],
    isLoading: false,
    needsCharacterCreation: false,
    approvalStatus: 'none',
    playerRole: 'none',
    visualMode: 'horizontal', // Initial visual mode

    // --- INITIALIZATION & SUBSCRIPTIONS ---
    initialize: async (user, mesaId) => {
        // If already initialized for this mesa and user, simply ensure subscriptions are active and return
        // This prevents unnecessary re-fetching when component re-renders or tab regains focus
        if (get().currentMesa?.id === mesaId && get().currentUser?.id === user.id) {
            get().subscribeToChanges(mesaId); // Ensure subscriptions are active
            return;
        }

        set({ isLoading: true, currentUser: user, needsCharacterCreation: false, approvalStatus: 'none', playerRole: 'none', currentMesaId: mesaId }); // Set currentMesaId
        
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
            
            const { data: allChars } = await supabase.from('characters').select('*').eq('mesa_id', mesaId);
            const myChar = allChars?.find(c => c.user_id === user.id) || null;
            
            const { data: messages } = await supabase.from('messages').select('*').eq('mesa_id', mesaId).order('created_at');

            const isGM = mesa.mestre_id === user.id || playerStatus.role === 'gm' || playerStatus.role === 'co-gm';
            if (!myChar && !isGM) {
                set({ needsCharacterCreation: true });
            }

            set({
                currentMesa: mesa,
                character: myChar ? recalculateCharacter(myChar as Character, myChar.inventory || []) : null,
                allCharacters: (allChars?.map(c => recalculateCharacter(c, c.inventory || [])) as Character[]) || [],
                messages: messages || [],
            });

            // Always subscribe after a successful (re)initialization
            get().subscribeToChanges(mesaId);
            // Fetch library data for the current mesa/user
            get().fetchMonsters(mesaId);
            get().fetchItems(mesaId);
            get().fetchJournalEntries(mesaId, user.id);
        } catch (error) {
            console.error("Erro na Inicialização:", error);
        } finally {
            set({ isLoading: false });
        }
    },
    
    fetchUserMesas: async (userId: string) => {
        const { data: gmMesas, error: gmMesasError } = await supabase.from('mesas').select('*').eq('mestre_id', userId);
        if (gmMesasError) return [];
        const { data: playerMesaLinks, error: playerLinksError } = await supabase.from('mesa_players').select('mesa_id').eq('user_id', userId);
        if (playerLinksError) return gmMesas || [];
        const playerMesaIds = playerMesaLinks.map(link => link.mesa_id);
        const { data: playerMesas, error: playerMesasError } = await supabase.from('mesas').select('*').in('id', playerMesaIds);
        if (playerMesasError) return gmMesas || [];
        const allMesas = [...(gmMesas || []), ...(playerMesas || [])];
        return Array.from(new Map(allMesas.map(mesa => [mesa.id, mesa])).values());
    },

    setVisualMode: (mode: 'horizontal' | 'vertical') => {
        set({ visualMode: mode });
    },

    subscribeToChanges: (mesaId) => {
        const handleCharacterChange = (payload: any) => {
            const newChar = recalculateCharacter(payload.new, payload.new.inventory || []) as Character;
            const currentChars = get().allCharacters;
            const charIndex = currentChars.findIndex(c => c.id === newChar.id);
            let newChars = [...currentChars];
            if (charIndex !== -1) {
                newChars[charIndex] = newChar;
            } else {
                newChars.push(newChar);
            }
            const myChar = get().currentUser ? newChars.find(c => c.user_id === get().currentUser!.id) : null;
            set({ allCharacters: newChars, character: myChar });
        };

        const channels = supabase.getChannels();
        if (channels.some(c => c.topic === `realtime:public:characters:mesa_id=eq.${mesaId}`)) {
            return; // Already subscribed
        }

        supabase.channel(`characters-changes:${mesaId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `mesa_id=eq.${mesaId}` }, handleCharacterChange)
            .subscribe();
            
        supabase.channel(`mesas-changes:${mesaId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mesas', filter: `id=eq.${mesaId}` }, (payload) => {
                 set({ currentMesa: payload.new as Mesa });
            }).subscribe();

        supabase.channel(`messages-changes:${mesaId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `mesa_id=eq.${mesaId}` }, (payload) => {
                 set(state => ({ messages: [...state.messages, payload.new] }));
            }).subscribe();
    },

    unsubscribe: () => {
        supabase.removeAllChannels();
    },
});

export const useGameStore = create<GameState>()(
    persist(
        (...a) => ({
            ...coreSlice(...a),
            ...createCharacterSlice(...a),
            ...createCombatSlice(...a),
            ...createUtilitySlice(...a),
            ...createWorldSlice(...a),
            ...createLibrarySlice(...a),
            ...createJournalSlice(...a), // Added JournalSlice
        }),
        {
            name: 'game-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                currentUser: state.currentUser,
                currentMesa: state.currentMesa,
                character: state.character,
                currentMesaId: state.currentMesaId,
                playerRole: state.playerRole,
                visualMode: state.visualMode,
            }),
        }
    )
);