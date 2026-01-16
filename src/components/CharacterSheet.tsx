import React, { useState, useEffect } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { useGameStore } from '../store/game-store';
import { useToast } from './ui-op/OpToast';
import { Shield, Brain, Heart, Zap, Crosshair, ChevronUp, Dice1, X, Check } from 'lucide-react'; // Changed Dice to Dice1
import { EvolutionModal } from './modals/EvolutionModal';
import { SheetWizard } from './wizard/SheetWizard';
import { ReactionModal } from './modals/ReactionModal';
import { AttackResult, Character, AttributeName } from '../core/types';
import { OpButton } from './ui-op/OpButton'; // Import OpButton
import { OpInput } from './ui-op/OpInput'; // Import OpInput
import skillsList from '../data/rules/skills.list.json';

export const CharacterSheet: React.FC = () => {
    // --- STATE & STORES ---
    const { character: gameCharacter, items: gameItems, allCharacters, performAttack, performDamage, sendChatMessage } = useGameStore(); // Added sendChatMessage
    const { character, items, mode, toggleMode, getRollData, isRollModalOpen, setIsRollModalOpen } = useSheetStore();
    const { showToast } = useToast();
    
    const [rollInput, setRollInput] = useState(''); // State for roll input inside the modal
    const [rollDialog, setRollDialog] = useState<{ type: 'attr_click' | 'skill_click', target: string } | null>(null);

    const [activeTab, setActiveTab] = useState<'pericias' | 'inventario' | 'habilidades' | 'configuracoes'>('pericias');
    const [isShowingReactionModal, setIsShowingReactionModal] = useState(false);
    const [attackResultForReaction, setAttackResultForReaction] = useState<AttackResult | null>(null);

    // Sync GameStore -> SheetStore (One-way sync for viewing)
    useEffect(() => {
        const { setCharacter, setItems } = useSheetStore.getState();
        if (gameCharacter && gameCharacter.id !== character?.id) {
            setCharacter(gameCharacter);
            if (gameCharacter.name === 'Agente Novato') { // Simple check for new char
                toggleMode('creation');
            }
        }
    }, [gameCharacter, gameItems, character, toggleMode]);

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

    const handleConfirmRoll = async (diceCode: string) => {
        if (diceCode.trim()) {
            await sendChatMessage(`/roll ${diceCode}`);
            setRollInput('');
            setIsRollModalOpen(false);
        }
    };

    const performRoll = (dice: string, reason: string) => {
        setRollInput(`${dice} # ${reason}`);
        setIsRollModalOpen(true);
        setRollDialog(null); // Close intermediate dialogs
    }

    const handleAttributeClick = (attr: AttributeName) => {
        setRollDialog({ type: 'attr_click', target: attr });
    };

    const handleSkillClick = (skillId: string) => {
        setRollDialog({ type: 'skill_click', target: skillId });
    };

    const resolveAttributeClick = (useSkill: boolean, skillId?: string) => {
        if (!character || !rollDialog || rollDialog.type !== 'attr_click') return;
        const attr = rollDialog.target as AttributeName;
        const attrValue = character.attributes[attr];

        if (!useSkill) {
            performRoll(`${attrValue}d20`, `Teste de ${attr.toUpperCase()}`);
        } else if (skillId) {
             const skillData = character.skills[skillId];
             const bonus = skillData ? skillData.bonus : 0;
             const skillName = skillsList.find(s => s.id === skillId)?.name || skillId;
             performRoll(`${attrValue}d20+${bonus}`, `Teste de ${skillName} (${attr.toUpperCase()})`);
        }
    };

    const resolveSkillClick = (attr: AttributeName) => {
         if (!character || !rollDialog || rollDialog.type !== 'skill_click') return;
         const skillId = rollDialog.target;
         const skillData = character.skills[skillId];
         const bonus = skillData ? skillData.bonus : 0;
         const attrValue = character.attributes[attr];
         const skillName = skillsList.find(s => s.id === skillId)?.name || skillId;

         performRoll(`${attrValue}d20+${bonus}`, `Teste de ${skillName} (${attr.toUpperCase()})`);
    };

    const handleOpenRollModal = () => {
        setRollInput(''); // Clear previous roll input
        setIsRollModalOpen(true);
    };

    // --- UI COMPONENTS ---
    const AttrHex = ({ label, value, color, onClick }: { label: string, value: number, color: string, onClick?: () => void }) => (
        <div 
            className="flex flex-col items-center justify-center w-24 h-24 relative group select-none cursor-pointer"
            onClick={onClick}
        >
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

            {/* Intermediate Roll Dialogs */}
            {rollDialog && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-200">
                        {rollDialog.type === 'attr_click' && (
                            <>
                                <h3 className="text-lg font-bold text-op-red mb-4 uppercase">Usar Perícia?</h3>
                                <p className="text-zinc-400 mb-4 text-sm">Você clicou em <span className="text-white font-bold">{rollDialog.target.toUpperCase()}</span>. Deseja adicionar uma perícia ao teste?</p>
                                <div className="space-y-2">
                                    <OpButton onClick={() => resolveAttributeClick(false)} className="w-full" variant="secondary">Não, rolar puro</OpButton>
                                    <div className="max-h-40 overflow-y-auto border border-zinc-800 rounded p-2 bg-zinc-900/50">
                                        <p className="text-xs text-zinc-500 mb-2 uppercase font-bold">Selecionar Perícia:</p>
                                        {skillsList.filter(s => s.attribute === rollDialog.target).map(s => (
                                            <button
                                                key={s.id}
                                                className="w-full text-left p-1 text-sm hover:bg-zinc-800 text-zinc-300 hover:text-white"
                                                onClick={() => resolveAttributeClick(true, s.id)}
                                            >
                                                {s.name} ({character.skills[s.id]?.bonus || 0})
                                            </button>
                                        ))}
                                    </div>
                                    <OpButton variant="ghost" onClick={() => setRollDialog(null)} className="w-full">Cancelar</OpButton>
                                </div>
                            </>
                        )}

                        {rollDialog.type === 'skill_click' && (
                            <>
                                <h3 className="text-lg font-bold text-op-red mb-4 uppercase">Com qual Atributo?</h3>
                                <p className="text-zinc-400 mb-4 text-sm">Rolando <span className="text-white font-bold">{skillsList.find(s => s.id === rollDialog.target)?.name}</span>. Escolha o atributo base.</p>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {['agi', 'for', 'int', 'pre', 'vig'].map(attr => (
                                        <OpButton key={attr} onClick={() => resolveSkillClick(attr as AttributeName)} variant={attr === skillsList.find(s => s.id === rollDialog.target)?.attribute ? 'primary' : 'secondary'}>
                                            {attr.toUpperCase()}
                                        </OpButton>
                                    ))}
                                </div>
                                <OpButton variant="ghost" onClick={() => setRollDialog(null)} className="w-full">Cancelar</OpButton>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Roll Dice Modal */}
            {isRollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-op-gold mb-4 font-typewriter uppercase">Rolar Dados</h3>
                        <div className="space-y-4">
                            <OpInput
                                label="Código dos Dados"
                                placeholder="Ex: 1d20+5"
                                value={rollInput}
                                onChange={(e) => setRollInput(e.target.value)}
                                autoFocus
                            />
                            <div className="grid grid-cols-3 gap-2">
                                {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100'].map(dice => (
                                    <OpButton key={dice} onClick={() => setRollInput(dice)} variant="secondary" className="text-sm">
                                        {dice}
                                    </OpButton>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <OpButton variant="ghost" onClick={() => setIsRollModalOpen(false)} className="flex-1">
                                    <X className="w-4 h-4 mr-2" /> Cancelar
                                </OpButton>
                                <OpButton onClick={() => handleConfirmRoll(rollInput)} className="flex-1" disabled={!rollInput.trim()}>
                                    <Check className="w-4 h-4 mr-2" /> Rolar
                                </OpButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}


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
                        <AttrHex label="Agi" value={character.attributes.agi} color="text-yellow-500" onClick={() => handleAttributeClick('agi')} />
                        <AttrHex label="Int" value={character.attributes.int} color="text-blue-500" onClick={() => handleAttributeClick('int')} />
                        <AttrHex label="For" value={character.attributes.for} color="text-red-500" onClick={() => handleAttributeClick('for')} />
                        <AttrHex label="Pre" value={character.attributes.pre} color="text-purple-500" onClick={() => handleAttributeClick('pre')} />
                        <AttrHex label="Vig" value={character.attributes.vig} color="text-green-500" onClick={() => handleAttributeClick('vig')} />
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
                         {activeTab === 'pericias' && (
                            <div className="space-y-1">
                                {skillsList.map((skill) => {
                                    const charSkill = character.skills[skill.id];
                                    const bonus = charSkill ? charSkill.bonus : 0;
                                    const grau = charSkill ? charSkill.grau : 'destreinado';

                                    return (
                                        <div
                                            key={skill.id}
                                            className="flex justify-between items-center p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 cursor-pointer group"
                                            onClick={() => handleSkillClick(skill.id)}
                                        >
                                            <div>
                                                <span className="text-xs font-bold text-zinc-300 block group-hover:text-white transition-colors">{skill.name}</span>
                                                <span className="text-[9px] text-zinc-500 uppercase">{skill.attribute} • {grau}</span>
                                            </div>
                                            <span className={`text-sm font-mono font-bold ${bonus > 0 ? 'text-op-gold' : 'text-zinc-600'}`}>
                                                {bonus >= 0 ? `+${bonus}` : bonus}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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