import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { Plus, Search, Trash2, Edit, X, Loader2, Check } from 'lucide-react';
import { OpButton } from '../ui-op/OpButton';
import { OpInput } from '../ui-op/OpInput';
import { ItemTemplate, ItemCategory } from '../../core/types';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

export const ItemsTab: React.FC = () => {
    const { items, fetchItems, createItem, deleteItem, playerRole, currentMesa } = useGameStore();
    const [filter, setFilter] = useState('');
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('equipamento'); // Default category
    const [loadingCreation, setLoadingCreation] = useState(false);

    const isGM = playerRole === 'gm' || playerRole === 'co-gm';

    useEffect(() => {
        if (currentMesa?.id) {
            fetchItems(currentMesa.id);
        }
    }, [currentMesa?.id, fetchItems]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase())
    );

    const { user } = useAuth(); // Import user from AuthContext
    const handleCreateItem = async () => {
        if (!newItemName.trim()) return;

        setLoadingCreation(true);
        try {
            const result = await createItem({
                name: newItemName,
                description: "Novo item", // Placeholder
                category: newItemCategory,
                image_url: "", // Placeholder
                roll_type: "none", // Placeholder
                roll_data: "", // Placeholder
                stats: {}, // Placeholder
                is_public: false, // Default to private
                owner_id: user?.id || null, // Add owner_id
            });
            if (result.success) {
                // TODO: Add success toast
                fetchItems(currentMesa!.id); // Refresh list
                setIsCreationModalOpen(false);
                setNewItemName('');
            } else {
                // TODO: Add error toast
                console.error("Erro ao criar item:", result.message);
            }
        } catch (error) {
            console.error("Erro inesperado ao criar item:", error);
            // TODO: Add error toast
        } finally {
            setLoadingCreation(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Tem certeza que deseja deletar este item?")) return;
        try {
            const result = await deleteItem(itemId);
            if (result.success) {
                // TODO: Add toast notification
                fetchItems(currentMesa!.id); // Refresh list
            } else {
                // TODO: Add error toast
                console.error("Erro ao deletar item:", result.message);
            }
        } catch (error) {
            console.error("Erro inesperado ao deletar item:", error);
        }
    };


    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900 text-white">
            <div className="p-3 border-b border-op-border">
                            <OpInput 
                                placeholder="Filtrar itens..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />            </div>
            
            <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-zinc-800">
                    {filteredItems.length === 0 && (
                        <li className="p-4 text-center text-zinc-500">Nenhum item encontrado.</li>
                    )}
                    {filteredItems.map(item => (
                        <li key={item.id} className="p-3 flex items-center justify-between hover:bg-zinc-800/50">
                            <div className="flex-1">
                                <p className="font-bold">{item.name}</p>
                                <p className="text-xs text-zinc-400">{item.description}</p>
                            </div>
                            {isGM && (
                                <div className="flex gap-2">
                                    <OpButton variant="ghost" size="sm" onClick={() => {/* TODO: Edit Item */}}>
                                        <Edit className="w-4 h-4 text-blue-400" />
                                    </OpButton>
                                    <OpButton variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
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
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                    </OpButton>
                </div>
            )}

            {/* Creation Modal */}
            {isCreationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative">
                        <h3 className="text-lg font-bold text-op-red mb-4">Novo Item</h3>
                        <div className="space-y-4">
                            <OpInput 
                                label="Nome do Item"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                autoFocus
                            />
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Categoria</label>
                                <select 
                                    className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none"
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                                >
                                    {['arma', 'equipamento', 'veiculo', 'pet', 'componente', 'municao', 'poder', 'vestimenta'].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            {/* TODO: Add more fields for item data */}
                            <div className="flex gap-2 pt-2">
                                <OpButton variant="ghost" onClick={() => setIsCreationModalOpen(false)} className="flex-1" disabled={loadingCreation}>
                                    <X className="w-4 h-4 mr-2" /> Cancelar
                                </OpButton>
                                <OpButton onClick={handleCreateItem} className="flex-1" disabled={loadingCreation || !newItemName.trim()}>
                                    {loadingCreation ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Criar
                                </OpButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};