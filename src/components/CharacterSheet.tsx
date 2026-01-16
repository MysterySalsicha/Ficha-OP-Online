import React, { useState } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { useToast } from './ui-op/OpToast';
import { Shield, Brain, Heart, Zap, Crosshair, ChevronUp } from 'lucide-react';
import { EvolutionModal } from './modals/EvolutionModal';
import { SheetWizard } from './wizard/SheetWizard';

import { useGameStore } from '../store/game-store';

export const CharacterSheet: React.FC = () => {
    const { character: gameCharacter, items: gameItems } = useGameStore();
    const { character, items, mode, toggleMode, setName } = useSheetStore();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'pericias' | 'inventario' | 'habilidades'>('pericias');

    // Sync Store (One-way: GameStore -> SheetStore) for initial load or updates
    // CAUTION: This might overwrite local changes if not careful.
    // Ideally SheetStore is the "Draft" and on save it goes to GameStore.
    // But for now, let's assume GameStore is truth.

    React.useEffect(() => {
        if (gameCharacter && gameCharacter.id !== character.id) {
            // Load character into local sheet store
            // We need a way to "Load" full char.
            // For MVP, we just rely on the fact that we might need a 'setAll' action.
            // Or we manually set properties.
            useSheetStore.setState({
                character: gameCharacter,
                items: gameItems,
                // If character is new/empty, force creation?
                mode: gameCharacter.nex === 0 && !gameCharacter.class ? 'creation' : 'view'
            });
        }
    }, [gameCharacter, gameItems]);

    // --- RENDER MODES ---

    // 1. Wizard Mode (Creation)
    if (mode === 'creation') {
        return <SheetWizard />;
    }

    if (!character) return <div className="p-8 text-center text-zinc-500 font-typewriter">Carregando Dossiê...</div>;

    // Helper para ícones de atributos (Sem Click)
    const AttrHex = ({ label, value, color }: any) => (
        <div className="flex flex-col items-center justify-center w-24 h-24 relative group select-none">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-zinc-800 fill-zinc-900 stroke-2 transition-colors">
                <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" stroke="currentColor" />
            </svg>
            <span className="relative z-10 text-2xl font-black text-zinc-100 font-typewriter">{value}</span>
            <span className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mt-1 ${color}`}>{label}</span>
        </div>
    );

    return (
        <div className="bg-op-panel w-full h-full flex flex-col font-sans text-zinc-200 overflow-hidden relative">

            {/* 2. Evolution Modal Overlay */}
            {mode === 'evolution' && <EvolutionModal />}
            
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <img src="https://ordemparanormal.com.br/wp-content/uploads/2022/05/simbolo-ordem.png" className="w-64 h-64 grayscale" alt="" />
            </div>

            {/* CABEÇALHO */}
            <header className="flex justify-between items-end p-6 border-b border-op-border bg-op-bg/50 backdrop-blur-sm z-10">
                <div>
                    <h1 className="text-4xl font-typewriter font-bold text-zinc-100 uppercase tracking-tighter leading-none">
                        {character.name}
                    </h1>
                    <div className="flex gap-4 mt-2 text-xs font-mono text-zinc-500 uppercase tracking-widest items-center">
                        <span className="text-op-red font-bold">{character.class}</span>
                        <span>NEX {character.nex}%</span>
                        <span>{character.patente}</span>
                        
                        {/* Botão de Evolução (Controlado pelo modo) */}
                        <button 
                            onClick={() => toggleMode('evolution')}
                            className="flex items-center gap-1 bg-op-gold/10 text-op-gold border border-op-gold/50 px-2 py-0.5 rounded hover:bg-op-gold/20 transition-colors animate-pulse"
                        >
                            <ChevronUp className="w-3 h-3" /> Evoluir
                        </button>
                    </div>
                </div>
                
                {/* Defesa */}
                <div className="flex flex-col items-center bg-zinc-900 border border-op-border p-2 rounded-sm w-20">
                    <Shield className="w-5 h-5 text-zinc-600 mb-1" />
                    <span className="text-2xl font-bold">{character.defenses.passiva}</span>
                    <span className="text-[8px] uppercase text-zinc-600">Defesa</span>
                </div>
            </header>

            {/* CORPO DA FICHA */}
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* COLUNA ESQUERDA: VITAIS */}
                <div className="md:col-span-3 flex flex-col gap-4">
                    {/* PV */}
                    <div className="bg-zinc-900/50 border border-red-900/30 p-4 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-500" style={{ width: `${(character.stats_current.pv / character.stats_max.pv) * 100}%` }}></div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-red-500 uppercase">Vida</span>
                            <Heart className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-3xl font-black text-white">
                            {character.stats_current.pv} <span className="text-sm text-zinc-600 font-normal">/ {character.stats_max.pv}</span>
                        </div>
                    </div>

                    {/* PE */}
                    <div className="bg-zinc-900/50 border border-yellow-900/30 p-4 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-500" style={{ width: `${(character.stats_current.pe / character.stats_max.pe) * 100}%` }}></div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-yellow-500 uppercase">Esforço</span>
                            <Zap className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="text-3xl font-black text-white">
                            {character.stats_current.pe} <span className="text-sm text-zinc-600 font-normal">/ {character.stats_max.pe}</span>
                        </div>
                    </div>

                    {/* SAN */}
                    <div className="bg-zinc-900/50 border border-blue-900/30 p-4 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: `${(character.stats_current.san / character.stats_max.san) * 100}%` }}></div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-blue-500 uppercase">Sanidade</span>
                            <Brain className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-3xl font-black text-white">
                            {character.stats_current.san} <span className="text-sm text-zinc-600 font-normal">/ {character.stats_max.san}</span>
                        </div>
                    </div>
                </div>

                {/* COLUNA CENTRAL: ATRIBUTOS (PENTÁGONO) */}
                <div className="md:col-span-6 flex items-center justify-center py-8">
                    <div className="relative w-64 h-64">
                        {/* Posições Manuais para simular o Pentágono */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2">
                            <AttrHex label="Agi" value={character.attributes.agi} color="text-yellow-500" />
                        </div>
                        <div className="absolute top-1/3 left-0 -translate-x-4">
                            <AttrHex label="For" value={character.attributes.for} color="text-red-500" />
                        </div>
                        <div className="absolute top-1/3 right-0 translate-x-4">
                            <AttrHex label="Int" value={character.attributes.int} color="text-blue-500" />
                        </div>
                        <div className="absolute bottom-0 left-4">
                            <AttrHex label="Vig" value={character.attributes.vig} color="text-green-500" />
                        </div>
                        <div className="absolute bottom-0 right-4">
                            <AttrHex label="Pre" value={character.attributes.pre} color="text-purple-500" />
                        </div>
                        
                        {/* Linhas de conexão (Decorativo) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 text-zinc-500">
                            <polygon points="50,15 90,40 75,85 25,85 10,40" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                    </div>
                </div>

                {/* COLUNA DIREITA: ABAS E LISTAS */}
                <div className="md:col-span-3 flex flex-col bg-zinc-900/30 border border-op-border rounded-sm h-full">
                    <div className="flex border-b border-op-border">
                        <button 
                            onClick={() => setActiveTab('pericias')} 
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors ${activeTab === 'pericias' ? 'bg-zinc-800 text-white border-b-2 border-op-red' : 'text-zinc-500'}`}
                        >
                            Perícias
                        </button>
                        <button 
                            onClick={() => setActiveTab('inventario')} 
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors ${activeTab === 'inventario' ? 'bg-zinc-800 text-white border-b-2 border-op-red' : 'text-zinc-500'}`}
                        >
                            Itens
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'pericias' && (
                            <div className="space-y-1">
                                {['Luta', 'Pontaria', 'Reflexos', 'Fortitude', 'Vontade', 'Ocultismo'].map(skill => (
                                    <div key={skill} className="flex justify-between items-center p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 cursor-default group">
                                        <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200">{skill}</span>
                                        <div className="flex gap-1 items-center">
                                            {[1, 2, 3].map(level => (
                                                <div key={level} className={`w-1.5 h-1.5 rounded-sm ${level <= 1 ? 'bg-op-red' : 'bg-zinc-800'}`}></div>
                                            ))}
                                            <span className="text-xs font-mono ml-2 text-zinc-500">+5</span>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[10px] text-zinc-600 mt-4 text-center italic">Lista completa indisponível no MVP</p>
                            </div>
                        )}

                        {activeTab === 'inventario' && (
                            <div className="space-y-2">
                                {items.map((item, i) => (
                                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-2 flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-zinc-300 block">{item.name}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase">{item.category} • {item.slots}</span>
                                        </div>
                                        {item.category === 'arma' && (
                                            <button className="text-op-red hover:bg-op-red/10 p-1 rounded">
                                                <Crosshair className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between text-xs text-zinc-500 font-mono">
                                    <span>CARGA</span>
                                    <span>
                                        {items.reduce((a, i) => a + i.slots, 0)} / {character.inventory_slots_max}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
