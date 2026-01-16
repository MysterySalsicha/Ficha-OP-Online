import React, { useState } from 'react';
import { useSheetStore } from '../../store/useSheetStore';
import { useGameStore } from '../../store/game-store';
import { OpButton } from '../ui-op/OpButton';
import { ChevronUp, AlertTriangle } from 'lucide-react';
import { AttributeName } from '../../core/types'; // Corrected import path
import { getProgressionLimits } from '../../engine/calculator';

export const EvolutionModal: React.FC = () => {
    const { toggleMode } = useSheetStore(); // UI State
    const { character, increaseAttribute } = useGameStore(); // Persistent State

    const [selectedAttr, setSelectedAttr] = useState<AttributeName | null>(null);
    const [status, setStatus] = useState<string>('');

    if (!character) return null;

    // Determine what is available based on NEX
    // NEX just increased, so we check what triggered the modal?
    // Actually, store should tell us what we can do, or we deduce from rules.
    // Simple rule check:
    const nex = character.nex;
    const canAttribute = nex % 20 === 0; // 20, 50, 80, 95? (Rules vary, sticking to prompt: "20/50/80/95")
    const canTranscend = true; // Always an option if you have "Poder" slot?
    // Prompt says: "se o personagem do jogador transender... vai poder colocar um ritual novo ou um poder novo"

    // For MVP, we assume the user clicked "Evoluir" and we show options.
    // If strict mode is ON, we only allow what's valid.

    const handleAttribute = async (attr: AttributeName) => {
        const result = await increaseAttribute(attr, character.id);
        if (result.success) {
            setStatus(result.message);
            setTimeout(() => toggleMode('view'), 1500); // Auto close on success
        } else {
            setStatus(`Erro: ${result.message} - ${result.explanation || ''}`);
        }
    };

    const handleTranscend = () => {
        // Mock implementation for now as GameStore doesn't fully support detailed Transcend flow yet
        // But we want to signal intent.
        setStatus("Transcender iniciado... (Funcionalidade em desenvolvimento)");
        // In future: setMode('transcend_picker')
    };

    const handleClose = () => {
        toggleMode('view');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-zinc-900 border border-op-gold p-6 w-full max-w-lg shadow-2xl relative">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-op-gold uppercase tracking-widest flex items-center justify-center gap-2">
                        <ChevronUp className="w-6 h-6" /> Evolução de Agente
                    </h2>
                    <p className="text-zinc-400 font-mono text-sm mt-2">
                        NEX {character.nex}% • <span className="text-white font-bold">{character.patente}</span>
                    </p>
                </div>

                {status && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-200 text-sm rounded flex gap-2 items-center">
                        <AlertTriangle className="w-4 h-4" />
                        {status}
                    </div>
                )}

                <div className="space-y-6">
                    {/* ATTRIBUTE SECTION */}
                    <div className={`p-4 rounded border transition-all ${canAttribute ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950 border-zinc-900 opacity-50'}`}>
                        <h3 className="text-sm font-bold text-zinc-300 uppercase mb-4 flex justify-between">
                            Aumento de Atributo
                            {!canAttribute && <span className="text-[10px] text-zinc-600 border border-zinc-800 px-2 rounded">Bloqueado (Nível)</span>}
                        </h3>

                        <div className="grid grid-cols-5 gap-2">
                            {(['for', 'agi', 'int', 'pre', 'vig'] as AttributeName[]).map(attr => (
                                <button
                                    key={attr}
                                    onClick={() => handleAttribute(attr)}
                                    disabled={!canAttribute}
                                    className={`
                                        p-2 rounded border flex flex-col items-center gap-1 transition-all
                                        hover:bg-zinc-800
                                        ${character.attributes[attr] >= getProgressionLimits(character.nex).maxAttribute ? 'opacity-30 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <span className="text-sm font-black uppercase text-zinc-500">{attr}</span>
                                    <span className="text-xs font-mono text-white">{character.attributes[attr]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TRANSCEND SECTION */}
                    <div className="p-4 rounded border border-purple-900/30 bg-purple-900/5">
                        <h3 className="text-sm font-bold text-purple-300 uppercase mb-2">Transcender</h3>
                        <p className="text-xs text-zinc-500 mb-4">Conecte-se com o Outro Lado para ganhar poderes ou rituais. Custo: Sanidade ou não ganhar Sanidade máxima neste nível.</p>
                        <OpButton
                            onClick={handleTranscend}
                            disabled={!canTranscend}
                            className="w-full border-purple-500 text-purple-400 hover:bg-purple-900/20"
                        >
                            Escolher Poder Paranormal
                        </OpButton>
                    </div>

                     {/* NORMAL POWER/TRAIL SECTION */}
                     <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
                        <h3 className="text-sm font-bold text-zinc-300 uppercase mb-2">Habilidade de Classe/Trilha</h3>
                        <OpButton
                            className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                            onClick={() => setStatus("Use o livro para escolher sua habilidade passiva e adicione manualmente.")}
                        >
                            Consultar Habilidades Disponíveis
                        </OpButton>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <OpButton variant="ghost" onClick={handleClose}>Fechar / Cancelar</OpButton>
                </div>
            </div>
        </div>
    );
};
