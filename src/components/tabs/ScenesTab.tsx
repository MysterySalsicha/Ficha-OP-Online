import React, { useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { Map, Eye, PlusCircle, Trash2 } from 'lucide-react';
import { OpButton } from '../ui-op/OpButton';

export const ScenesTab: React.FC = () => {
    const { currentMesa, activeScene, createScene, updateScene, playerRole } = useGameStore(state => ({
        currentMesa: state.currentMesa,
        activeScene: state.activeScene,
        createScene: state.createScene,
        updateScene: state.updateScene,
        playerRole: state.playerRole
    }));
    
    const [newSceneName, setNewSceneName] = useState('');
    const isGM = playerRole === 'gm' || playerRole === 'co-gm';

    const handleCreateScene = () => {
        if (newSceneName.trim()) {
            createScene(newSceneName, ''); // Provide an empty string for imageUrl
            setNewSceneName('');
        }
    };

    const handleActivateScene = (sceneId: string) => {
        if (currentMesa) {
            // This still has the wrong signature for updateScene, will fix world-slice.ts next
            updateScene(currentMesa.id, sceneId, { is_active: true });
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900 text-white">
            <div className="p-3 border-b border-op-border">
                <h3 className="font-bold text-lg text-op-red uppercase text-center">Cenas</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-zinc-800">
                    {currentMesa?.scenes?.map(scene => (
                        <li 
                            key={scene.id}
                            className={`p-3 flex items-center gap-4 transition-colors ${activeScene?.id === scene.id ? 'bg-op-blue/10' : ''}`}
                        >
                            <Map className="w-5 h-5 text-zinc-500" />
                            <span className="flex-1 font-semibold">{scene.name}</span>
                            {isGM && activeScene?.id !== scene.id && (
                                <button onClick={() => handleActivateScene(scene.id)} className="p-1 hover:text-op-green text-zinc-400">
                                    <Eye className="w-4 h-4" />
                                </button>
                            )}
                             {activeScene?.id === scene.id && (
                                <div className="text-xs uppercase font-bold text-op-blue">Ativa</div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            
            {isGM && (
                <div className="p-3 border-t border-op-border bg-zinc-950/70 space-y-2">
                    <input 
                        type="text"
                        placeholder="Nome da nova cena..."
                        className="w-full bg-black/40 border border-zinc-700 rounded p-2 text-sm outline-none focus:border-op-red"
                        value={newSceneName}
                        onChange={e => setNewSceneName(e.target.value)}
                    />
                    <OpButton variant='primary' onClick={handleCreateScene} className="w-full">
                        <PlusCircle className="w-4 h-4 mr-2" /> Criar Cena
                    </OpButton>
                </div>
            )}
        </div>
    );
};
