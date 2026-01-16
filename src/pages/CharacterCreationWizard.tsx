import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { OpButton } from '../components/ui-op/OpButton';
import { OpInput } from '../components/ui-op/OpInput';
import originsData from '../data/rules/origins.json';
import { ClassName } from '../core/types';

const STEPS = ['Conceito', 'Classe & Origem', 'Atributos', 'Finalizar'];

export const CharacterCreationWizard: React.FC = () => {
    const { mesaId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { initialize, createCharacter } = useGameStore();

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        isSurvivor: false,
        origin: '',
        class: 'especialista',
        attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 },
        pointsRemaining: 4
    });

    useEffect(() => {
        if (user && mesaId) initialize(user, mesaId);
    }, [user, mesaId, initialize]);

    const handleNext = () => setStep(p => p + 1);
    const handleBack = () => setStep(p => p - 1);

    const toggleSurvivor = (isSurvivor: boolean) => {
        setFormData(prev => ({
            ...prev,
            isSurvivor,
            class: isSurvivor ? 'sobrevivente' : 'especialista',
            pointsRemaining: isSurvivor ? 3 : 4,
            attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 }
        }));
    };

    const handleAttrChange = (attr: string, delta: number) => {
        const currentVal = formData.attributes[attr as keyof typeof formData.attributes];
        const newVal = currentVal + delta;
        if (newVal < 0 || newVal > 3) return;
        if (delta > 0 && formData.pointsRemaining < 1) return;

        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attr]: newVal },
            pointsRemaining: prev.pointsRemaining - delta
        }));
    };

    const handleFinish = async () => {
        if (!mesaId) return;
        const result = await createCharacter({
            ...formData,
            class: formData.class as ClassName
        });
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
                        <div className="flex gap-4 mt-6">
                            <div onClick={() => toggleSurvivor(false)} className={`flex-1 p-4 border cursor-pointer transition-all ${!formData.isSurvivor ? 'border-op-gold bg-op-gold/10' : 'border-zinc-700 opacity-50'}`}>
                                <h4 className="font-bold text-zinc-200">Agente da Ordem</h4>
                                <p className="text-[10px] text-zinc-500 mt-2">NEX 5%. Treinamento tático avançado.</p>
                            </div>
                            <div onClick={() => toggleSurvivor(true)} className={`flex-1 p-4 border cursor-pointer transition-all ${formData.isSurvivor ? 'border-op-red bg-op-red/10' : 'border-zinc-700 opacity-50'}`}>
                                <h4 className="font-bold text-zinc-200">Sobrevivente</h4>
                                <p className="text-[10px] text-zinc-500 mt-2">NEX 0%. Pessoa comum em perigo.</p>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6">
                        {!formData.isSurvivor && (
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Classe</label>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    {['combatente', 'especialista', 'ocultista'].map(cls => (
                                        <button key={cls} onClick={() => setFormData({...formData, class: cls})} className={`p-2 border rounded uppercase text-[10px] font-bold ${formData.class === cls ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}>{cls}</button>
                                    ))}
                                </div>
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
                return (
                    <div className="space-y-6 text-center">
                        <div>
                            <span className="text-5xl font-black text-white">{formData.pointsRemaining}</span>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Pontos de Atributo</p>
                        </div>
                        <div className="flex justify-center gap-4">
                            {['agi', 'for', 'int', 'pre', 'vig'].map(attr => (
                                <div key={attr} className="flex flex-col items-center gap-1">
                                    <button onClick={() => handleAttrChange(attr, 1)} className="text-zinc-500 hover:text-white">▲</button>
                                    <div className="w-10 h-10 flex items-center justify-center border border-zinc-700 rounded bg-zinc-950 font-bold text-lg">{formData.attributes[attr as keyof typeof formData.attributes]}</div>
                                    <button onClick={() => handleAttrChange(attr, -1)} className="text-zinc-500 hover:text-white">▼</button>
                                    <span className="text-[9px] font-bold uppercase text-zinc-600">{attr}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 text-center">
                        <h3 className="text-2xl font-bold text-white uppercase font-typewriter">{formData.name || 'Sem Nome'}</h3>
                        <p className="text-op-gold uppercase text-xs tracking-widest">{formData.class} • {formData.isSurvivor ? 'NEX 0%' : 'NEX 5%'}</p>
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded text-left text-[10px] uppercase font-mono space-y-1">
                            <p><span className="text-zinc-600">Origem:</span> {formData.origin || 'Nenhuma'}</p>
                            <p><span className="text-zinc-600">Atributos:</span> {Object.entries(formData.attributes).map(([k, v]) => `${k}:${v}`).join(' / ')}</p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

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
                            <OpButton onClick={handleNext} disabled={!formData.name || (step === 2 && formData.pointsRemaining > 0)}>Próximo</OpButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
