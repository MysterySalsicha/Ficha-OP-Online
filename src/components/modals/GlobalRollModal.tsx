import React, { useState, useEffect } from 'react';
import { Dice1, ArrowUpCircle, ArrowDownCircle, Minus, Plus, X } from 'lucide-react';
import { useSheetStore } from '../../store/useSheetStore';
import { useGameStore } from '../../store/game-store';

export const GlobalRollModal: React.FC = () => {
    const { isRollModalOpen, setIsRollModalOpen, rollFaces } = useSheetStore();
    const { sendChatMessage, currentMesa, isGM } = useGameStore();
    const [mode, setMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
    const [diceCount, setDiceCount] = useState(1);
    const [bonus, setBonus] = useState(0);
    const [isHidden, setIsHidden] = useState(false); // Novo estado para rolagem oculta

    useEffect(() => {
        if (isRollModalOpen) {
            setMode('normal');
            setDiceCount(1);
            setBonus(0);
            setIsHidden(false); // Resetar isHidden ao abrir o modal
        }
    }, [isRollModalOpen]);

    if (!isRollModalOpen) return null;

    const handleRoll = async () => {
        if (!currentMesa) return;

        const isAdvantage = mode === 'advantage';
        const isDisadvantage = mode === 'disadvantage';
        
        // In adv/dis, we roll one extra die to compare.
        const numDiceToRoll = (isAdvantage || isDisadvantage) ? diceCount + 1 : diceCount;

        const rolls = Array.from({ length: numDiceToRoll }, () => {
            if (rollFaces === 3) {
                return Math.ceil(Math.random() * 3);
            }
            return Math.floor(Math.random() * rollFaces) + 1;
        });

        let finalResult = 0;
        let displayRolls = [...rolls];
        let keptRoll: number | undefined;

        if (isAdvantage) {
            keptRoll = Math.max(...rolls);
            finalResult = keptRoll + bonus;
        } else if (isDisadvantage) {
            keptRoll = Math.min(...rolls);
            finalResult = keptRoll + bonus;
        } else {
            // For normal rolls, sum all dice.
            finalResult = rolls.reduce((sum, roll) => sum + roll, 0) + bonus;
        }
        
        const modeText = isAdvantage ? 'Vantagem 🟢' : isDisadvantage ? 'Desvantagem 🔴' : 'Normal';
        
        const rollsDisplay = displayRolls.map(r => {
            if (keptRoll !== undefined) {
                // Highlight the kept roll, strike through the others.
                return r === keptRoll ? `**${r}**` : `~~${r}~~`;
            }
            return `${r}`;
        }).join(', ');

        // If it's a multi-dice normal roll, we want to show the sum.
        const resultText = (diceCount > 1 && !isAdvantage && !isDisadvantage) 
            ? `${finalResult - bonus} + ${bonus} = ${finalResult}`
            : `${finalResult}`;

        const messageContent = {
            text: `### 🎲 Rolagem ${modeText}\n**Dados:** [${rollsDisplay}] ${bonus !== 0 ? (bonus > 0 ? `+ ${bonus}` : `- ${Math.abs(bonus)}`) : ''}\n# Resultado: ${resultText}`,
            is_hidden: isGM && isHidden, // Adicionar a flag de rolagem oculta
        };

        await sendChatMessage('roll', messageContent);
        setIsRollModalOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Dice1 className="w-5 h-5" />
                        <span>Rolagem de d{rollFaces}</span>
                    </div>
                    <button onClick={() => setIsRollModalOpen(false)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1 rounded-lg">
                        <button onClick={() => setMode('disadvantage')} className={`flex flex-col items-center p-2 rounded ${mode === 'disadvantage' ? 'bg-red-900/40 text-red-400 ring-1 ring-red-500' : 'text-zinc-500 hover:bg-zinc-800'}`}><ArrowDownCircle className="w-6 h-6 mb-1"/><span className="text-[10px] font-bold">DESVANTAGEM</span></button>
                        <button onClick={() => setMode('normal')} className={`flex flex-col items-center p-2 rounded ${mode === 'normal' ? 'bg-zinc-800 text-white ring-1 ring-zinc-600' : 'text-zinc-500 hover:bg-zinc-800'}`}><div className="w-6 h-6 mb-1 border-2 border-current rounded-full"/><span className="text-[10px] font-bold">NORMAL</span></button>
                        <button onClick={() => setMode('advantage')} className={`flex flex-col items-center p-2 rounded ${mode === 'advantage' ? 'bg-green-900/40 text-green-400 ring-1 ring-green-500' : 'text-zinc-500 hover:bg-zinc-800'}`}><ArrowUpCircle className="w-6 h-6 mb-1"/><span className="text-[10px] font-bold">VANTAGEM</span></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
    <label className="text-xs font-bold text-zinc-500">DADOS (D{rollFaces})</label>
    <div className="flex items-center bg-zinc-950 rounded border border-zinc-700">
        <button 
            onClick={() => setDiceCount(Math.max(1, diceCount - 1))} 
            className="p-3 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
            disabled={mode !== 'normal'}
        >
            <Minus className="w-4 h-4"/>
        </button>
        <div className="flex-1 text-center font-bold text-xl text-white">
            {mode !== 'normal' ? 1 : diceCount}
        </div>
        <button 
            onClick={() => setDiceCount(diceCount + 1)} 
            className="p-3 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
            disabled={mode !== 'normal'}
        >
            <Plus className="w-4 h-4"/>
        </button>
    </div>
</div>
                        <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">BÔNUS</label><input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-center text-xl font-bold text-white outline-none focus:border-op-gold" /></div>
                    </div>
                    {isGM && (
                        <div className="flex items-center justify-center gap-2">
                            <input 
                                type="checkbox" 
                                id="hidden-roll" 
                                checked={isHidden} 
                                onChange={(e) => setIsHidden(e.target.checked)}
                                className="form-checkbox h-5 w-5 text-op-red bg-zinc-800 border-zinc-600 rounded focus:ring-op-red"
                            />
                            <label htmlFor="hidden-roll" className="text-sm text-zinc-300">
                                <span role="img" aria-label="hidden">👁️</span> Rolagem Oculta
                            </label>
                        </div>
                    )}
                    <button onClick={handleRoll} className="w-full py-4 bg-op-red hover:bg-red-700 text-white font-black uppercase rounded shadow-lg flex items-center justify-center gap-2"><Dice1 className="w-6 h-6" /> ROLAR</button>
                </div>
            </div>
        </div>
    );
};