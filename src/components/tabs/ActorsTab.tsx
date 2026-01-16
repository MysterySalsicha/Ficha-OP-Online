import React, { useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { User, Shield, Heart, Zap, ChevronsRight, Plus, X, Check, Loader2, Link } from 'lucide-react';
import { Character, ClassName, AttributeName } from '../../core/types';
import { OpButton } from '../ui-op/OpButton';
import { OpInput } from '../ui-op/OpInput';
import { useToast } from '../ui-op/OpToast';
import { supabase } from '../../lib/supabase';

const CharacterListItem: React.FC<{char: Character, isGM: boolean, onLink: (char: Character) => void}> = ({ char, isGM, onLink }) => (
    <li className="p-3 flex items-center gap-4 transition-colors hover:bg-zinc-800/50">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center cursor-pointer">
            {/* Placeholder for avatar */}
            <User className="w-6 h-6 text-zinc-500" />
        </div>
        <div className="flex-1 cursor-pointer">
            <p className="font-bold">{char.name}</p>
            <div className="flex gap-3 text-xs text-zinc-400 mt-1">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500"/>{char.stats_current.pv}</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500"/>{char.stats_current.pe}</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500"/>{char.stats_current.san}</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
             {isGM && (
                <button onClick={() => onLink(char)} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Vincular a Jogador">
                    <Link className="w-4 h-4" />
                </button>
            )}
            <ChevronsRight className="w-5 h-5 text-zinc-600 cursor-pointer" />
        </div>
    </li>
);

export const ActorsTab: React.FC = () => {
    const { allCharacters, playerRole, createCharacter, assignCharacterToUser, currentMesa, currentUser } = useGameStore(state => ({
        allCharacters: state.allCharacters,
        playerRole: state.playerRole,
        createCharacter: state.createCharacter,
        assignCharacterToUser: state.assignCharacterToUser,
        currentMesa: state.currentMesa,
        currentUser: state.currentUser
    }));
    const { showToast } = useToast();
    const [filter, setFilter] = useState('');
    const [isCreatingActor, setIsCreatingActor] = useState(false);
    const [newActorName, setNewActorName] = useState('');
    const [newActorType, setNewActorType] = useState<'player' | 'npc'>('player');
    const [loadingCreation, setLoadingCreation] = useState(false);

    // Link State
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [charToLink, setCharToLink] = useState<Character | null>(null);
    const [linkUserId, setLinkUserId] = useState('');
    const [loadingLink, setLoadingLink] = useState(false);

    const playerCharacters = allCharacters.filter(c => c.type === 'player' && c.name.toLowerCase().includes(filter.toLowerCase()));
    const npcs = allCharacters.filter(c => c.type === 'npc' && c.name.toLowerCase().includes(filter.toLowerCase()));

    const isGM = playerRole === 'gm' || playerRole === 'co-gm';

    const handleCreateActor = async () => {
        if (!newActorName.trim() || !currentMesa || !currentUser) return;

        setLoadingCreation(true);
        const defaultAttributes: Record<AttributeName, number> = { agi: 1, for: 1, int: 1, pre: 1, vig: 1 };
        const defaultClass: ClassName = newActorType === 'player' ? 'combatente' : 'mundano'; // Default to mundano for NPC
        
        try {
            const result = await createCharacter({
                name: newActorName,
                isSurvivor: false, // Default
                origin: 'Desconhecida', // Default
                class: defaultClass,
                attributes: defaultAttributes,
                // Assign to GM initially, can be linked later
                ownerId: currentUser.id
            });

            if (result.success) {
                showToast("Ator criado com sucesso!", "success");
                setIsCreatingActor(false);
                setNewActorName('');
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Erro inesperado ao criar ator:", error);
            showToast("Erro inesperado ao criar ator.", "error");
        } finally {
            setLoadingCreation(false);
        }
    };

    const openLinkModal = (char: Character) => {
        setCharToLink(char);
        setLinkUserId(char.user_id || '');
        setIsLinkModalOpen(true);
    };

    const handleLinkUser = async () => {
        if (!charToLink || !linkUserId.trim()) return;
        setLoadingLink(true);
        try {
            const result = await assignCharacterToUser(charToLink.id, linkUserId);
            if (result.success) {
                showToast(result.message, "success");
                setIsLinkModalOpen(false);
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
             showToast("Erro ao vincular.", "error");
        } finally {
            setLoadingLink(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900 text-white">
            <div className="p-3 border-b border-op-border">
                <input
                    type="text"
                    placeholder="Filtrar atores..."
                    className="w-full bg-black/40 border border-zinc-700 rounded p-2 text-sm outline-none focus:border-op-red"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="p-2 text-xs text-zinc-400 uppercase font-bold bg-zinc-950/50">Jogadores ({playerCharacters.length})</div>
                <ul className="divide-y divide-zinc-800">
                    {playerCharacters.map(char => <CharacterListItem key={char.id} char={char} isGM={isGM} onLink={openLinkModal} />)}
                </ul>

                <div className="p-2 mt-2 text-xs text-zinc-400 uppercase font-bold bg-zinc-950/50">NPCs ({npcs.length})</div>
                 <ul className="divide-y divide-zinc-800">
                    {npcs.map(char => <CharacterListItem key={char.id} char={char} isGM={isGM} onLink={openLinkModal} />)}
                </ul>
            </div>
            
            {isGM && (
                <div className="p-3 border-t border-op-border bg-zinc-950/70">
                    <OpButton className="w-full" onClick={() => setIsCreatingActor(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Criar Novo Ator
                    </OpButton>
                </div>
            )}

            {/* Modal de Vinculação */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative">
                        <h3 className="text-lg font-bold text-op-red mb-4 font-typewriter uppercase">Vincular a Jogador</h3>
                        <p className="text-xs text-zinc-400 mb-4">Insira o ID do Usuário para vincular este personagem.</p>

                        <div className="space-y-4">
                            <OpInput
                                label="ID do Usuário"
                                placeholder="UUID do usuário..."
                                value={linkUserId}
                                onChange={(e) => setLinkUserId(e.target.value)}
                                autoFocus
                            />

                            <div className="flex gap-2 pt-2">
                                <OpButton variant="ghost" onClick={() => setIsLinkModalOpen(false)} className="flex-1" disabled={loadingLink}>
                                    <X className="w-4 h-4 mr-2" /> Cancelar
                                </OpButton>
                                <OpButton onClick={handleLinkUser} className="flex-1" disabled={loadingLink || !linkUserId.trim()}>
                                    {loadingLink ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link className="w-4 h-4 mr-2" />}
                                    Vincular
                                </OpButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Criação de Ator */}
            {isCreatingActor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-op-red mb-4 font-typewriter uppercase">Novo Ator</h3>
                        
                        <div className="space-y-4">
                            <OpInput 
                                label="Nome do Ator" 
                                placeholder="Ex: Zé do Caixão" 
                                value={newActorName} 
                                onChange={(e) => setNewActorName(e.target.value)}
                                autoFocus
                            />
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tipo</label>
                                <select 
                                    className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none"
                                    value={newActorType}
                                    onChange={(e) => setNewActorType(e.target.value as 'player' | 'npc')}
                                >
                                    <option value="player">Jogador</option>
                                    <option value="npc">NPC</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <OpButton variant="ghost" onClick={() => setIsCreatingActor(false)} className="flex-1" disabled={loadingCreation}>
                                    <X className="w-4 h-4 mr-2" /> Cancelar
                                </OpButton>
                                <OpButton onClick={handleCreateActor} className="flex-1" disabled={loadingCreation || !newActorName.trim()}>
                                    {loadingCreation ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Criar
                                </OpButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};