import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { OpButton } from '../ui-op/OpButton';
import { ChevronUp, CheckCircle, ArrowRight, ArrowLeft, Brain } from 'lucide-react';
import { AttributeName, ClassName, LevelUpChoices, Affinity } from '../../core/types'; // Importar LevelUpChoices daqui
import { getProgressionInfo, NexReward, calculatePassiveStatGains } from '../../engine/progression'; // Importar nova lógica
import classesData from '../../data/rules/classes.json'; // Para escolha de classe

interface LevelUpModalProps {
    onClose: () => void;
}



const STEPS_LABELS = ['Informações Gerais', 'Atributos', 'Classe', 'Concluir']; // Rótulos dos passos

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onClose }) => {
    const { character, completeLevelUp } = useGameStore(); // Usar completeLevelUp
    const [currentStep, setCurrentStep] = useState(0);
    const [evolutionChoices, setEvolutionChoices] = useState<EvolutionChoices>({ newNex: 0 });
    const [canProceed, setCanProceed] = useState(false); // Para controlar o botão Próximo

    if (!character) return null;

    const nextNex = character.nex + 5; // Assumindo incremento de 5 NEX
    const progressionInfo = useMemo(() => getProgressionInfo(nextNex, character), [nextNex, character]); // Passar character

    const rewardsRequiringChoice = useMemo(() => {
        if (!progressionInfo) return [];
        return progressionInfo.rewards.filter(reward => reward.choiceNeeded);
    }, [progressionInfo]);

    const dynamicSteps = useMemo(() => {
        const steps: string[] = ['Informações Gerais'];
        rewardsRequiringChoice.forEach(reward => {
            if (reward.type === 'attribute') steps.push('Escolha de Atributo');
            else if (reward.type === 'class_change') steps.push('Escolha de Classe');
            else if (reward.type === 'power') steps.push('Escolha de Poder');
            if (reward.type === 'path') steps.push('Escolha de Trilha');
            else if (reward.type === 'versatility') steps.push('Escolha de Afinidade');
            // TODO: Adicionar outros tipos de recompensa (Skill, Versatility)
        });
        steps.push('Concluir');
        return steps;
    }, [rewardsRequiringChoice]);

    // Lógica para determinar se pode ir para o próximo passo
    useEffect(() => {
        if (!progressionInfo || !dynamicSteps[currentStep]) {
            setCanProceed(false);
            return;
        }

        let stepReady = false;
        const currentStepLabel = dynamicSteps[currentStep];

        switch (currentStepLabel) {
            case 'Informações Gerais':
                stepReady = true;
                break;
            case 'Escolha de Atributo':
                const attributeReward = rewardsRequiringChoice.find(r => r.type === 'attribute');
                stepReady = !attributeReward || !!evolutionChoices.attributeChoice;
                break;
            case 'Escolha de Classe':
                const classChangeReward = rewardsRequiringChoice.find(r => r.type === 'class_change');
                stepReady = !classChangeReward || !!evolutionChoices.newClass;
                break;
            case 'Escolha de Poder':
                const powerReward = rewardsRequiringChoice.find(r => r.type === 'power');
                stepReady = !powerReward || !!evolutionChoices.selectedPower;
                break;
            case 'Escolha de Trilha':
                const pathReward = rewardsRequiringChoice.find(r => r.type === 'path');
                stepReady = !pathReward || !!evolutionChoices.selectedPath;
                break;
            case 'Escolha de Afinidade':
                const affinityReward = rewardsRequiringChoice.find(r => r.type === 'versatility');
                stepReady = !affinityReward || !!evolutionChoices.selectedAffinity;
                break;
            case 'Concluir':
                // Verificar se todas as escolhas obrigatórias foram feitas
                stepReady = rewardsRequiringChoice.every(reward => {
                    if (reward.type === 'attribute') return !!evolutionChoices.attributeChoice;
                    if (reward.type === 'class_change') return !!evolutionChoices.newClass;
                    if (reward.type === 'power') return !!evolutionChoices.selectedPower;
                    if (reward.type === 'path') return !!evolutionChoices.selectedPath;
                    if (reward.type === 'versatility') return !!evolutionChoices.selectedAffinity;
                    return true;
                });
                break;
            default:
                stepReady = false;
        }
        setCanProceed(stepReady);
    }, [currentStep, progressionInfo, evolutionChoices, rewardsRequiringChoice, dynamicSteps]);


    const handleNextStep = () => {
        if (currentStep < dynamicSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Último passo, confirmar evolução
            handleConfirmEvolution();
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleConfirmEvolution = async () => {
        if (!character) return;

        const result = await completeLevelUp({
            ...evolutionChoices,
            newNex: nextNex,
        });

        if (result.success) {
            onClose();
        } else {
            alert(result.message);
        }
    };

    const renderCurrentStep = () => {
        if (!progressionInfo) {
            return (
                <div className="text-center text-zinc-500 py-4">
                    Nenhuma informação de progressão encontrada para NEX {nextNex}%.
                </div>
            );
        }

        switch (currentStepLabel) {
            case 'Informações Gerais':
                return (
                    <div className="space-y-4">
                        <p className="text-zinc-300">
                            Parabéns, Agente! Você alcançou NEX {nextNex}% e uma nova patente: <span className="text-op-gold font-bold">{progressionInfo.patent}</span>.
                        </p>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase border-b border-zinc-700 pb-2 mt-4">Ganhos Passivos</h4>
                        <ul className="list-disc list-inside text-zinc-400 text-sm">
                            <li>Seus PV, PE e SAN máximos foram atualizados.</li>
                            <li>Sua capacidade de carga foi revisada.</li>
                            <li>Limite de Atributo: <span className="font-bold">{progressionInfo.limits.maxAttribute}</span></li>
                            <li>Limite de Perícia: <span className="font-bold">{progressionInfo.limits.maxSkill}</span></li>
                        </ul>
                        {rewardsRequiringChoice.length > 0 && (
                            <p className="text-zinc-300 mt-4">
                                Você também tem escolhas importantes a fazer. Clique em "Próximo" para continuar.
                            </p>
                        )}
                        {rewardsRequiringChoice.length === 0 && (
                            <p className="text-zinc-300 mt-4">
                                Este nível não oferece escolhas ativas. Clique em "Concluir" para finalizar.
                            </p>
                        )}
                    </div>
                );
            case 'Atributos':
                const attributeReward = rewardsRequiringChoice.find(r => r.type === 'attribute');
                if (!attributeReward) return <p className="text-zinc-500 text-center py-4">Nenhum ponto de atributo para distribuir neste NEX.</p>;
                return (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase border-b border-zinc-700 pb-2">Escolha de Atributo</h4>
                        <p className="text-zinc-300">Selecione o atributo que deseja aumentar em +1:</p>
                        <div className="grid grid-cols-5 gap-2">
                            {['for', 'agi', 'int', 'pre', 'vig'].map(attr => (
                                <button
                                    key={attr}
                                    onClick={() => setEvolutionChoices(prev => ({ ...prev, attributeChoice: attr as AttributeName }))}
                                    className={`
                                        p-3 rounded border flex flex-col items-center gap-1 transition-all
                                        ${evolutionChoices.attributeChoice === attr
                                            ? 'bg-op-gold/20 border-op-gold text-op-gold'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}
                                    `}
                                >
                                    <span className="text-lg font-black uppercase">{attr}</span>
                                    <span className="text-xs font-mono">{character.attributes[attr as AttributeName]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'Escolha de Classe':
                const classChangeReward = rewardsRequiringChoice.find(r => r.type === 'class_change');
                if (!classChangeReward || character.class !== 'mundano') return <p className="text-zinc-500 text-center py-4">Nenhuma escolha de classe disponível ou aplicável.</p>;
                return (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase border-b border-zinc-700 pb-2">Escolha de Classe</h4>
                        <p className="text-zinc-300">Selecione sua nova classe de Agente:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {classChangeReward.data.availableClasses.map((cls: any) => (
                                <button
                                    key={cls.id}
                                    onClick={() => setEvolutionChoices(prev => ({ ...prev, newClass: cls.id as ClassName }))}
                                    className={`
                                        p-3 rounded border flex flex-col items-center text-center gap-1 transition-all
                                        ${evolutionChoices.newClass === cls.id
                                            ? 'bg-op-red/20 border-op-red text-op-red'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}
                                    `}
                                >
                                    <span className="text-lg font-black uppercase">{cls.name}</span>
                                    <p className="text-[10px] text-zinc-400 mt-1">{cls.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'Escolha de Poder':
                const powerReward = rewardsRequiringChoice.find(r => r.type === 'power');
                if (!powerReward || !powerReward.data || !powerReward.data.availablePowers) return <p className="text-zinc-500 text-center py-4">Nenhum poder disponível para escolha neste NEX.</p>;
                return (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase border-b border-zinc-700 pb-2">Escolha de Poder</h4>
                        <p className="text-zinc-300">Selecione um novo poder:</p>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {powerReward.data.availablePowers.map((power: any) => (
                                <button
                                    key={power.name}
                                    onClick={() => setEvolutionChoices(prev => ({ ...prev, selectedPower: power.name }))}
                                    className={`
                                        p-3 rounded border text-left transition-all
                                        ${evolutionChoices.selectedPower === power.name
                                            ? 'bg-op-blue/20 border-op-blue text-op-blue'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}
                                    `}
                                >
                                    <span className="font-bold text-zinc-200 block">{power.name}</span>
                                    <p className="text-xs text-zinc-400 mt-1">{power.effect}</p>
                                    {power.prerequisite && <p className="text-[10px] text-zinc-600 italic mt-1">Pré-requisito: {power.prerequisite}</p>}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'Escolha de Trilha':
                const pathReward = rewardsRequiringChoice.find(r => r.type === 'path');
                if (!pathReward || !pathReward.data || !pathReward.data.availablePaths) return <p className="text-zinc-500 text-center py-4">Nenhuma trilha disponível para escolha neste NEX.</p>;

                const classDetails = (allClassesData as any).classes[character.class as keyof typeof allClassesData.classes];
                const availablePathsFull = pathReward.data.availablePaths.map((pathName: string) => {
                    const pathDetail = classDetails?.trilhas_sah?.[pathName] || classDetails?.trilhas_base?.[pathName];
                    // Para o primeiro nível da trilha (NEX 10%), pegamos a descrição da primeira feature
                    const description = pathDetail && pathDetail["10"] ? pathDetail["10"] : "Descrição não disponível.";
                    return { name: pathName, description: description };
                });

                return (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase border-b border-zinc-700 pb-2">Escolha de Trilha</h4>
                        <p className="text-zinc-300">Selecione sua Trilha Paranormal:</p>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {availablePathsFull.map((path: any) => (
                                <button
                                    key={path.name}
                                    onClick={() => setEvolutionChoices(prev => ({ ...prev, selectedPath: path.name }))}
                                    className={`
                                        p-3 rounded border text-left transition-all
                                        ${evolutionChoices.selectedPath === path.name
                                            ? 'bg-op-purple/20 border-op-purple text-op-purple'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}
                                    `}
                                >
                                    <span className="font-bold text-zinc-200 block">{path.name}</span>
                                    <p className="text-xs text-zinc-400 mt-1">{path.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'Escolha de Afinidade':
                const affinityReward = rewardsRequiringChoice.find(r => r.type === 'versatility');
                if (!affinityReward || !affinityReward.data || !affinityReward.data.sanityCost) return <p className="text-zinc-500 text-center py-4">Nenhuma escolha de afinidade disponível ou aplicável.</p>;
                return (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase border-b border-zinc-700 pb-2">Escolha de Afinidade</h4>
                        <p className="text-zinc-300">
                            Você está prestes a transceder e se alinhar a uma força paranormal!
                            Escolha uma Afinidade. Lembre-se, este é um processo que pode custar sua mente!
                            Custo: <span className="text-op-red font-bold">{affinityReward.data.sanityCost} de Sanidade.</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {['morte', 'sangue', 'energia', 'conhecimento', 'medo'].map(aff => (
                                <button
                                    key={aff}
                                    onClick={() => setEvolutionChoices(prev => ({ ...prev, selectedAffinity: aff as Affinity }))}
                                    className={`
                                        p-3 rounded border flex flex-col items-center text-center gap-1 transition-all
                                        ${evolutionChoices.selectedAffinity === aff
                                            ? 'bg-op-blue/20 border-op-blue text-op-blue'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}
                                    `}
                                >
                                    <span className="text-lg font-black uppercase">{aff}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'Concluir':
                return (
                    <div className="text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-op-gold mx-auto" />
                        <h4 className="text-xl font-bold text-zinc-200">Evolução Quase Concluída!</h4>
                        <p className="text-zinc-400">Revise suas escolhas e confirme para finalizar a progressão de seu Agente.</p>
                        {/* Exibir resumo das escolhas */}
                    </div>
                );
            default:
                return <p>Passo desconhecido.</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-op-gold p-6 w-full max-w-md shadow-2xl relative">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-op-gold uppercase tracking-widest flex items-center justify-center gap-2">
                        <ChevronUp className="w-6 h-6" /> Subir de Nível
                    </h2>
                    <p className="text-zinc-400 font-mono text-sm mt-2">
                        NEX {character.nex}% <span className="text-zinc-600 mx-2">➔</span> <span className="text-white font-bold">{nextNex}%</span>
                    </p>
                </div>

                <div className="mb-8 min-h-[150px]">
                    {renderCurrentStep()}
                </div>

                <div className="flex justify-between mt-6 border-t border-zinc-800 pt-4">
                    <OpButton
                        variant="ghost"
                        onClick={handlePreviousStep}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Anterior
                    </OpButton>
                    <OpButton
                        onClick={handleNextStep}
                        disabled={!canProceed} // Desabilitar se não puder prosseguir
                        className="flex items-center gap-2"
                    >
                        {currentStep === STEPS_LABELS.length - 1 ? 'Finalizar Evolução' : 'Próximo'} <ArrowRight className="w-4 h-4" />
                    </OpButton>
                </div>

                <OpButton variant="danger" onClick={onClose} className="w-full mt-4">
                    Adiar Evolução
                </OpButton>
            </div>
        </div>
    );
};
