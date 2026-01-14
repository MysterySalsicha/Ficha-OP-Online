import React from 'react';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { Play, SkipForward, XSquare, Swords } from 'lucide-react';

export const InitiativeTracker: React.FC = () => {
    const { currentMesa, allCharacters, startCombat, nextTurn, endCombat } = useGameStore();
    const { user } = useAuth();
    
    if (!currentMesa) return null;
    
    const isGM = currentMesa.gm_id === user?.id;
    const isCombat = currentMesa.combat_active;

    // Se não estiver em combate, mostra apenas o botão de iniciar (para o GM)
    if (!isCombat) {
        if (!isGM) return null;
        return (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
                <button 
                    onClick={() => startCombat()}
                    className="flex items-center gap-2 bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-b-lg shadow-xl font-bold uppercase text-xs border-x border-b border-red-700 transition-all hover:pt-4"
                >
                    <Swords className="w-4 h-4" /> Iniciar Combate
                </button>
            </div>
        );
    }

    // Ordenar personagens conforme a ordem do turno salva no banco
    // O banco salva um array de { character_id, initiative }
    const turnOrder = currentMesa.turn_order || [];
    const currentIndex = currentMesa.current_turn_index || 0;

    return (
        <div className="absolute top-14 left-0 w-full z-20 flex flex-col items-center pointer-events-none">
            {/* Barra de Iniciativa */}
            <div className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-2 rounded-b-xl shadow-2xl flex items-center gap-4 pointer-events-auto min-w-[300px] justify-center">
                
                <div className="flex items-center gap-2 overflow-x-auto max-w-2xl px-2 no-scrollbar">
                    {turnOrder.map((turn: any, idx: number) => {
                        const char = allCharacters.find(c => c.id === turn.character_id);
                        const isActive = idx === currentIndex;
                        if (!char) return null;

                        return (
                            <div 
                                key={char.id} 
                                className={`
                                    relative flex flex-col items-center transition-all duration-300
                                    ${isActive ? 'scale-110 mx-2' : 'opacity-60 scale-90'}
                                `}
                            >
                                <div className={`
                                    w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden bg-zinc-800
                                    ${isActive ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'border-zinc-600'}
                                `}>
                                    <span className="text-xs font-black text-zinc-300 uppercase">
                                        {char.name.substring(0, 2)}
                                    </span>
                                </div>
                                {isActive && (
                                    <span className="absolute -bottom-4 text-[9px] font-bold text-yellow-500 bg-black/80 px-1 rounded uppercase tracking-tighter whitespace-nowrap">
                                        Vez de {char.name.split(' ')[0]}
                                    </span>
                                )}
                                <span className="absolute -top-2 right-0 bg-zinc-800 text-[8px] text-zinc-400 px-1 rounded border border-zinc-700">
                                    {turn.initiative}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Controles do Mestre */}
                {isGM && (
                    <div className="flex gap-1 ml-4 border-l border-zinc-700 pl-4">
                        <button 
                            onClick={() => nextTurn()}
                            className="p-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg shadow transition-colors"
                            title="Próximo Turno"
                        >
                            <SkipForward className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => endCombat()}
                            className="p-2 bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-white rounded-lg transition-colors"
                            title="Encerrar Combate"
                        >
                            <XSquare className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                {/* Contador de Rodadas */}
                <div className="flex flex-col items-center ml-2">
                    <span className="text-[8px] uppercase text-zinc-500 font-bold">Rodada</span>
                    <span className="text-lg font-black text-zinc-200 leading-none">{currentMesa.round_count || 1}</span>
                </div>
            </div>
        </div>
    );
};
