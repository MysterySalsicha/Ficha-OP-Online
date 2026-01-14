import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { OpButton } from '../components/ui-op/OpButton';
import { OpInput } from '../components/ui-op/OpInput';
import { Shield, Brain, Heart, Zap, Crosshair } from 'lucide-react';
import originsData from '../data/rules/origins.json';
import classesData from '../data/rules/classes.json';

// Passos do Wizard
const STEPS = ['Conceito', 'Classe & Origem', 'Atributos', 'Finalizar'];

export const CharacterCreationWizard: React.FC = () => {
    const { mesaId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { initialize, currentMesa } = useGameStore();

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        isSurvivor: false, // True = Sobrevivente (0%), False = Agente (5%)
        origin: '',
        class: 'mundano', // ou combatente/especialista/ocultista
        attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 },
        pointsRemaining: 4 // Padrão Agente (Sobrevivente muda para 3)
    });

    useEffect(() => {
        if (user && mesaId) initialize(user, mesaId);
    }, []);

    // Handlers
    const handleNext = () => setStep(p => p + 1);
    const handleBack = () => setStep(p => p - 1);

    const toggleSurvivor = (isSurvivor: boolean) => {
        setFormData(prev => ({
            ...prev,
            isSurvivor,
            class: isSurvivor ? 'sobrevivente' : 'mundano', // Se agente, escolhe classe depois
            pointsRemaining: isSurvivor ? 3 : 4,
            attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 } // Reset
        }));
    };

    const handleAttrChange = (attr: string, delta: number) => {
        const currentVal = formData.attributes[attr as keyof typeof formData.attributes];
        const newVal = currentVal + delta;
        const cost = 1; // Custo 1 por 1

        // Regras: Min 0, Max 3 (Inicial)
        if (newVal < 0 || newVal > 3) return;
        
        // Verifica pontos
        if (delta > 0 && formData.pointsRemaining < cost) return;

        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attr]: newVal },
            pointsRemaining: prev.pointsRemaining - (delta * cost)
        }));
    };

    const handleFinish = async () => {
        // Aqui chamaremos a store para criar o personagem real no Supabase
        // Com os dados validados pelo Wizard
        // await createCharacter(formData);
        // navigate(`/mesa/${mesaId}`);
        alert("Criação enviada! (Lógica de salvamento será conectada no próximo passo)");
    };

    // Renderizadores de Passo
    const renderStepContent = () => {
        switch (step) {
            case 0: // Conceito
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-xl font-typewriter text-op-red">Identidade</h3>
                        <OpInput 
                            label="Nome do Personagem" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="Ex: Arthur Cervero"
                        />
                        
                        <div className="flex gap-4 mt-6">
                            <div 
                                onClick={() => toggleSurvivor(false)}
                                className={`flex-1 p-4 border cursor-pointer transition-all ${!formData.isSurvivor ? 'border-op-gold bg-op-gold/10' : 'border-zinc-700 hover:border-zinc-500'}`}
                            >
                                <h4 className="font-bold text-zinc-200">Agente da Ordem</h4>
                                <p className="text-xs text-zinc-500 mt-2">Começa com NEX 5%, Classe definida e treinamento tático. (Padrão)</p>
                            </div>
                            <div 
                                onClick={() => toggleSurvivor(true)}
                                className={`flex-1 p-4 border cursor-pointer transition-all ${formData.isSurvivor ? 'border-op-red bg-op-red/10' : 'border-zinc-700 hover:border-zinc-500'}`}
                            >
                                <h4 className="font-bold text-zinc-200">Sobrevivente</h4>
                                <p className="text-xs text-zinc-500 mt-2">Começa com NEX 0%. Pessoas comuns no lugar errado. (Sobrevivendo ao Horror)</p>
                            </div>
                        </div>
                    </div>
                );
            case 1: // Classe & Origem
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        {!formData.isSurvivor && (
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-2">Classe</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {['combatente', 'especialista', 'ocultista'].map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => setFormData({...formData, class: cls})}
                                            className={`p-2 border rounded capitalize text-sm ${formData.class === cls ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-bold text-zinc-500 uppercase mb-2">Origem</h3>
                            <select 
                                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none focus:border-op-gold"
                                value={formData.origin}
                                onChange={e => setFormData({...formData, origin: e.target.value})}
                            >
                                <option value="">Selecione uma Origem...</option>
                                {originsData.origins.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                            {formData.origin && (
                                <p className="text-xs text-zinc-500 mt-2 p-2 bg-zinc-900/50 rounded border border-zinc-800">
                                    {originsData.origins.find(o => o.id === formData.origin)?.benefit}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 2: // Atributos
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center mb-4">
                            <span className="text-4xl font-black text-white">{formData.pointsRemaining}</span>
                            <p className="text-xs text-zinc-500 uppercase">Pontos Restantes</p>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {['agi', 'for', 'int', 'pre', 'vig'].map(attr => (
                                <div key={attr} className="flex flex-col items-center gap-2">
                                    <button onClick={() => handleAttrChange(attr, 1)} className="p-1 hover:bg-zinc-800 rounded"><div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-zinc-400"></div></button>
                                    
                                    <div className="w-12 h-12 flex items-center justify-center border-2 border-zinc-700 rounded bg-zinc-900 text-xl font-bold">
                                        {formData.attributes[attr as keyof typeof formData.attributes]}
                                    </div>
                                    
                                    <button onClick={() => handleAttrChange(attr, -1)} className="p-1 hover:bg-zinc-800 rounded"><div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-zinc-400"></div></button>
                                    
                                    <span className="text-[10px] font-bold uppercase text-zinc-600">{attr}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3: // Resumo
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 text-center">
                        <h3 className="text-xl font-bold text-white uppercase">{formData.name}</h3>
                        <p className="text-zinc-400 capitalize">{formData.isSurvivor ? 'Sobrevivente' : formData.class} - {formData.isSurvivor ? 'NEX 0%' : 'NEX 5%'}</p>
                        
                        <div className="p-4 bg-zinc-900 rounded border border-zinc-800 text-left text-xs space-y-2">
                            <p><strong className="text-zinc-500">ORIGEM:</strong> {originsData.origins.find(o => o.id === formData.origin)?.name || 'Nenhuma'}</p>
                            <p><strong className="text-zinc-500">ATRIBUTOS:</strong> {Object.entries(formData.attributes).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' / ')}</p>
                        </div>

                        <p className="text-xs text-zinc-600 italic">
                            "O paranormal não vem para nossa realidade de maneira fácil..."
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-op-bg text-zinc-100 flex items-center justify-center p-4 bg-noise font-sans">
            <div className="w-full max-w-2xl bg-op-panel border border-op-border shadow-2xl relative flex flex-col md:flex-row h-[500px]">
                
                {/* Sidebar de Passos */}
                <div className="w-full md:w-1/3 bg-zinc-900/50 border-b md:border-b-0 md:border-r border-op-border p-6 flex flex-col justify-center">
                    {STEPS.map((label, idx) => (
                        <div key={idx} className={`flex items-center gap-3 mb-4 ${idx === step ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${idx <= step ? 'bg-op-red border-op-red text-white' : 'border-zinc-600 text-zinc-600'}`}>
                                {idx + 1}
                            </div>
                            <span className={`text-sm font-bold uppercase tracking-wider ${idx === step ? 'text-op-red' : 'text-zinc-500'}`}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Área de Conteúdo */}
                <div className="flex-1 p-8 flex flex-col">
                    <div className="flex-1">
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-between mt-8 pt-4 border-t border-zinc-800">
                        <OpButton variant="ghost" onClick={handleBack} disabled={step === 0}>Voltar</OpButton>
                        
                        {step === STEPS.length - 1 ? (
                            <OpButton onClick={handleFinish} variant="primary">Criar Agente</OpButton>
                        ) : (
                            <OpButton onClick={handleNext} disabled={!formData.name}>Próximo</OpButton>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
