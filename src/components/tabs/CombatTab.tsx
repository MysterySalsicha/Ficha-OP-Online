import React from 'react';
import { useGameStore } from '../../store/game-store';
import { OpButton } from '../ui-op/OpButton';
import { Swords, Shield, Heart, Zap } from 'lucide-react';

export const CombatTab: React.FC = () => {
    const { 
        currentMesa, 
        allCharacters, 
        startCombat, 
        nextTurn, 
        endCombat,
        playerRole
    } = useGameStore(state => ({
        currentMesa: state.currentMesa,
        allCharacters: state.allCharacters,
        startCombat: state.startCombat,
        nextTurn: state.nextTurn,
        endCombat: state.endCombat,
        playerRole: state.playerRole
    }));

    const isGM = playerRole === 'gm' || playerRole === 'co-gm';
    const combatState = currentMesa?.combat_state;

    if (!combatState) {
        return <div className="p-4 text-center text-zinc-500">Carregando estado de combate...</div>;
    }

    const { in_combat, turn_order, current_turn_index, round } = combatState;
    
    const sortedCharacters = turn_order
        .map(turn => {
            const character = allCharacters.find(c => c.id === turn.character_id);
            return { ...turn, character };
        })
        .filter(item => item.character); // Filtra caso um personagem não seja encontrado

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900 text-white">
            <div className="p-3 border-b border-op-border">
                <h3 className="font-bold text-lg text-op-red uppercase text-center">Rastreador de Combate</h3>
            </div>
            
            {in_combat ? (
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3 text-center border-b border-zinc-800">
                        <span className="text-2xl font-bold">{round}</span>
                        <p className="text-xs text-zinc-400 uppercase">Rodada</p>
                    </div>
                    <ul className="divide-y divide-zinc-800">
                        {sortedCharacters.map((item, index) => (
                            <li 
                                key={item.character_id}
                                className={`p-3 flex items-center gap-4 transition-colors ${index === current_turn_index ? 'bg-op-red/10' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === current_turn_index ? 'bg-op-red text-white' : 'bg-zinc-800'}`}>
                                    {item.initiative}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">{item.character?.name}</p>
                                    <div className="flex gap-3 text-xs text-zinc-400 mt-1">
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500"/>{item.character?.stats_current.pv}</span>
                                        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500"/>{item.character?.stats_current.pe}</span>
                                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500"/>{item.character?.stats_current.san}</span>
                                    </div>
                                </div>
                                {index === current_turn_index && <div className="w-2 h-2 rounded-full bg-op-gold animate-pulse"></div>}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-zinc-500 text-center">Nenhum combate em andamento.</p>
                </div>
            )}
            
            {isGM && (
                <div className="p-3 border-t border-op-border bg-zinc-950/70 grid grid-cols-2 gap-2">
                    {!in_combat ? (
                        <OpButton variant='danger' className="col-span-2" onClick={startCombat}>
                            <Swords className="w-4 h-4 mr-2" /> Iniciar Combate
                        </OpButton>
                    ) : (
                        <>
                            <OpButton variant='primary' onClick={nextTurn}>Próximo Turno</OpButton>
                            <OpButton variant='ghost' onClick={endCombat}>Encerrar Combate</OpButton>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
