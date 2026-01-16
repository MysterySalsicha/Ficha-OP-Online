import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { OpButton } from '../ui-op/OpButton';
import { MonsterTemplate } from '../../core/types';
import { MonsterFormModal } from '../modals/MonsterFormModal'; // Import MonsterFormModal
import { ActionResult } from '../../core/types';

export const CreaturesTab: React.FC = () => {
    const { monsters, fetchMonsters, createMonster, updateMonster, deleteMonster, playerRole, currentMesa } = useGameStore();
    const [filter, setFilter] = useState('');
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
    const [loadingCreation, setLoadingCreation] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMonster, setEditingMonster] = useState<MonsterTemplate | null>(null);

    const isGM = playerRole === 'gm' || playerRole === 'co-gm';

    useEffect(() => {
        if (currentMesa?.id) {
            fetchMonsters(currentMesa.id);
        }
    }, [currentMesa?.id, fetchMonsters]);

    const filteredMonsters = monsters.filter(monster =>
        monster.name.toLowerCase().includes(filter.toLowerCase())
    );

    const { user } = useAuth(); // Import user from AuthContext
    const handleSubmitMonsterForm = async (monsterData: Omit<MonsterTemplate, 'id' | 'created_at' | 'owner_id'>, isEditing: boolean) => {
        setLoadingCreation(true);
        try {
            let result: ActionResult;
            if (isEditing && editingMonster) {
                result = await updateMonster(editingMonster.id, monsterData);
            } else {
                result = await createMonster({ ...monsterData, owner_id: user?.id || null });
            }

            if (result.success) {
                // TODO: Add toast notification
                fetchMonsters(currentMesa!.id); // Refresh list
                setIsCreationModalOpen(false);
                setIsEditModalOpen(false);
                setEditingMonster(null);
            } else {
                // TODO: Add error toast
                console.error("Erro ao salvar monstro:", result.message);
            }
        } catch (error) {
            console.error("Erro inesperado ao salvar monstro:", error);
            // TODO: Add error toast
        } finally {
            setLoadingCreation(false);
        }
    };

    const handleDeleteMonster = async (monsterId: string) => {
        if (!confirm("Tem certeza que deseja deletar este monstro?")) return;
        try {
            const result = await deleteMonster(monsterId);
            if (result.success) {
                // TODO: Add toast notification
                fetchMonsters(currentMesa!.id); // Refresh list
            } else {
                // TODO: Add error toast
                console.error("Erro ao deletar monstro:", result.message);
            }
        } catch (error) {
            console.error("Erro inesperado ao deletar monstro:", error);
        }
    };


    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900 text-white">
            <div className="p-3 border-b border-op-border">
                <div className="flex items-center gap-2 bg-zinc-800 rounded-md px-3 py-2">
                    <Search className="w-5 h-5 text-zinc-500" />
                    <input 
                        className="flex-1 bg-transparent outline-none text-white placeholder-zinc-500"
                        placeholder="Filtrar criaturas..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-zinc-800">
                    {filteredMonsters.length === 0 && (
                        <li className="p-4 text-center text-zinc-500">Nenhuma criatura encontrada.</li>
                    )}
                    {filteredMonsters.map(monster => (
                        <li key={monster.id} className="p-3 flex items-center justify-between hover:bg-zinc-800/50">
                            <div className="flex-1">
                                <p className="font-bold">{monster.name}</p>
                                <p className="text-xs text-zinc-400">{monster.description}</p>
                            </div>
                            {isGM && (
                                <div className="flex gap-2">
                                    <OpButton variant="ghost" size="sm" onClick={() => { setEditingMonster(monster); setIsEditModalOpen(true); }}>
                                        <Edit className="w-4 h-4 text-blue-400" />
                                    </OpButton>
                                    <OpButton variant="ghost" size="sm" onClick={() => handleDeleteMonster(monster.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </OpButton>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            
            {isGM && (
                <div className="p-3 border-t border-op-border bg-zinc-950/70">
                    <OpButton className="w-full" onClick={() => setIsCreationModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Criatura
                    </OpButton>
                </div>
            )}

            <MonsterFormModal
                isOpen={isCreationModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsCreationModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingMonster(null);
                }}
                onSubmit={handleSubmitMonsterForm}
                initialData={editingMonster}
                isLoading={loadingCreation}
            />
        </div>
    );
};
