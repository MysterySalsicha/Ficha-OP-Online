import React from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { EducationalSheet } from './ui/EducationalSheet';
import { Heart, Brain, Shield, Backpack, Info } from 'lucide-react';
import { ActionResult } from '../types/Types';

export const CharacterSheet: React.FC = () => {
    const { character, items, increaseNEX } = useSheetStore();

    // Handler for Level Up with Toast/Alert feedback
    const handleLevelUp = () => {
        const result: ActionResult = increaseNEX(5);
        if (result.success) {
            alert(result.message); // In real app: useToast
            if (result.trigger) {
                alert(`TRIGGER: ${result.trigger} (Open Modal)`);
            }
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{character.name}</h1>
                    <p className="text-zinc-400 capitalize">{character.class} - NEX {character.nex}%</p>
                </div>
                <button
                    onClick={handleLevelUp}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-bold"
                >
                    Subir NEX
                </button>
            </header>

            {/* Vitals Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {/* PV */}
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col items-center">
                    <EducationalSheet
                        title="Pontos de Vida (PV)"
                        triggerTerm="PV"
                        description="Sua saúde física. Se chegar a 0, você cai Morrendo."
                        icon={Heart}
                    />
                    <span className="text-2xl font-bold mt-1">
                        {character.stats_current.pv} <span className="text-sm text-zinc-500">/ {character.stats_max.pv}</span>
                    </span>
                </div>

                {/* PE */}
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col items-center">
                    <EducationalSheet
                        title="Pontos de Esforço (PE)"
                        triggerTerm="PE"
                        description="Sua energia para usar habilidades e rituais."
                        icon={Brain}
                    />
                    <span className="text-2xl font-bold mt-1 text-yellow-400">
                        {character.stats_current.pe} <span className="text-sm text-zinc-500">/ {character.stats_max.pe}</span>
                    </span>
                </div>

                {/* SAN */}
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col items-center">
                    <EducationalSheet
                        title="Sanidade (SAN)"
                        triggerTerm="SAN"
                        description="Sua saúde mental. Cuidado com o Outro Lado."
                        icon={Brain} // Should be Sanity icon
                    />
                    <span className="text-2xl font-bold mt-1 text-blue-400">
                        {character.stats_current.san} <span className="text-sm text-zinc-500">/ {character.stats_max.san}</span>
                    </span>
                </div>
            </div>

            {/* Defenses & Load */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-zinc-500" />
                        <span className="text-sm font-semibold">Defesa</span>
                    </div>
                    <span className="text-xl font-bold">{character.defenses.passiva}</span>
                </div>
                <div className="flex-1 bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Backpack className="w-5 h-5 text-zinc-500" />
                        <span className="text-sm font-semibold">Carga</span>
                    </div>
                    {/* Calculate Current Load */}
                    <span className={`text-xl font-bold ${character.status_flags.sobrecarregado ? 'text-red-500' : ''}`}>
                       {items.reduce((acc, i) => acc + i.slots * i.quantity, 0)} / {character.inventory_slots_max}
                    </span>
                </div>
            </div>

            {/* Attributes Section placeholder */}
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" /> Atributos
                </h3>
                <p className="text-sm text-zinc-400">
                    Use o StatBlock component para gerenciar atributos com feedback visual.
                </p>
                {/* <StatBlock /> would go here */}
            </div>

            {/* Educational Footer */}
            <div className="text-center text-xs text-zinc-600 mt-10">
                <p>Modo Educativo Ativo</p>
                <p>Toque nos termos sublinhados para aprender.</p>
            </div>
        </div>
    );
};
