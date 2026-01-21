import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { Character, Mesa, User, InventoryItem, ItemTemplate, PlayerMesaStatus } from '../core/types';

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
    availableCharacters: Character[];
    items: ItemTemplate[]; // Corrected type to ItemTemplate[]
    messages: any[];
    isLoading: boolean;
    needsCharacterCreation: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'banned' | 'none';
    playerRole: 'player' | 'gm' | 'co-gm' | 'none';
    visualMode: 'horizontal' | 'vertical'; // Added visualMode
    isGM: boolean;

    // Core lifecycle methods
    initialize: (user: User, mesaId: string) => Promise<void>;
    fetchUserMesas: (userId: string) => Promise<Mesa[]>;
    subscribeToChanges: (mesaId: string) => void;
    unsubscribe: () => void;
    setVisualMode: (mode: 'horizontal' | 'vertical') => void;
    sendMessage: (mesaId: string, userId: string, type: 'text' | 'roll' | 'system', content: string | object) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    revealRollMessage: (messageId: string) => Promise<void>;
    editingCharacterId: string | null;
    setEditingCharacterId: (id: string | null) => void;
    updateCharacterStats: (characterId: string, stats: Partial<Character['stats_current']>) => Promise<void>;
    joinMesa: (code: string, userId: string) => Promise<void>;
    currentUserPlayer: PlayerMesaStatus | null;
};

const coreSlice: StateCreator<GameState, [], [], Omit<GameState, keyof (CharacterSlice & CombatSlice & UtilitySlice & WorldSlice & LibrarySlice & JournalSlice)>> = (set, get) => ({ // Added JournalSlice
    // Initial State
    currentUser: null,
    currentMesa: null,
    currentMesaId: null, // Initial current Mesa ID
    character: null,
    allCharacters: [],
    availableCharacters: [],
    items: [],
    messages: [],
    isLoading: false,
    needsCharacterCreation: false,
    approvalStatus: 'none',
    playerRole: 'none',
    visualMode: 'horizontal', // Initial visual mode
    isGM: false,
    editingCharacterId: null, // New state for tracking which character is being edited
    currentUserPlayer: null,

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
            // Primeiramente, vamos garantir que a mesa e o status do jogador sejam carregados
            // e que o currentUserPlayer esteja definido.
            // Para isso, faremos um fetch direto da mesa, pois joinMesa usa 'code'
            const { data: mesaData, error: mesaError } = await supabase
                .from('mesas')
                .select('*')
                .eq('id', mesaId)
                .single();

            if (mesaError || !mesaData) throw new Error("Mesa não encontrada ou acesso negado.");

            // Agora chamamos joinMesa para garantir que o currentUserPlayer esteja atualizado
            // e que o estado seja preenchido corretamente
            await get().joinMesa(mesaData.code, user.id); // joinMesa atualizará currentMesa e currentUserPlayer

            const { currentMesa, currentUserPlayer } = get(); // Obter estado atualizado após joinMesa

            if (!currentMesa) throw new Error("Mesa não carregada após joinMesa.");

            // Definir isGM e approvalStatus baseado no currentUserPlayer
            const isGM = currentMesa.mestre_id === user.id || currentUserPlayer?.role === 'gm' || currentUserPlayer?.role === 'co-gm';
            const approvalStatus = currentUserPlayer?.status || 'none';
            const playerRole = currentUserPlayer?.role || 'none';

            set({ isGM, approvalStatus, playerRole });

            // Continuar carregando outros dados da mesa
            const { data: allChars } = await supabase.from('characters').select('*').eq('mesa_id', mesaId);
            const myChar = allChars?.find(c => c.user_id === user.id) || null;
            
            const { data: messages } = await supabase.from('messages').select('*').eq('mesa_id', mesaId).order('created_at');

            if (!myChar && !isGM) {
                set({ needsCharacterCreation: true });
            }

            set({
                currentMesa: { ...currentMesa, jogadores: (currentMesa as any).mesa_players || [] }, // Atualizar mesa com jogadores
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

    setEditingCharacterId: (id: string | null) => {
        set({ editingCharacterId: id });
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

        // Adicionar listener para mesa_players
        supabase.channel(`mesa_players-changes:${mesaId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mesa_players', filter: `mesa_id=eq.${mesaId}` }, (payload) => {
                const updatedPlayer = payload.new as PlayerMesaStatus;
                if (updatedPlayer.user_id === get().currentUser?.id) {
                    set({ currentUserPlayer: updatedPlayer });
                }
            }).subscribe();

    },

    unsubscribe: () => {
        supabase.removeAllChannels();
    },

    sendMessage: async (mesaId, userId, type, content) => {
        await supabase.from('messages').insert({
            mesa_id: mesaId,
            user_id: userId,
            type: type,
            content: content
        });
    },

    deleteMessage: async (messageId) => {
        await supabase.from('messages').delete().eq('id', messageId);
    },

    revealRollMessage: async (messageId) => {
        try {
            const { data: message, error: fetchError } = await supabase
                .from('messages')
                .select('content')
                .eq('id', messageId)
                .single();

            if (fetchError || !message) {
                console.error("Erro ao buscar mensagem para revelar:", fetchError?.message || "Mensagem não encontrada.");
                return;
            }

            const oldContent = message.content as { is_hidden?: boolean };
            const newContent = { ...oldContent, is_hidden: false };

            const { error: updateError } = await supabase
                .from('messages')
                .update({ content: newContent })
                .eq('id', messageId);

            if (updateError) {
                console.error("Erro ao revelar rolagem:", updateError.message);
            } else {
                console.log(`Rolagem ${messageId} revelada com sucesso.`);
            }
        } catch (error) {
            console.error("Erro inesperado ao revelar rolagem:", error);
        }
    },

    updateCharacterStats: async (characterId, stats) => {
        try {
            // Fetch current stats_current to merge
            const { data: currentCharacter, error: fetchError } = await supabase
                .from('characters')
                .select('stats_current')
                .eq('id', characterId)
                .single();

            if (fetchError || !currentCharacter) {
                console.error("Erro ao buscar stats do personagem para atualização:", fetchError?.message || "Personagem não encontrado.");
                return;
            }

            const mergedStats = {
                ...currentCharacter.stats_current,
                ...stats,
            };

            const { error: updateError } = await supabase
                .from('characters')
                .update({ stats_current: mergedStats })
                .eq('id', characterId);

            if (updateError) {
                console.error("Erro ao atualizar stats do personagem:", updateError.message);
            } else {
                console.log(`Stats do personagem ${characterId} atualizados com sucesso.`);
            }
        } catch (error) {
            console.error("Erro inesperado ao atualizar stats do personagem:", error);
        }
    },

    joinMesa: async (code, userId) => {
        set({ isLoading: true, error: null });
        try {
            // 1. Buscar Mesa pelo Código
            const { data: mesa, error: mesaError } = await supabase
                .from('mesas')
                .select('*')
                .eq('code', code)
                .single();

            if (mesaError) throw mesaError;

            // 2. CRÍTICO: Buscar o Player Atual (Você) nesta mesa
            const { data: player, error: playerError } = await supabase
                .from('mesa_players')
                .select('mesa_id, user_id, status, role') // Selecionar apenas os campos necessários
                .eq('mesa_id', mesa.id)
                .eq('user_id', userId)
                .maybeSingle(); // maybeSingle evita erro se não existir (ainda)

            if (playerError) {
                console.error("Erro ao buscar player na mesa:", playerError);
            }

            // 3. Atualizar Estado
            set({ 
                currentMesa: mesa, 
                currentUserPlayer: player || null, // Se player for null, a UI vai mostrar o Wizard/Seleção
                isLoading: false,
                currentMesaId: mesa.id, // Atualizar currentMesaId também
                // No caso do joinMesa, não sabemos ainda se é GM ou não.
                // O initialize que realmente vai setar isGM e approvalStatus.
                // Por isso, aqui não setamos approvalStatus nem isGM.
            });

            // Após entrar na mesa, talvez precise re-inicializar
            // ou ao menos chamar o subscribeToChanges
            get().subscribeToChanges(mesa.id);

        } catch (error: any) {
            console.error("Erro ao entrar na mesa:", error);
            set({ error: error.message, isLoading: false });
        }
    },
});

const initializer: StateCreator<GameState> = (...a) => ({
    ...coreSlice(...a),
    ...createCharacterSlice(...a),
    ...createCombatSlice(...a),
    ...createUtilitySlice(...a),
    ...createWorldSlice(...a),
    ...createLibrarySlice(...a),
    ...createJournalSlice(...a), // Added JournalSlice
});

export const useGameStore = create<GameState>()(
  persist(
    initializer,
    {
      name: 'game-storage', // Nome para o storage
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // Dummy storage para o servidor não quebrar
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      skipHydration: true,
    } as PersistOptions<GameState>
  )
);