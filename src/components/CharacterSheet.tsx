import React, { useState, useEffect } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { useGameStore } from '../store/game-store';
import { useToast } from './ui-op/OpToast';
import { Shield, Brain, Heart, Zap, Crosshair, ChevronUp } from 'lucide-react';
import { EvolutionModal } from './modals/EvolutionModal';
import { SheetWizard } from './wizard/SheetWizard';
import { ReactionModal } from './modals/ReactionModal';
import { AttackResult, Character } from '../core/types';

export const CharacterSheet: React.FC = () => {
    // --- STATE & STORES ---
    const { character: gameCharacter, items: gameItems, allCharacters, performAttack, performDamage } = useGameStore();
    const { character, items, mode, toggleMode, setCharacter: setSheetCharacter, setItems: setSheetItems } = useSheetStore();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'pericias' | 'inventario' | 'habilidades'>('pericias');
    const [isShowingReactionModal, setIsShowingReactionModal] = useState(false);
    const [attackResultForReaction, setAttackResultForReaction] = useState<AttackResult | null>(null);

    // Sync GameStore -> SheetStore (One-way sync for viewing)
    useEffect(() => {
        if (gameCharacter && gameCharacter.id !== character?.id) {
            setSheetCharacter(gameCharacter);
            setSheetItems(gameItems);
            if (gameCharacter.name === 'Agente Novato') { // Simple check for new char
                toggleMode('creation');
            }
        }
    }, [gameCharacter, gameItems, character, setSheetCharacter, setSheetItems, toggleMode]);

    // --- RENDER MODES ---
    if (mode === 'creation') {
        return <SheetWizard />;
    }

    if (!character) {
        return <div className="p-8 text-center text-zinc-500 font-typewriter">Carregando Dossiê...</div>;
    }

    // --- LOGIC HANDLERS (from user's changes) ---
    const proceedWithDamage = async (currentAttackResult: AttackResult, isCriticalConfirmed: boolean) => {
        if (!currentAttackResult.isHit) return;

        let critConfirmed = isCriticalConfirmed;
        if (!critConfirmed && currentAttackResult.isCriticalThreat) {
            const confirmCrit = window.confirm(`Ameaça de Crítico! Confirmar o acerto crítico?`);
            if (confirmCrit) critConfirmed = true;
        }
        
        const damageResult = await performDamage({
            attackResult: currentAttackResult,
            damageDice: currentAttackResult.weapon?.stats?.dano || "1d4",
            isCriticalConfirmed: critConfirmed,
        });

        showToast(damageResult.message, damageResult.success ? "success" : "error");
    };

    const handleReaction = (reactionType: 'dodge' | 'block' | 'counter' | 'none') => {
        setIsShowingReactionModal(false);
        if (attackResultForReaction) {
            // Future: Apply reaction logic to modify attackResult
            proceedWithDamage(attackResultForReaction, false);
        }
        setAttackResultForReaction(null);
    };

    const handleAttack = async (weaponId: string) => {
        const targetId = window.prompt(`Selecione o alvo (digite o ID):\n\n${allCharacters.filter(c => c.id !== character.id).map(c => `${c.name} (ID: ${c.id})`).join('\n')}`);
        if (!targetId) return;

        const foundTarget = allCharacters.find(t => t.id.startsWith(targetId));
        if (!foundTarget) {
            showToast("Alvo não encontrado.", "error");
            return;
        }

        const attackResult = await performAttack(weaponId, foundTarget.id);
        if (!attackResult.success) {
            showToast(attackResult.message, "error");
            return;
        }

        showToast(attackResult.message, "success");
        
        if (attackResult.isHit) {
            if (!foundTarget.is_npc) { // Show reaction modal for players
                setAttackResultForReaction(attackResult);
                setIsShowingReactionModal(true);
            } else { // Proceed directly to damage for NPCs
                await proceedWithDamage(attackResult, false);
            }
        }
    };

    // --- UI COMPONENTS ---
    const AttrHex = ({ label, value, color }: any) => (
        <div className="flex flex-col items-center justify-center w-24 h-24 relative group select-none">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-zinc-800 fill-zinc-900 stroke-2">
                <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" stroke="currentColor" />
            </svg>
            <span className="relative z-10 text-2xl font-black text-zinc-100 font-typewriter">{value}</span>
            <span className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mt-1 ${color}`}>{label}</span>
        </div>
    );

    return (
        <div className="bg-op-panel w-full h-full flex flex-col font-sans text-zinc-200 overflow-hidden relative">
            {/* Overlays */}
            {mode === 'evolution' && <EvolutionModal />}
            {isShowingReactionModal && attackResultForReaction && (
                <ReactionModal attackResult={attackResultForReaction} onReact={handleReaction} onClose={() => setIsShowingReactionModal(false)} />
            )}

            {/* Header */}
            <header className="flex justify-between items-end p-6 border-b border-op-border bg-op-bg/50 backdrop-blur-sm z-10">
                <div>
                    <h1 className="text-4xl font-typewriter font-bold text-zinc-100 uppercase">{character.name}</h1>
                    <div className="flex gap-4 mt-2 text-xs font-mono text-zinc-500 uppercase items-center">
                        <span className="text-op-red font-bold">{character.class}</span>
                        <span>NEX {character.nex}%</span>
                        <span>{character.patente}</span>
                        <button
                            onClick={() => toggleMode('evolution')}
                            disabled={!character.is_approved_evolve}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${character.is_approved_evolve ? 'bg-op-gold/10 text-op-gold border border-op-gold/50 hover:bg-op-gold/20 animate-pulse' : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'}`}
                        >
                            <ChevronUp className="w-3 h-3" /> Evoluir
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-center bg-zinc-900 border border-op-border p-2 rounded-sm w-20">
                    <Shield className="w-5 h-5 text-zinc-600 mb-1" />
                    <span className="text-2xl font-bold">{character.defenses.passiva}</span>
                    <span className="text-[8px] uppercase text-zinc-600">Defesa</span>
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Vitals Column */}
                <div className="md:col-span-3 flex flex-col gap-4">
                    {/* PV */}
                    <div className="bg-zinc-900/50 border border-red-900/30 p-4 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-red-500 uppercase">Vida</span> <Heart className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-3xl font-black text-white">
                            {character.stats_current.pv} <span className="text-sm text-zinc-600 font-normal">/ {character.stats_max.pv}</span>
                        </div>
                    </div>
                    {/* PE */}
                    <div className="bg-zinc-900/50 border border-yellow-900/30 p-4 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-yellow-500 uppercase">Esforço</span> <Zap className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="text-3xl font-black text-white">
                            {character.stats_current.pe} <span className="text-sm text-zinc-600 font-normal">/ {character.stats_max.pe}</span>
                        </div>
                    </div>
                    {/* SAN */}
                    <div className="bg-zinc-900/50 border border-blue-900/30 p-4 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-blue-500 uppercase">Sanidade</span> <Brain className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-3xl font-black text-white">
                            {character.stats_current.san} <span className="text-sm text-zinc-600 font-normal">/ {character.stats_max.san}</span>
                        </div>
                    </div>
                </div>

                {/* Attributes Column */}
                <div className="md:col-span-6 flex items-center justify-center py-8">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <AttrHex label="Agi" value={character.attributes.agi} color="text-yellow-500" />
                        <AttrHex label="Int" value={character.attributes.int} color="text-blue-500" />
                        <AttrHex label="For" value={character.attributes.for} color="text-red-500" />
                        <AttrHex label="Pre" value={character.attributes.pre} color="text-purple-500" />
                        <AttrHex label="Vig" value={character.attributes.vig} color="text-green-500" />
                    </div>
                </div>

                {/* Tabs Column */}
                <div className="md:col-span-3 flex flex-col bg-zinc-900/30 border border-op-border rounded-sm h-full">
                    <div className="flex border-b border-op-border">
                        <button onClick={() => setActiveTab('pericias')} className={`flex-1 py-2 text-[10px] font-bold uppercase ${activeTab === 'pericias' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Perícias</button>
                        <button onClick={() => setActiveTab('inventario')} className={`flex-1 py-2 text-[10px] font-bold uppercase ${activeTab === 'inventario' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Inventário</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'inventario' && (
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-2 flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-zinc-300 block">{item.name}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase">{item.category} • {item.slots}</span>
                                        </div>
                                        {item.category === 'arma' && (
                                            <button onClick={() => handleAttack(item.id)} className="text-op-red hover:bg-op-red/10 p-1 rounded">
                                                <Crosshair className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between text-xs text-zinc-500 font-mono">
                                    <span>CARGA</span>
                                    <span>{items.reduce((acc, i) => acc + i.slots, 0)} / {character.inventory_meta.load_limit}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};