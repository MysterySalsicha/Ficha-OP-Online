import React, { useState } from 'react';
import { OpButton } from '../ui-op/OpButton';
import { AlertTriangle, Shield, Sword, Zap } from 'lucide-react';
import { AttackResult } from '../../core/types';

interface ReactionModalProps {
    attackResult: AttackResult;
    onReact: (reactionType: 'dodge' | 'block' | 'counter' | 'none', reactionDetails?: any) => void;
    onClose: () => void;
}

export const ReactionModal: React.FC<ReactionModalProps> = ({ attackResult, onReact, onClose }) => {
    const { weapon, attackerId, targetId } = attackResult;
    const [selectedReaction, setSelectedReaction] = useState<'dodge' | 'block' | 'counter' | 'none'>('none');

    // TODO: Obter nomes reais de atacante e alvo para exibir no modal
    const attackerName = "Atacante"; // Placeholder
    const targetName = "Alvo"; // Placeholder

    const handleConfirmReaction = () => {
        // TODO: Implementar lógica da reação (rolagem, gasto de PE, etc.)
        // Por enquanto, apenas retorna o tipo de reação.
        onReact(selectedReaction);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-op-red p-6 w-full max-w-md shadow-2xl relative">
                <div className="text-center mb-6">
                    <AlertTriangle className="w-12 h-12 text-op-red mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-op-red uppercase tracking-widest">REAÇÃO IMEDIATA!</h2>
                    <p className="text-zinc-400 font-mono text-sm mt-2">
                        {attackerName} atacou {targetName} com {weapon?.name}!
                    </p>
                    <p className="text-zinc-500 text-xs italic">Você foi alvo de um ataque. Escolha sua reação.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setSelectedReaction('dodge')}
                        className={`
                            flex flex-col items-center justify-center p-4 border rounded transition-all
                            ${selectedReaction === 'dodge' ? 'bg-op-blue/20 border-op-blue text-op-blue' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'}
                        `}
                    >
                        <Zap className="w-6 h-6 mb-2" />
                        <span className="font-bold uppercase text-sm">Esquivar</span>
                        <p className="text-xs text-zinc-600 mt-1">Tentar evitar o ataque.</p>
                    </button>
                    <button
                        onClick={() => setSelectedReaction('block')}
                        className={`
                            flex flex-col items-center justify-center p-4 border rounded transition-all
                            ${selectedReaction === 'block' ? 'bg-op-green/20 border-op-green text-op-green' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'}
                        `}
                    >
                        <Shield className="w-6 h-6 mb-2" />
                        <span className="font-bold uppercase text-sm">Bloquear</span>
                        <p className="text-xs text-zinc-600 mt-1">Tentar reduzir o dano.</p>
                    </button>
                    <button
                        onClick={() => setSelectedReaction('counter')}
                        className={`
                            flex flex-col items-center justify-center p-4 border rounded transition-all
                            ${selectedReaction === 'counter' ? 'bg-op-gold/20 border-op-gold text-op-gold' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'}
                        `}
                    >
                        <Sword className="w-6 h-6 mb-2" />
                        <span className="font-bold uppercase text-sm">Contra-atacar</span>
                        <p className="text-xs text-zinc-600 mt-1">Revidar o ataque (pode custar).</p>
                    </button>
                     <button
                        onClick={() => setSelectedReaction('none')}
                        className={`
                            flex flex-col items-center justify-center p-4 border rounded transition-all
                            ${selectedReaction === 'none' ? 'bg-zinc-700 border-zinc-500 text-zinc-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'}
                        `}
                    >
                        <Zap className="w-6 h-6 mb-2 opacity-0" /> {/* Ícone invisível para alinhar */}
                        <span className="font-bold uppercase text-sm">Nenhuma</span>
                        <p className="text-xs text-zinc-600 mt-1">Aceitar o ataque.</p>
                    </button>
                </div>

                <OpButton
                    variant="danger"
                    onClick={handleConfirmReaction}
                    disabled={selectedReaction === 'none' && true} // Bloqueia se não escolher reação
                    className="w-full"
                >
                    Confirmar Reação
                </OpButton>
            </div>
        </div>
    );
};