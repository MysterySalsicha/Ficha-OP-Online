import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { Plus, Search, Trash2, Edit, Download, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { OpButton } from '../ui-op/OpButton';
import { OpInput } from '../ui-op/OpInput'; // Added
import { MonsterTemplate } from '../../core/types';
import { MonsterFormModal } from '../modals/MonsterFormModal'; // Import MonsterFormModal
import { ActionResult } from '../../core/types';
import { useToast } from '../ui-op/OpToast'; // Added

export const CreaturesTab: React.FC = () => {
    const { monsters, fetchMonsters, createMonster, updateMonster, deleteMonster, searchGlobalMonsters, playerRole, currentMesa } = useGameStore();
    const { showToast } = useToast(); // Added
    const [filter, setFilter] = useState('');
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
    const [loadingCreation, setLoadingCreation] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMonster, setEditingMonster] = useState<MonsterTemplate | null>(null);

    // Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importSearch, setImportSearch] = useState('');
    const [globalMonsters, setGlobalMonsters] = useState<MonsterTemplate[]>([]);
    const [loadingImport, setLoadingImport] = useState(false);

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
                showToast(result.message, "success");
                fetchMonsters(currentMesa!.id); // Refresh list
                setIsCreationModalOpen(false);
                setIsEditModalOpen(false);
                setEditingMonster(null);
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Erro inesperado ao salvar monstro:", error);
            showToast("Erro inesperado ao salvar.", "error");
        } finally {
            setLoadingCreation(false);
        }
    };

    const handleDeleteMonster = async (monsterId: string) => {
        if (!confirm("Tem certeza que deseja deletar este monstro?")) return;
        try {
            const result = await deleteMonster(monsterId);
            if (result.success) {
                showToast(result.message, "success");
                fetchMonsters(currentMesa!.id); // Refresh list
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Erro inesperado ao deletar.", "error");
        }
    };

    const handleSearchGlobal = async () => {
        if (!importSearch.trim()) return;
        setLoadingImport(true);
        const results = await searchGlobalMonsters(importSearch);
        setGlobalMonsters(results);
        setLoadingImport(false);
    };

    const handleImportMonster = async (monster: MonsterTemplate) => {
        if (!confirm(`Importar ${monster.name} para sua biblioteca?`)) return;

        // Clone logic: remove ID/created_at/owner_id
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, owner_id, ...data } = monster;

        const result = await createMonster({ ...data, is_public: false, owner_id: null }); // Import as private copy
        if (result.success) {
            showToast("Monstro importado com sucesso!", "success");
            fetchMonsters(currentMesa!.id);
            setIsImportModalOpen(false);
        } else {
            showToast(result.message, "error");
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
                <div className="p-3 border-t border-op-border bg-zinc-950/70 flex gap-2">
                    <OpButton className="flex-1" onClick={() => setIsCreationModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Criar
                    </OpButton>
                    <OpButton className="flex-1" variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                        <Download className="w-4 h-4 mr-2" /> Importar
                    </OpButton>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-op-red font-typewriter uppercase">Biblioteca Comunitária</h3>
                            <button onClick={() => setIsImportModalOpen(false)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <OpInput
                                placeholder="Buscar criatura..."
                                value={importSearch}
                                onChange={(e) => setImportSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchGlobal()}
                            />
                            <OpButton onClick={handleSearchGlobal} disabled={loadingImport}>
                                {loadingImport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </OpButton>
                        </div>

                        <div className="flex-1 overflow-y-auto border border-zinc-800 rounded bg-zinc-900/50">
                            {globalMonsters.length === 0 && !loadingImport && (
                                <div className="p-4 text-center text-zinc-500">Busque por criaturas para importar.</div>
                            )}
                            <ul className="divide-y divide-zinc-800">
                                {globalMonsters.map(monster => (
                                    <li key={monster.id} className="p-3 flex items-center justify-between hover:bg-zinc-800/80">
                                        <div>
                                            <p className="font-bold text-zinc-200">{monster.name}</p>
                                            <p className="text-xs text-zinc-500">{monster.description?.substring(0, 50)}...</p>
                                        </div>
                                        <OpButton size="sm" onClick={() => handleImportMonster(monster)}>
                                            Importar
                                        </OpButton>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
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
