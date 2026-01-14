import React, { useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { OpButton } from '../ui-op/OpButton';
import { ChevronUp } from 'lucide-react';
import { AttributeName } from '../../core/types';

interface LevelUpModalProps {
    onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onClose }) => {
    const { character, increaseAttribute } = useGameStore();
    const [choice, setChoice] = useState<string>('');

    if (!character) return null;

    const nextNex = character.nex + 5;
    let rewardType = 'Nada';
    
    if (nextNex % 20 === 0) rewardType = 'Atributo'; 
    else if (nextNex === 10) rewardType = 'Trilha';
    else if (nextNex % 15 === 0) rewardType = 'Poder'; 
    else rewardType = 'Habilidade de Classe'; 

    const handleConfirm = async () => {
        if (rewardType === 'Atributo' && choice) {
            await increaseAttribute(choice as AttributeName);
            onClose();
        } else {
            alert(`Evolução para NEX ${nextNex}% registrada!`);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-op-gold p-6 w-full max-w-md shadow-2xl relative">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-op-gold uppercase tracking-widest flex items-center justify-center gap-2">
                        <ChevronUp className="w-6 h-6" /> Subir de Nível
                    </h2>
                    <p className="text-zinc-400 font-mono text-sm mt-2">
                        NEX {character.nex}% <span className="text-zinc-600 mx-2">➔</span> <span className="text-white font-bold">{nextNex}%</span>
                    </p>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-zinc-300 uppercase mb-4 border-b border-zinc-700 pb-2 text-center">
                        Recompensa Disponível: <span className="text-op-red">{rewardType}</span>
                    </h3>
                    
                    {rewardType === 'Atributo' ? (
                        <div className="grid grid-cols-5 gap-2">
                            {['for', 'agi', 'int', 'pre', 'vig'].map(attr => (
                                <button
                                    key={attr}
                                    onClick={() => setChoice(attr)}
                                    className={`
                                        p-3 rounded border flex flex-col items-center gap-1 transition-all
                                        ${choice === attr 
                                            ? 'bg-op-gold/20 border-op-gold text-op-gold' 
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}
                                    `}
                                >
                                    <span className="text-lg font-black uppercase">{attr}</span>
                                    <span className="text-xs font-mono">{character.attributes[attr as AttributeName]}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 text-xs italic py-4 border border-dashed border-zinc-800 rounded bg-zinc-950/50">
                            Selecione sua nova habilidade no Livro de Regras.
                            <br/>(Sistema automatizado em breve)
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <OpButton variant="ghost" onClick={onClose} className="flex-1">Adiar</OpButton>
                    <OpButton onClick={handleConfirm} disabled={rewardType === 'Atributo' && !choice} className="flex-1 border-op-gold text-op-gold hover:bg-op-gold hover:text-black">
                        Confirmar
                    </OpButton>
                </div>
            </div>
        </div>
    );
};
