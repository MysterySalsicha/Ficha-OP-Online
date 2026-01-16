import React, { useState, useEffect } from 'react';
import { useSheetStore } from '../../store/useSheetStore';
import { useGameStore } from '../../store/game-store';
import { OpButton } from '../ui-op/OpButton';
import { OpInput } from '../ui-op/OpInput';
import { WizardStep, AttributeName, ClassName } from '../../types/Types';
import { ChevronRight, ChevronLeft, Info, Check } from 'lucide-react';
import { validateAttributeIncrease } from '../../engine/validator';

const STEPS: WizardStep[] = ['concept', 'attributes', 'origin', 'class', 'finished'];

export const SheetWizard: React.FC = () => {
    const {
        character,
        creation_step,
        setCreationStep,
        setName,
        increaseAttribute,
        creation_points_spent,
        setClass,
        setOrigin,
        toggleMode
    } = useSheetStore();

    const [localConcept, setLocalConcept] = useState({
        name: character.name,
        age: '',
        gender: ''
    });

    // Sync local concept with store (only name for now in store)
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalConcept({ ...localConcept, name: e.target.value });
        setName(e.target.value);
    };

    const { updateCharacterFull } = useGameStore();

    const nextStep = async () => {
        const idx = STEPS.indexOf(creation_step);
        if (idx < STEPS.length - 1) {
            setCreationStep(STEPS[idx + 1]);
        } else {
            // Finish & Save
            await updateCharacterFull({
                 name: character.name,
                 class: character.class,
                 origin: character.origin,
                 attributes: character.attributes
            });
            toggleMode('view');
        }
    };

    const prevStep = () => {
        const idx = STEPS.indexOf(creation_step);
        if (idx > 0) {
            setCreationStep(STEPS[idx - 1]);
        }
    };

    const renderStepContent = () => {
        switch (creation_step) {
            case 'concept':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-typewriter font-bold text-zinc-100">Conceito do Agente</h2>
                            <p className="text-zinc-500 text-sm mt-2">Quem você era antes do Paranormal?</p>
                        </div>
                        <OpInput
                            label="Nome do Personagem"
                            value={localConcept.name}
                            onChange={handleNameChange}
                            placeholder="Ex: Arthur Cervero"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <OpInput label="Idade" placeholder="Ex: 25" />
                            <OpInput label="Ocupação (Ex: Policial)" placeholder="Sua antiga profissão" />
                        </div>

                        <div className="bg-zinc-900/50 p-4 border-l-2 border-op-gold text-sm text-zinc-400 italic">
                            <Info className="w-4 h-4 inline mr-2 text-op-gold" />
                            "O conceito define sua interpretação. Não se preocupe com números agora."
                        </div>
                    </div>
                );

            case 'attributes':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-typewriter font-bold text-zinc-100">Atributos</h2>
                            <p className="text-zinc-500 text-sm">Distribua seus pontos de potencial.</p>
                            <div className="mt-2 inline-flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded-full text-xs font-mono">
                                <span className="text-zinc-400">Pontos Restantes:</span>
                                <span className="text-op-gold font-bold text-lg">{4 - creation_points_spent}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {(['agi', 'for', 'int', 'pre', 'vig'] as AttributeName[]).map(attr => (
                                <div key={attr} className="flex flex-col items-center gap-2 bg-zinc-900/80 p-3 rounded border border-zinc-800 hover:border-zinc-600 transition-colors">
                                    <span className="text-xs uppercase font-bold text-zinc-500">{attr}</span>
                                    <span className="text-3xl font-black text-white">{character.attributes[attr]}</span>
                                    <button
                                        onClick={() => increaseAttribute(attr)}
                                        disabled={creation_points_spent >= 4 || character.attributes[attr] >= 3}
                                        className="w-full py-1 bg-zinc-800 hover:bg-op-red hover:text-white text-zinc-400 text-xs rounded transition-colors disabled:opacity-30 disabled:hover:bg-zinc-800"
                                    >
                                        +1
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500 mt-4">
                            <div className="bg-zinc-900 p-2 rounded">
                                <strong className="text-zinc-300 block mb-1">AGI (Agilidade)</strong>
                                Reflexos, Pontaria, Iniciativa. Define sua Defesa.
                            </div>
                            <div className="bg-zinc-900 p-2 rounded">
                                <strong className="text-zinc-300 block mb-1">FOR (Força)</strong>
                                Luta, Atletismo. Define Espaços no Inventário.
                            </div>
                            <div className="bg-zinc-900 p-2 rounded">
                                <strong className="text-zinc-300 block mb-1">INT (Intelecto)</strong>
                                Perícias de conhecimento. Define Perícias Treinadas.
                            </div>
                            <div className="bg-zinc-900 p-2 rounded">
                                <strong className="text-zinc-300 block mb-1">PRE (Presença)</strong>
                                Vontade, Diplomacia. Define Pontos de Esforço (PE).
                            </div>
                            <div className="bg-zinc-900 p-2 rounded">
                                <strong className="text-zinc-300 block mb-1">VIG (Vigor)</strong>
                                Fortitude. Define Pontos de Vida (PV).
                            </div>
                        </div>
                    </div>
                );

            case 'origin':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center">
                            <h2 className="text-3xl font-typewriter font-bold text-zinc-100">Origem</h2>
                            <p className="text-zinc-500 text-sm">O que você fazia antes de entrar para a Ordem?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-64 overflow-y-auto custom-scrollbar p-1">
                            {['Acadêmico', 'Agente de Saúde', 'Amnésico', 'Artista', 'Atleta', 'Chef', 'Criminoso', 'Cultista Arrependido', 'Desgarrado', 'Engenheiro', 'Executivo', 'Investigador', 'Lutador', 'Magnata', 'Mercenário', 'Militar', 'Operário', 'Policial', 'Religioso', 'Servidor Público', 'Teórico da Conspiração', 'TI', 'Trabalhador Rural', 'Trambiqueiro', 'Universitário', 'Vítima'].map(origin => (
                                <button
                                    key={origin}
                                    onClick={() => setOrigin(origin)}
                                    className={`p-3 text-left border rounded transition-all ${character.origin === origin ? 'bg-op-red text-white border-op-red' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                                >
                                    <span className="font-bold block">{origin}</span>
                                    <span className="text-[10px] opacity-70 block mt-1">Clique para ver detalhes</span>
                                </button>
                            ))}
                        </div>
                        {character.origin && (
                             <div className="bg-zinc-900 p-4 border border-zinc-700 rounded text-sm text-zinc-300">
                                 Você escolheu <strong className="text-white">{character.origin}</strong>.
                                 <br/>Isso lhe confere 2 perícias treinadas e um poder único (consulte o livro).
                             </div>
                        )}
                    </div>
                );

            case 'class':
                return (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center">
                            <h2 className="text-3xl font-typewriter font-bold text-zinc-100">Classe</h2>
                            <p className="text-zinc-500 text-sm">Como você enfrenta o Paranormal?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setClass('combatente')}
                                className={`p-4 border rounded flex flex-col items-center gap-2 transition-all group ${character.class === 'combatente' ? 'bg-red-950/30 border-red-600' : 'bg-zinc-900 border-zinc-800 hover:border-red-900'}`}
                            >
                                <span className={`text-xl font-black uppercase ${character.class === 'combatente' ? 'text-red-500' : 'text-zinc-500 group-hover:text-red-900'}`}>Combatente</span>
                                <span className="text-xs text-center text-zinc-400">Especialista em luta e resistência. Linha de frente.</span>
                            </button>

                            <button
                                onClick={() => setClass('especialista')}
                                className={`p-4 border rounded flex flex-col items-center gap-2 transition-all group ${character.class === 'especialista' ? 'bg-blue-950/30 border-blue-600' : 'bg-zinc-900 border-zinc-800 hover:border-blue-900'}`}
                            >
                                <span className={`text-xl font-black uppercase ${character.class === 'especialista' ? 'text-blue-500' : 'text-zinc-500 group-hover:text-blue-900'}`}>Especialista</span>
                                <span className="text-xs text-center text-zinc-400">Mestre em perícias e utilidade. Resolve problemas.</span>
                            </button>

                            <button
                                onClick={() => setClass('ocultista')}
                                className={`p-4 border rounded flex flex-col items-center gap-2 transition-all group ${character.class === 'ocultista' ? 'bg-purple-950/30 border-purple-600' : 'bg-zinc-900 border-zinc-800 hover:border-purple-900'}`}
                            >
                                <span className={`text-xl font-black uppercase ${character.class === 'ocultista' ? 'text-purple-500' : 'text-zinc-500 group-hover:text-purple-900'}`}>Ocultista</span>
                                <span className="text-xs text-center text-zinc-400">Controla o Outro Lado. Rituais e conhecimento proibido.</span>
                            </button>
                        </div>

                        {character.survivor_mode && (
                             <button
                                onClick={() => setClass('sobrevivente')}
                                className={`w-full p-4 border rounded flex flex-col items-center gap-2 transition-all mt-4 ${character.class === 'sobrevivente' ? 'bg-orange-950/30 border-orange-600' : 'bg-zinc-900 border-zinc-800'}`}
                            >
                                <span className="text-xl font-black uppercase text-orange-500">Sobrevivente</span>
                                <span className="text-xs text-center text-zinc-400">Modo Sobrevivendo ao Horror. Comece como Mundano.</span>
                            </button>
                        )}
                     </div>
                );

            case 'finished':
                return (
                    <div className="text-center space-y-6 animate-in fade-in zoom-in-95">
                        <Check className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="text-3xl font-typewriter font-bold text-zinc-100">Agente Registrado</h2>
                        <div className="text-zinc-400 text-sm max-w-sm mx-auto">
                            <p>Nome: <span className="text-white">{character.name}</span></p>
                            <p>Classe: <span className="text-white uppercase">{character.class}</span></p>
                            <p>Origem: <span className="text-white">{character.origin || 'Desconhecida'}</span></p>
                        </div>
                        <p className="text-zinc-500 text-xs">Sua ficha foi criada. Agora você pode equipar itens e escolher perícias na tela principal.</p>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 bg-[url('https://ordemparanormal.com.br/wp-content/uploads/2022/05/bg-site.jpg')] bg-cover bg-center bg-blend-multiply">
            <div className="bg-zinc-950/90 border border-zinc-800 backdrop-blur-md w-full max-w-2xl h-[600px] flex flex-col relative shadow-2xl rounded-lg overflow-hidden">

                {/* Header Progress */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex gap-2">
                        {STEPS.map((step, i) => (
                            <div
                                key={step}
                                className={`h-1 w-8 rounded-full transition-all ${STEPS.indexOf(creation_step) >= i ? 'bg-op-gold' : 'bg-zinc-800'}`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-mono uppercase text-zinc-500">
                        Passo {STEPS.indexOf(creation_step) + 1} de {STEPS.length}
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 flex flex-col justify-center">
                    {renderStepContent()}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                    <OpButton
                        onClick={prevStep}
                        variant="ghost"
                        disabled={creation_step === 'concept'}
                        className="flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Voltar
                    </OpButton>

                    {creation_step === 'finished' ? (
                        <OpButton onClick={() => toggleMode('view')} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">
                            COMEÇAR MISSÃO
                        </OpButton>
                    ) : (
                        <OpButton onClick={nextStep} className="flex items-center gap-2 bg-op-gold text-black hover:bg-op-gold/80 font-bold px-6">
                            Próximo <ChevronRight className="w-4 h-4" />
                        </OpButton>
                    )}
                </div>

            </div>
        </div>
    );
};
