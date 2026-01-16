import React, { useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { User, Shield, Heart, Zap, ChevronsRight } from 'lucide-react';
import { Character } from '../../core/types';

const CharacterListItem: React.FC<{char: Character}> = ({ char }) => (
    <li className="p-3 flex items-center gap-4 transition-colors hover:bg-zinc-800/50 cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
            {/* Placeholder for avatar */}
            <User className="w-6 h-6 text-zinc-500" />
        </div>
        <div className="flex-1">
            <p className="font-bold">{char.name}</p>
            <div className="flex gap-3 text-xs text-zinc-400 mt-1">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500"/>{char.stats_current.pv}</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500"/>{char.stats_current.pe}</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500"/>{char.stats_current.san}</span>
            </div>
        </div>
        <ChevronsRight className="w-5 h-5 text-zinc-600" />
    </li>
);

export const ActorsTab: React.FC = () => {
    const { allCharacters, playerRole } = useGameStore(state => ({
        allCharacters: state.allCharacters,
        playerRole: state.playerRole
    }));
    const [filter, setFilter] = useState('');

    const playerCharacters = allCharacters.filter(c => c.type === 'player' && c.name.toLowerCase().includes(filter.toLowerCase()));
    const npcs = allCharacters.filter(c => c.type === 'npc' && c.name.toLowerCase().includes(filter.toLowerCase()));

    const isGM = playerRole === 'gm' || playerRole === 'co-gm';

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
                    {playerCharacters.map(char => <CharacterListItem key={char.id} char={char} />)}
                </ul>

                <div className="p-2 mt-2 text-xs text-zinc-400 uppercase font-bold bg-zinc-950/50">NPCs ({npcs.length})</div>
                 <ul className="divide-y divide-zinc-800">
                    {npcs.map(char => <CharacterListItem key={char.id} char={char} />)}
                </ul>
            </div>
            
            {isGM && (
                <div className="p-3 border-t border-op-border bg-zinc-950/70">
                    <button className="w-full p-2 text-sm text-center bg-op-green/20 text-op-green border border-op-green/30 rounded hover:bg-op-green/30">
                        Criar Novo Ator
                    </button>
                </div>
            )}
        </div>
    );
};
