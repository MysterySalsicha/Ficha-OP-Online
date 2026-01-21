import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { OpButton } from '../components/ui-op/OpButton';
import { OpInput } from '../components/ui-op/OpInput';
import originsData from '../data/rules/origins.json';
import { ClassName, CharacterDB } from '../core/types';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import classesData from '../data/rules/classes.json';

const STEPS = ['Conceito', 'Classe & Origem', 'Atributos', 'Finalizar'];

const getClassData = (className: string): any => {
    const key = className.charAt(0).toUpperCase() + className.slice(1);
    // @ts-ignore
    return classesData.classes[key];
}

const calculateMaxStats = (char: Pick<CharacterDB, 'class' | 'nex' | 'attributes' | 'survivor_stage'>) => {
    const cls = getClassData(char.class);
    if (!cls) return { pv: 0, pe: 0, san: 0, slots: 0 }; // Return sensible defaults

    const nex = char.nex;
    const vig = char.attributes.vig;
    const pre = char.attributes.pre;

    if (char.class === 'sobrevivente') {
        const stage = char.survivor_stage || 1;
        const pv = (cls.pv_inicial || 8) + vig + (stage - 1) * ((cls.pv_por_estagio || 2) + vig);
        const pe = (cls.pe_inicial || 2) + pre + (stage - 1) * ((cls.pe_por_estagio || 1) + pre);
        const san = (cls.san_inicial || 8) + (stage - 1) * (cls.san_por_estagio || 2);
        const slots = 5 + (char.attributes.for * 5);
        return { pv, pe, san, slots };
    }

    const levels = Math.floor(nex / 5);
    const pv = cls.pv_inicial + vig + (levels - 1) * (cls.pv_por_nex + vig);
    const pe = cls.pe_inicial + pre + (levels - 1) * (cls.pe_por_nex + pre);
    const san = cls.san_inicial + (levels - 1) * (cls.san_por_nex);
    const slots = 5 + (char.attributes.for * 5);

    return { pv, pe, san, slots };
}

export const CharacterCreationWizard: React.FC = () => {
    const { mesaId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { initialize, createCharacter } = useGameStore();

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<{
        name: string;
        nex: number;
        origin: string;
        class: ClassName;
        attributes: { for: number; agi: number; int: number; pre: number; vig: number; };
    }>({
        name: '',
        nex: 5,
        origin: '',
        class: 'combatente',
        attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 },
    });

    useEffect(() => {
        if (user && mesaId) initialize(user, mesaId);
    }, [user, mesaId, initialize]);

    useEffect(() => {
        if (formData.nex === 0) {
            setFormData(prev => ({
                ...prev,
                class: 'sobrevivente',
                attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 }
            }));
        } else if (formData.nex >= 5) {
            if (formData.class === 'sobrevivente') {
                setFormData(prev => ({ ...prev, class: 'combatente' }));
            }
            setFormData(prev => ({
                ...prev,
                attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 }
            }));
        }
    }, [formData.nex, formData.class]);

    const handleNext = () => setStep(p => p + 1);
    const handleBack = () => setStep(p => p - 1);

    const handleNexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNex = parseInt(e.target.value, 10);
        if (!isNaN(newNex) && newNex >= 0 && newNex <= 99) {
            setFormData(prev => ({ ...prev, nex: newNex, attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 } }));
        }
    };

    const handleAttrChange = (attr: string, delta: number) => {
        const { nex, attributes } = formData;
        const ATTRIBUTE_CAP = nex >= 20 ? 5 : 3;
        
        const getBasePoints = () => formData.class === 'sobrevivente' ? 3 : 4;
        const getNexBonusPoints = () => {
            let bonus = 0;
            if (nex >= 20) bonus++;
            if (nex >= 50) bonus++;
            if (nex >= 80) bonus++;
            if (nex >= 95) bonus++;
            return bonus;
        };

        const currentVal = attributes[attr as keyof typeof attributes];
        const newVal = currentVal + delta;

        const pointsFromZero = Object.values(attributes).filter(v => v === 0).length === 1 ? 1 : 0;
        const totalPool = getBasePoints() + getNexBonusPoints() + pointsFromZero;
        const spentPoints = Object.values(attributes).reduce((acc, curr) => acc + (curr > 1 ? curr - 1 : 0), 0) - (Object.values(attributes).filter(v => v===0).length > 0 ? 1 : 0)
        const remainingPoints = totalPool - spentPoints;

        if (delta > 0) {
            if (newVal > ATTRIBUTE_CAP) return;
            if (remainingPoints < 1) return;
        }

        if (delta < 0) {
            if (newVal < 0) return;
            const zeroCount = Object.values(attributes).filter(v => v === 0).length;
            if (newVal === 0 && zeroCount >= 1 && currentVal !== 0) return;
        }

        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attr]: newVal },
        }));
    };

    const handleFinish = async () => {
        if (!mesaId || !user) return;

        const { pv, pe, san, slots } = calculateMaxStats({
            class: formData.class,
            nex: formData.nex,
            attributes: formData.attributes,
        });

        const newCharacter: CharacterDB = {
            id: uuidv4(),
            user_id: user.id,
            mesa_id: mesaId,
            name: formData.name,
            nex: formData.nex,
            class: formData.class as ClassName,
            origin: formData.origin as string | undefined,
            attributes: formData.attributes,
            stats_max: { pv, pe, san },
            stats_current: {
                pv,
                pe,
                san,
                max_pv: pv,
                max_pe: pe,
                max_san: san,
                is_dying: false,
                is_unconscious: false,
                is_stable: true,
                is_incapacitated: false,
                conditions: [],
            },
            inventory_meta: {
                load_limit: slots,
                current_load: 0,
                credit_limit: 'I',
            },
            defenses: {
                passiva: 10 + formData.attributes.agi,
                esquiva: 10 + formData.attributes.agi,
                bloqueio: 10 + formData.attributes.for,
                mental: 10 + formData.attributes.pre,
            },
            patente: 'Recruta',
            type: 'player',
            movement: 9,
            stress: 0,
            skills: {},
            powers: [],
            rituals: [],
            inventory: [],
            is_gm_mode: false,
            is_npc: false,
            is_approved_evolve: true,
            survivor_mode: formData.class === 'sobrevivente',
            image_url: null,
            created_at: new Date().toISOString(),
        };

        const result = await createCharacter(newCharacter);
        if (result.success) {
            navigate(`/mesa/${mesaId}`);
        } else {
            alert(result.message);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-typewriter text-op-red uppercase">Identidade</h3>
                        <OpInput label="Nome do Personagem" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Arthur Cervero" />
                        <div className="flex items-center gap-2">
                            <OpInput type="number" label="NEX" value={formData.nex} onChange={handleNexChange} className="w-24" />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="mt-5"><HelpCircle size={16} className="text-zinc-500" /></button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs bg-zinc-950 border-zinc-800 text-zinc-300">
                                        <p className="font-bold text-white">Nível de Exposição Paranormal</p>
                                        <p>Seu % de exposição ao Outro Lado. Define seus PV, PE, Sanidade e Poderes. NEX 0% é para pessoas comuns (Sobreviventes). NEX 5%+ são agentes treinados.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6">
                        {formData.nex >= 5 ? (
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Classe</label>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    {['combatente', 'especialista', 'ocultista'].map(cls => (
                                        <button key={cls} onClick={() => setFormData({...formData, class: cls})} className={`p-2 border rounded uppercase text-[10px] font-bold ${formData.class === cls ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}>{cls}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Classe</label>
                                <p className="text-lg font-bold text-op-red">SOBREVIVENTE</p>
                                <p className="text-xs text-zinc-400">Pessoas comuns tentando sobreviver ao paranormal.</p>
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Origem</label>
                            <select className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none mt-1" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})}>
                                <option value="">Selecione...</option>
                                {originsData.origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 2:
                const { nex, attributes, class: characterClass } = formData;
                const ATTRIBUTE_CAP = nex >= 20 ? 5 : 3;

                const getBasePoints = () => characterClass === 'sobrevivente' ? 3 : 4;
                const getNexBonusPoints = () => {
                    let bonus = 0;
                    if (nex >= 20) bonus++;
                    if (nex >= 50) bonus++;
                    if (nex >= 80) bonus++;
                    if (nex >= 95) bonus++;
                    return bonus;
                };
        
                const pointsFromZero = Object.values(attributes).filter(v => v === 0).length === 1 ? 1 : 0;
                const totalPool = getBasePoints() + getNexBonusPoints() + pointsFromZero;
                const spentPoints = Object.values(attributes).reduce((acc, curr) => acc + (curr > 1 ? curr - 1 : 0), 0) - (Object.values(attributes).filter(v => v===0).length > 0 ? 1 : 0)
                const remainingPoints = totalPool - spentPoints;

                return (
                    <div className="space-y-6 text-center">
                        <div>
                            <span className="text-5xl font-black text-white">{remainingPoints}</span>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Pontos de Atributo</p>
                        </div>
                        <div className="flex justify-center gap-4">
                            {['agi', 'for', 'int', 'pre', 'vig'].map(attr => (
                                <div key={attr} className="flex flex-col items-center gap-1">
                                    <button onClick={() => handleAttrChange(attr, 1)} className="text-zinc-500 hover:text-white">▲</button>
                                    <div className="w-10 h-10 flex items-center justify-center border border-zinc-700 rounded bg-zinc-950 font-bold text-lg">{attributes[attr as keyof typeof attributes]}</div>
                                    <button onClick={() => handleAttrChange(attr, -1)} className="text-zinc-500 hover:text-white">▼</button>
                                    <span className="text-[9px] font-bold uppercase text-zinc-600">{attr}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500">Máx por atributo: {ATTRIBUTE_CAP}</p>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 text-center">
                        <h3 className="text-2xl font-bold text-white uppercase font-typewriter">{formData.name || 'Sem Nome'}</h3>
                        <p className="text-op-gold uppercase text-xs tracking-widest">{formData.class} • NEX {formData.nex}%</p>
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded text-left text-[10px] uppercase font-mono space-y-1">
                            <p><span className="text-zinc-600">Origem:</span> {formData.origin || 'Nenhuma'}</p>
                            <p><span className="text-zinc-600">Atributos:</span> {Object.entries(formData.attributes).map(([k, v]) => `${k}:${v}`).join(' / ')}</p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const calculateRemainingPoints = () => {
        const { nex, attributes, class: characterClass } = formData;
        const getBasePoints = () => characterClass === 'sobrevivente' ? 3 : 4;
        const getNexBonusPoints = () => {
            let bonus = 0;
            if (nex >= 20) bonus++;
            if (nex >= 50) bonus++;
            if (nex >= 80) bonus++;
            if (nex >= 95) bonus++;
            return bonus;
        };
        const pointsFromZero = Object.values(attributes).filter(v => v === 0).length === 1 ? 1 : 0;
        const totalPool = getBasePoints() + getNexBonusPoints() + pointsFromZero;
        const spentPoints = Object.values(attributes).reduce((acc, curr) => acc + (curr > 1 ? curr - 1 : 0), 0) - (Object.values(attributes).filter(v => v===0).length > 0 ? 1 : 0)
        return totalPool - spentPoints;
    };

    const isNextButtonDisabled = !formData.name || (step === 2 && calculateRemainingPoints() > 0);

    return (
        <div className="min-h-screen bg-op-bg text-zinc-100 flex items-center justify-center p-4 bg-noise font-sans">
            <div className="w-full max-w-3xl bg-op-panel border border-op-border shadow-2xl flex flex-col md:flex-row h-[450px]">
                <div className="w-full md:w-1/4 bg-zinc-900/50 border-b md:border-b-0 md:border-r border-op-border p-6 flex flex-col justify-center gap-4">
                    {STEPS.map((label, idx) => (
                        <div key={idx} className={`flex items-center gap-3 ${idx === step ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${idx <= step ? 'bg-op-red border-op-red text-white' : 'border-zinc-600'}`}>{idx + 1}</div>
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${idx === step ? 'text-op-red' : ''}`}>{label}</span>
                        </div>
                    ))}
                </div>
                <div className="flex-1 p-10 flex flex-col justify-between">
                    <div className="flex-1">{renderStepContent()}</div>
                    <div className="flex justify-between mt-8 border-t border-zinc-800 pt-6">
                        <OpButton variant="ghost" onClick={handleBack} disabled={step === 0}>Anterior</OpButton>
                        {step === STEPS.length - 1 ? (
                            <OpButton onClick={handleFinish} variant="primary" className="border-op-gold text-op-gold">Finalizar Agente</OpButton>
                        ) : (
                            <OpButton 
                                onClick={handleNext} 
                                disabled={isNextButtonDisabled as boolean}
                            >
                                Próximo
                            </OpButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
