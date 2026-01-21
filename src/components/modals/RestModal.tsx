import React, { useState } from 'react';
import { X, Moon, Sun } from 'lucide-react';
import { Character } from '../../core/types';
import { useSheetStore } from '../../store/useSheetStore';
import { useToast } from '../ui-op/OpToast';

interface RestModalProps {
    character: Character;
    onClose: () => void;
}

export const RestModal: React.FC<RestModalProps> = ({ character, onClose }) => {
    const { updateCharacterCurrentStats } = useSheetStore();
    const { showToast } = useToast();

    const handleShortRest = () => {
        const recoveredPE = character.stats_max.pe; // Recupera PE total
        updateCharacterCurrentStats('pe', recoveredPE);
        showToast("Descanso Curto: PE recuperado!", "success");
        onClose();
    };

    const handleLongRest = () => {
        const recoveredPV = character.stats_max.pv; // Recupera PV total
        const recoveredPE = character.stats_max.pe; // Recupera PE total
        const recoveredSAN = character.stats_max.san; // Recupera SAN total
        
        updateCharacterCurrentStats('pv', recoveredPV);
        updateCharacterCurrentStats('pe', recoveredPE);
        updateCharacterCurrentStats('san', recoveredSAN);
        showToast("Descanso Longo: PV, PE e SAN recuperados!", "success");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Moon className="w-5 h-5 text-op-gold" />
                        <span>Descansar</span>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-zinc-300 text-center">Escolha o tipo de descanso:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleShortRest} 
                            className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg shadow-md transition-colors"
                        >
                            <Moon className="w-8 h-8 text-yellow-400 mb-2" />
                            <span className="font-bold text-lg text-white">Descanso Curto</span>
                            <span className="text-sm text-zinc-400">Recupera todo o PE.</span>
                        </button>
                        <button 
                            onClick={handleLongRest} 
                            className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg shadow-md transition-colors"
                        >
                            <Sun className="w-8 h-8 text-orange-400 mb-2" />
                            <span className="font-bold text-lg text-white">Descanso Longo</span>
                            <span className="text-sm text-zinc-400">Recupera todo PV, PE e SAN.</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
