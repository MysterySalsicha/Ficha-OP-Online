import React, { useState, useEffect } from 'react';
import { OpInput } from '../ui-op/OpInput';
import { OpButton } from '../ui-op/OpButton';
import { ItemTemplate, ItemCategory } from '../../core/types';
import { X, Loader2, Check } from 'lucide-react';

interface ItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: Omit<ItemTemplate, 'id' | 'created_at' | 'owner_id'>, isEditing: boolean) => void;
    initialData?: ItemTemplate | null;
    isLoading: boolean;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ItemCategory>('equipamento');
    const [imageUrl, setImageUrl] = useState('');
    const [rollType, setRollType] = useState<'none' | 'attack' | 'damage' | 'save'>('none');
    const [rollData, setRollData] = useState('');
    const [stats, setStats] = useState<Record<string, any>>({}); // For generic stats
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
            setCategory(initialData.category);
            setImageUrl(initialData.image_url || '');
            setRollType(initialData.roll_type || 'none');
            setRollData(initialData.roll_data || '');
            setStats(initialData.stats || {});
            setIsPublic(initialData.is_public);
        } else {
            // Reset form for creation
            setName('');
            setDescription('');
            setCategory('equipamento');
            setImageUrl('');
            setRollType('none');
            setRollData('');
            setStats({});
            setIsPublic(false);
        }
    }, [initialData, isOpen]); // Reset when modal opens or initialData changes

    const handleSubmit = () => {
        const itemData = {
            name,
            description,
            category,
            image_url: imageUrl,
            roll_type: rollType,
            roll_data: rollData,
            stats,
            is_public: isPublic,
        };
        onSubmit(itemData, !!initialData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-op-panel border border-op-border p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-op-red mb-4">{initialData ? 'Editar Item' : 'Novo Item'}</h3>
                <div className="space-y-4">
                    <OpInput 
                        label="Nome do Item"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <OpInput 
                        label="Descrição"
                        type="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Categoria</label>
                        <select 
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as ItemCategory)}
                        >
                            {['arma', 'equipamento', 'veiculo', 'pet', 'componente', 'municao', 'poder', 'vestimenta'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <OpInput 
                        label="URL da Imagem do Item"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUrl && <img src={imageUrl} alt="Prévia do Item" className="w-24 h-24 object-cover rounded-md border border-op-border" />}

                    {/* Roll Type */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tipo de Rolagem Especial</label>
                        <select 
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none"
                            value={rollType}
                            onChange={(e) => setRollType(e.target.value as 'none' | 'attack' | 'damage' | 'save')}
                        >
                            <option value="none">Nenhuma</option>
                            <option value="attack">Ataque</option>
                            <option value="damage">Dano</option>
                            <option value="save">Teste de Resistência</option>
                        </select>
                    </div>
                    {rollType !== 'none' && (
                        <OpInput 
                            label="Dados da Rolagem (ex: 1d20+AGI ou 2d6+3)"
                            value={rollData}
                            onChange={(e) => setRollData(e.target.value)}
                            placeholder="Ex: 1d20+AGI"
                        />
                    )}

                    {/* Generic Stats (as JSON for now, can be expanded later) */}
                    <OpInput 
                        label="Estatísticas Adicionais (JSON)"
                        type="textarea"
                        value={JSON.stringify(stats, null, 2)}
                        onChange={(e) => {
                            try {
                                setStats(JSON.parse(e.target.value));
                            } catch (error) {
                                // Invalid JSON, handle error or ignore
                            }
                        }}
                        placeholder='{"dano": "1d6", "slots": 1}'
                    />

                    {/* Is Public Checkbox */}
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="isPublicItem" 
                            checked={isPublic} 
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-op-red rounded border-gray-300 focus:ring-op-red bg-zinc-700 border-zinc-600"
                        />
                        <label htmlFor="isPublicItem" className="text-sm text-zinc-300">Disponível para outros mestres</label>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <OpButton variant="ghost" onClick={onClose} className="flex-1" disabled={isLoading}>
                            <X className="w-4 h-4 mr-2" /> Cancelar
                        </OpButton>
                        <OpButton onClick={handleSubmit} className="flex-1" disabled={isLoading || !name.trim()}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {initialData ? 'Salvar' : 'Criar'}
                        </OpButton>
                    </div>
                </div>
            </div>
        </div>
    );
};