import React, { useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { Map, Eye, PlusCircle, Trash2, Settings, Image, Check, X } from 'lucide-react'; // Added Settings, Image, Check, X
import { OpButton } from '../ui-op/OpButton';
import { OpInput } from '../ui-op/OpInput';
import { TokenType } from '../../core/types'; // Import TokenType

export const ScenesTab: React.FC = () => {
    const { 
        currentMesa, activeScene, createScene, updateScene, deleteScene, playerRole, 
        allCharacters, createToken, updateToken, deleteToken // New actions
    } = useGameStore(state => ({
        currentMesa: state.currentMesa,
        activeScene: state.activeScene,
        createScene: state.createScene,
        updateScene: state.updateScene,
        deleteScene: state.deleteScene,
        playerRole: state.playerRole,
        allCharacters: state.allCharacters,
        createToken: state.createToken,
        updateToken: state.updateToken,
        deleteToken: state.deleteToken
    }));
    
    const [newSceneName, setNewSceneName] = useState('');
    const [isEditingScene, setIsEditingScene] = useState(false);
    const [editedImageUrl, setEditedImageUrl] = useState(activeScene?.image_url || '');
    const [editedGridSize, setEditedGridSize] = useState(activeScene?.grid_size || 50);

    const [selectedCharacterForToken, setSelectedCharacterForToken] = useState<string | null>(null);

    const isGM = playerRole === 'gm' || playerRole === 'co-gm';

    const handleCreateScene = async () => {
        if (!newSceneName.trim()) return;
        const result = await createScene(newSceneName, ''); // Provide an empty string for imageUrl initially
        if (result.success) {
            setNewSceneName('');
            // TODO: Add toast
        } else {
            // TODO: Add error toast
        }
    };

    const handleActivateScene = async (sceneId: string) => {
        if (!currentMesa) return;
        const result = await updateScene(currentMesa.id, sceneId, { is_active: true });
        if (!result.success) {
            // TODO: Add error toast
        }
    };

    const handleDeleteScene = async (sceneId: string) => {
        if (!currentMesa || !confirm("Tem certeza que deseja deletar esta cena?")) return;
        const result = await deleteScene(currentMesa.id, sceneId);
        if (result.success) {
            // TODO: Add toast
        } else {
            // TODO: Add error toast
        }
    };

    const handleSaveSceneSettings = async () => {
        if (!currentMesa || !activeScene) return;
        const result = await updateScene(currentMesa.id, activeScene.id, {
            image_url: editedImageUrl,
            grid_size: editedGridSize
        });
        if (result.success) {
            setIsEditingScene(false);
            // TODO: Add toast
        } else {
            // TODO: Add error toast
        }
    };

    const handleCreateTokenForCharacter = async () => {
        if (!currentMesa || !activeScene || !selectedCharacterForToken) return;

        const selectedChar = allCharacters.find(c => c.id === selectedCharacterForToken);
        if (!selectedChar) return;

        // Default position, size, type for character tokens
        const result = await createToken(
            activeScene.id,
            selectedChar.id,
            { x: 100, y: 100 },
            selectedChar.type, // Use character's type ('player' or 'npc')
            1, // Default size
            selectedChar.image_url || '' // Use character's image_url
        );

        if (result.success) {
            setSelectedCharacterForToken(null);
            // TODO: Add toast
        } else {
            // TODO: Add error toast
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
                            {isGM && (
                                <div className="flex gap-2">
                                    {activeScene?.id !== scene.id && (
                                        <button onClick={() => handleActivateScene(scene.id)} className="p-1 hover:text-op-green text-zinc-400">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => setIsEditingScene(true)} className="p-1 hover:text-blue-400 text-zinc-400">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteScene(scene.id)} className="p-1 hover:text-red-500 text-zinc-400">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                             {activeScene?.id === scene.id && (
                                <div className="text-xs uppercase font-bold text-op-blue">Ativa</div>
                            )}
                        </li>
                    ))}
                </ul>

                {/* Adicionar Token para Personagem */}
                {isGM && activeScene && (
                    <div className="p-3 border-t border-op-border bg-zinc-950/70 space-y-2">
                        <h4 className="font-semibold text-zinc-200 mb-2">Adicionar Token</h4>
                        <select 
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none"
                            value={selectedCharacterForToken || ''}
                            onChange={(e) => setSelectedCharacterForToken(e.target.value)}
                        >
                            <option value="">Selecionar Personagem...</option>
                            {allCharacters.map(char => (
                                <option key={char.id} value={char.id}>{char.name} ({char.type})</option>
                            ))}
                        </select>
                        <OpButton onClick={handleCreateTokenForCharacter} className="w-full" disabled={!selectedCharacterForToken}>
                            <PlusCircle className="w-4 h-4 mr-2" /> Criar Token
                        </OpButton>
                    </div>
                )}
            </div>
            
            {isGM && (
                <div className="p-3 border-t border-op-border bg-zinc-950/70 space-y-2">
                    <OpInput 
                        type="text"
                        placeholder="Nome da nova cena..."
                        value={newSceneName}
                        onChange={e => setNewSceneName(e.target.value)}
                    />
                    <OpButton variant='primary' onClick={handleCreateScene} className="w-full" disabled={!newSceneName.trim()}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Criar Cena
                    </OpButton>
                </div>
            )}

            {/* Scene Settings Modal */}
            {isEditingScene && activeScene && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-lg font-bold text-op-red mb-4">Configurações da Cena: {activeScene.name}</h3>
                        <div className="space-y-4">
                            <OpInput 
                                label="URL da Imagem de Fundo"
                                value={editedImageUrl}
                                onChange={(e) => setEditedImageUrl(e.target.value)}
                            />
                            <OpInput 
                                label="Tamanho da Grade (px)"
                                type="number"
                                value={editedGridSize}
                                onChange={(e) => setEditedGridSize(parseInt(e.target.value))}
                            />
                            {/* TODO: Add grid color, opacity, offset settings */}
                        </div>
                        <div className="flex gap-2 pt-4">
                            <OpButton variant="ghost" onClick={() => setIsEditingScene(false)} className="flex-1">
                                <X className="w-4 h-4 mr-2" /> Cancelar
                            </OpButton>
                            <OpButton onClick={handleSaveSceneSettings} className="flex-1">
                                <Check className="w-4 h-4 mr-2" /> Salvar
                            </OpButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};