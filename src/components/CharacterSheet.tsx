import React, { useState, useEffect } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { useGameStore } from '../store/game-store';
import { useToast } from './ui-op/OpToast';
import { Shield, Brain, Heart, Zap, Crosshair, ChevronUp, Dice1, X, Check, Minus, Plus } from 'lucide-react';
import { EvolutionModal } from './modals/EvolutionModal';
import { SheetWizard } from './wizard/SheetWizard';
import { ReactionModal } from './modals/ReactionModal';
import { RestModal } from './modals/RestModal';
import { AttackResult, Character } from '../core/types';
import { OpButton } from './ui-op/OpButton';
import { OpInput } from './ui-op/OpInput';

export const CharacterSheet: React.FC<{ characterId: string; editMode: boolean }> = ({ characterId, editMode }) => {
    // --- STATE & STORES ---
    const { character: gameCharacter, items: gameItems, allCharacters, performAttack, performDamage, sendChatMessage, currentUser } = useGameStore();
    const { character, items, mode, toggleMode, getRollData, isRollModalOpen, setIsRollModalOpen, rollModalInputValue, setRollModalInputValue, setCharacter, setItems, updateCharacterCurrentStats } = useSheetStore();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'pericias' | 'inventario' | 'habilidades' | 'configuracoes'>('pericias');
    const [isShowingReactionModal, setIsShowingReactionModal] = useState(false);
    const [attackResultForReaction, setAttackResultForReaction] = useState<AttackResult | null>(null);
    const [isRestModalOpen, setIsRestModalOpen] = useState(false); // Novo estado para o modal de descanso

    // Load character data based on characterId prop
    useEffect(() => {
        if (characterId) {
            const charToLoad = allCharacters.find(c => c.id === characterId);
            if (charToLoad) {
                setCharacter(charToLoad);
                setItems(charToLoad.inventory || []); // Ensure items are also loaded
            }
        }
    }, [characterId, allCharacters, setCharacter, setItems]);

    // Sync GameStore -> SheetStore (One-way sync for viewing)
    // Removed old sync logic as it's now handled by characterId prop and explicit setCharacter/setItems
    // This useEffect ensures that if the *currently viewed* character (via characterId) changes in gameStore
    // (e.g., due to realtime update), the sheetStore also updates.
    useEffect(() => {
        const currentDisplayedChar = allCharacters.find(c => c.id === characterId);
        if (currentDisplayedChar && currentDisplayedChar.id === character?.id) { // Only update if it's the same char
            // This is a shallow check, a deeper check might be needed for specific properties
            setCharacter(currentDisplayedChar);
            setItems(currentDisplayedChar.inventory || []);
        }
    }, [allCharacters, characterId, character, setCharacter, setItems]);
    
    // Auto-enter creation mode for new characters
    useEffect(() => {
        if (character?.name === 'Agente Novato') { // Simple check for new char
            toggleMode('creation');
        }
    }, [character, toggleMode]);


    // --- RENDER MODES ---
    if (mode === 'creation') {
        return <SheetWizard />; 
    }

    if (!character || character.id !== characterId) { // Ensure correct character is loaded
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

    const handleAttributeRoll = (attributeName: 'for' | 'agi' | 'int' | 'pre' | 'vig') => {
        const rollData = getRollData('none', attributeName); // 'none' for skillName as it's an attribute roll
        setRollModalInputValue(rollData.explanation);
        setIsRollModalOpen(true);
    };

    const handleOpenRollModal = () => {
        setRollModalInputValue(''); // Clear previous roll input
        setIsRollModalOpen(true);
    };

    // --- UI COMPONENTS ---
    const AttrHex = ({ label, value, color, onClick, disabled }: { label: string, value: number, color: string, onClick?: () => void, disabled?: boolean }) => (
        <div 
            className={`flex flex-col items-center justify-center w-24 h-24 relative group select-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={!disabled ? onClick : undefined} // Conditionally enable onClick
        >
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-zinc-800 fill-zinc-900 stroke-2">
                <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" stroke="currentColor" />
            </svg>
            <span className="relative z-10 text-2xl font-black text-zinc-100 font-typewriter">{value}</span>
            <span className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mt-1 ${color}`}>{label}</span>
            {disabled && <div className="absolute inset-0 bg-black/50 rounded-lg"></div>} {/* Visual indication of disabled */}        </div>
    );

    const VitalsInput = ({ label, value, max, color, icon: Icon, onValueChange }: { 
        label: string; 
        value: number; 
        max: number; 
        color: string; 
        icon: React.ElementType; 
        onValueChange: (newValue: number) => void; 
    }) => {
        const [inputValue, setInputValue] = useState(value.toString());

        useEffect(() => {
            setInputValue(value.toString());
        }, [value]);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInputValue(newValue);
        };

        const handleBlur = () => {
            let numValue = parseInt(inputValue, 10);
            if (isNaN(numValue)) numValue = value; // Revert to original if invalid
            numValue = Math.max(0, Math.min(numValue, max)); // Clamp between 0 and max
            onValueChange(numValue);
            setInputValue(numValue.toString());
        };

        const handleIncrement = () => {
            const numValue = Math.min(value + 1, max);
            onValueChange(numValue);
            setInputValue(numValue.toString());
        };

        const handleDecrement = () => {
            const numValue = Math.max(value - 1, 0);
            onValueChange(numValue);
            setInputValue(numValue.toString());
        };

        return (
            <div className={`bg-zinc-900/50 p-4 rounded-sm border ${color === 'red' ? 'border-red-900/30' : color === 'yellow' ? 'border-yellow-900/30' : 'border-blue-900/30'}`}>
                <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold uppercase ${color === 'red' ? 'text-red-500' : color === 'yellow' ? 'text-yellow-500' : 'text-blue-500'}`}>{label}</span> <Icon className={`w-4 h-4 ${color === 'red' ? 'text-red-500' : color === 'yellow' ? 'text-yellow-500' : 'text-blue-500'}`} />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDecrement} className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
                        <Minus className="w-4 h-4" />
                    </button>
                    <input 
                        type="number" 
                        value={inputValue} 
                        onChange={handleInputChange} 
                        onBlur={handleBlur}
                        className="flex-1 bg-transparent text-center text-3xl font-black text-white focus:outline-none" 
                    />
                    <button onClick={handleIncrement} className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-right text-sm text-zinc-600 font-normal">/ {max}</div>
            </div>
        );
    };

    return (
        <div className="bg-op-panel w-full h-full flex flex-col font-sans text-zinc-200 overflow-hidden relative">
            {/* Overlays */}
            {mode === 'evolution' && <EvolutionModal />}
            {isShowingReactionModal && attackResultForReaction && (
                <ReactionModal attackResult={attackResultForReaction} onReact={handleReaction} onClose={() => setIsShowingReactionModal(false)} />
            )}
            {isRestModalOpen && <RestModal character={character} onClose={() => setIsRestModalOpen(false)} />} {/* Adicionado o RestModal */}


            {/* Header */}
            <header className="flex justify-between items-end p-6 border-b border-op-border bg-op-bg/50 backdrop-blur-sm z-10">
                <div className="flex items-end gap-4">
                    {character.profile_image_url && (
                        <img src={character.profile_image_url} alt={`${character.name} Profile`} className="w-24 h-24 object-cover rounded-md border border-op-border" />
                    )}
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
                            {character.user_id === currentUser?.id && (
                                <button
                                    onClick={() => showToast("Converse com seu mestre para atualizar a patente.", "info")}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded transition-colors bg-op-gold/10 text-op-gold border border-op-gold/50 hover:bg-op-gold/20 font-bold uppercase"
                                >
                                    ✨ Subir de Nível
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center bg-zinc-900 border border-op-border p-2 rounded-sm w-20">
                    <Shield className="w-5 h-5 text-zinc-600 mb-1" />
                    <span className="text-2xl font-bold">{character.defenses.passiva}</span>
                    <span className="text-[8px] uppercase text-zinc-600">Defesa</span>
                </div>
            </header>

            {/* Roll Button */}
            <div className="absolute top-4 right-4 z-20">
                <OpButton onClick={handleOpenRollModal} variant="primary" className="flex items-center gap-2">
                    <Dice1 className="w-5 h-5" /> Rolar Dados
                </OpButton>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Vitals Column */}
                <div className="md:col-span-3 flex flex-col gap-4">
                    <VitalsInput 
                        label="Vida" 
                        value={character.stats_current.pv} 
                        max={character.stats_max.pv} 
                        color="red" 
                        icon={Heart} 
                        onValueChange={(val) => updateCharacterCurrentStats('pv', val)} 
                    />
                    <VitalsInput 
                        label="Esforço" 
                        value={character.stats_current.pe} 
                        max={character.stats_max.pe} 
                        color="yellow" 
                        icon={Zap} 
                        onValueChange={(val) => updateCharacterCurrentStats('pe', val)} 
                    />
                    <VitalsInput 
                        label="Sanidade" 
                        value={character.stats_current.san} 
                        max={character.stats_max.san} 
                        color="blue" 
                        icon={Brain} 
                        onValueChange={(val) => updateCharacterCurrentStats('san', val)} 
                    />
                    <OpButton 
                        variant="secondary" 
                        className="w-full mt-4 flex items-center justify-center gap-2"
                        onClick={() => setIsRestModalOpen(true)} // Abre o modal de descanso
                    >
                        💤 Descansar
                    </OpButton>
                </div>

                {/* Attributes Column */}
                <div className="md:col-span-6 flex items-center justify-center py-8">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <AttrHex label="Agi" value={character.attributes.agi} color="text-yellow-500" onClick={() => handleAttributeRoll('agi')} disabled={!editMode} />
                        <AttrHex label="Int" value={character.attributes.int} color="text-blue-500" onClick={() => handleAttributeRoll('int')} disabled={!editMode} />
                        <AttrHex label="For" value={character.attributes.for} color="text-red-500" onClick={() => handleAttributeRoll('for')} disabled={!editMode} />
                        <AttrHex label="Pre" value={character.attributes.pre} color="text-purple-500" onClick={() => handleAttributeRoll('pre')} disabled={!editMode} />
                        <AttrHex label="Vig" value={character.attributes.vig} color="text-green-500" onClick={() => handleAttributeRoll('vig')} disabled={!editMode} />
                    </div>
                </div>

                {/* Tabs Column */}
                <div className="md:col-span-3 flex flex-col bg-zinc-900/30 border border-op-border rounded-sm h-full">
                    <div className="flex border-b border-op-border">
                        <button onClick={() => setActiveTab('pericias')} className={`flex-1 py-2 text-[10px] font-bold uppercase ${activeTab === 'pericias' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Perícias</button>
                        <button onClick={() => setActiveTab('inventario')} className={`flex-1 py-2 text-[10px] font-bold uppercase ${activeTab === 'inventario' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Inventário</button>
                        <button onClick={() => setActiveTab('configuracoes')} className={`flex-1 py-2 text-[10px] font-bold uppercase ${activeTab === 'configuracoes' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Configurações</button>
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
                                    <span>{items.reduce((acc, i) => acc + i.slots * i.quantity, 0)} / {character.inventory_meta.load_limit}</span>
                                </div>
                            </div>
                        )}
                        {activeTab === 'configuracoes' && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-zinc-200 mb-2">Imagem de Perfil</h4>
                                    <OpInput
                                        label="URL da Imagem de Perfil"
                                        placeholder="Cole a URL da imagem de perfil"
                                        value={character.profile_image_url || ''}
                                        onChange={(e) => useSheetStore.getState().setProfileImageUrl(e.target.value)}
                                        disabled={!editMode}
                                    />
                                    {character.profile_image_url && (
                                        <img src={character.profile_image_url} alt="Prévia do Perfil" className="w-32 h-32 object-cover rounded-md mt-2 border border-op-border" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-zinc-200 mb-2">Imagem do Token</h4>
                                    <OpInput
                                        label="URL da Imagem do Token"
                                        placeholder="Cole a URL da imagem do token (para o mapa)"
                                        value={character.token_image_url || ''}
                                        onChange={(e) => useSheetStore.getState().setTokenImageUrl(e.target.value)}
                                        disabled={!editMode}
                                    />
                                    {character.token_image_url && (
                                        <img src={character.token_image_url} alt="Prévia do Token" className="w-16 h-16 object-cover rounded-full mt-2 border border-op-border" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};