import React, { useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { Character } from '../../core/types';
import { UserPlus, FileInput } from 'lucide-react';
import { OpButton } from '../ui-op/OpButton';

interface CharacterSelectionProps {
    onCreateNew: () => void;
    onImport: (characterId: string) => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onCreateNew, onImport }) => {
    const { availableCharacters, fetchUserCharacters, currentMesaId } = useGameStore();

    useEffect(() => {
        fetchUserCharacters();
    }, [fetchUserCharacters]);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-op-bg text-zinc-100 p-8">
            <h1 className="text-3xl font-typewriter font-bold text-op-red uppercase tracking-widest mb-8">
                Bem-vindo à Mesa!
            </h1>
            <p className="text-zinc-400 mb-12">Como deseja jogar?</p>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Opção de Criar Novo */}
                <div 
                    className="bg-op-panel p-8 border border-op-border hover:border-op-red transition-all group cursor-pointer flex flex-col items-center justify-center text-center"
                    onClick={onCreateNew}
                >
                    <UserPlus className="w-16 h-16 text-zinc-500 group-hover:text-op-red transition-colors mb-4" />
                    <h2 className="text-xl font-bold font-typewriter text-zinc-200 group-hover:text-op-red transition-colors">
                        Criar Novo Agente
                    </h2>
                    <p className="text-zinc-500 text-sm mt-2">Comece uma nova ficha do zero para esta campanha.</p>
                </div>

                {/* Opção de Importar */}
                <div className="bg-op-panel p-8 border border-op-border">
                    <h2 className="text-xl font-bold font-typewriter text-zinc-200 flex items-center gap-2 mb-4">
                        <FileInput className="w-5 h-5" /> Importar Agente Existente
                    </h2>
                    {availableCharacters.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {availableCharacters.filter(c => c.mesa_id !== currentMesaId).map(char => (
                                <div 
                                    key={char.id}
                                    className="bg-zinc-800 p-4 border border-zinc-700 hover:border-op-gold transition-colors cursor-pointer flex items-center gap-4"
                                    onClick={() => onImport(char.id)}
                                >
                                    <img src={char.profile_image_url || '/favicon.svg'} alt={char.name} className="w-12 h-12 object-cover rounded-md" />
                                    <div>
                                        <h3 className="font-bold text-lg text-zinc-200">{char.name}</h3>
                                        <p className="text-xs text-zinc-500 font-mono">{char.class} | NEX {char.nex}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm text-center py-8">Nenhum outro personagem encontrado em seu registro.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
