import React, { useState, useEffect } from 'react';
import { OpInput } from '../ui-op/OpInput';
import { OpButton } from '../ui-op/OpButton';
import { MonsterTemplate, AttributeName } from '../../core/types';
import { X, Loader2, Check } from 'lucide-react';

interface MonsterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (monster: Omit<MonsterTemplate, 'id' | 'created_at' | 'owner_id'>, isEditing: boolean) => void;
    initialData?: MonsterTemplate | null;
    isLoading: boolean;
}

export const MonsterFormModal: React.FC<MonsterFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [tokenImageUrl, setTokenImageUrl] = useState('');
    const [attributes, setAttributes] = useState<Record<AttributeName, number>>({ for: 1, agi: 1, int: 1, pre: 1, vig: 1 });
    const [statsMax, setStatsMax] = useState({ pv: 10, pe: 0, san: 10 });
    const [defenses, setDefenses] = useState({ passiva: 10, esquiva: 0, bloqueio: 0, mental: 0 });
    const [abilities, setAbilities] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
            setProfileImageUrl(initialData.profile_image_url || '');
            setTokenImageUrl(initialData.token_image_url || '');
            setAttributes(initialData.attributes);
            setStatsMax(initialData.stats_max);
            setDefenses(initialData.defenses);
            setAbilities(initialData.abilities || []);
            setIsPublic(initialData.is_public);
        } else {
            // Reset form for creation
            setName('');
            setDescription('');
            setProfileImageUrl('');
            setTokenImageUrl('');
            setAttributes({ for: 1, agi: 1, int: 1, pre: 1, vig: 1 });
            setStatsMax({ pv: 10, pe: 0, san: 10 });
            setDefenses({ passiva: 10, esquiva: 0, bloqueio: 0, mental: 0 });
            setAbilities([]);
            setIsPublic(false);
        }
    }, [initialData, isOpen]); // Reset when modal opens or initialData changes

    const handleSubmit = () => {
        const monsterData = {
            name,
            description,
            profile_image_url: profileImageUrl,
            token_image_url: tokenImageUrl,
            attributes,
            stats_max: statsMax,
            defenses,
            abilities,
            is_public: isPublic,
        };
        onSubmit(monsterData, !!initialData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-op-panel border border-op-border p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-op-red mb-4">{initialData ? 'Editar Criatura' : 'Nova Criatura'}</h3>
                <div className="space-y-4">
                    <OpInput 
                        label="Nome da Criatura"
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
                    <OpInput 
                        label="URL da Imagem de Perfil"
                        value={profileImageUrl}
                        onChange={(e) => setProfileImageUrl(e.target.value)}
                    />
                    {profileImageUrl && <img src={profileImageUrl} alt="Prévia do Perfil" className="w-24 h-24 object-cover rounded-md border border-op-border" />}
                    <OpInput 
                        label="URL da Imagem do Token"
                        value={tokenImageUrl}
                        onChange={(e) => setTokenImageUrl(e.target.value)}
                    />
                    {tokenImageUrl && <img src={tokenImageUrl} alt="Prévia do Token" className="w-16 h-16 object-cover rounded-full border border-op-border" />}

                    {/* Attributes */}
                    <h4 className="font-semibold text-zinc-200 mt-4">Atributos</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.keys(attributes).map((attr) => (
                            <OpInput
                                key={attr}
                                label={attr.toUpperCase()}
                                type="number"
                                value={attributes[attr as AttributeName]}
                                onChange={(e) => setAttributes({ ...attributes, [attr as AttributeName]: parseInt(e.target.value) || 0 })}
                            />
                        ))}
                    </div>

                    {/* Max Stats */}
                    <h4 className="font-semibold text-zinc-200 mt-4">Stats Máximos</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <OpInput
                            label="PV Máximo"
                            type="number"
                            value={statsMax.pv}
                            onChange={(e) => setStatsMax({ ...statsMax, pv: parseInt(e.target.value) || 0 })}
                        />
                        <OpInput
                            label="PE Máximo"
                            type="number"
                            value={statsMax.pe}
                            onChange={(e) => setStatsMax({ ...statsMax, pe: parseInt(e.target.value) || 0 })}
                        />
                        <OpInput
                            label="SAN Máxima"
                            type="number"
                            value={statsMax.san}
                            onChange={(e) => setStatsMax({ ...statsMax, san: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    {/* Defenses */}
                    <h4 className="font-semibold text-zinc-200 mt-4">Defesas</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <OpInput
                            label="Defesa Passiva"
                            type="number"
                            value={defenses.passiva}
                            onChange={(e) => setDefenses({ ...defenses, passiva: parseInt(e.target.value) || 0 })}
                        />
                        <OpInput
                            label="Defesa Mental"
                            type="number"
                            value={defenses.mental}
                            onChange={(e) => setDefenses({ ...defenses, mental: parseInt(e.target.value) || 0 })}
                        />
                        <OpInput
                            label="Esquiva"
                            type="number"
                            value={defenses.esquiva}
                            onChange={(e) => setDefenses({ ...defenses, esquiva: parseInt(e.target.value) || 0 })}
                        />
                        <OpInput
                            label="Bloqueio"
                            type="number"
                            value={defenses.bloqueio}
                            onChange={(e) => setDefenses({ ...defenses, bloqueio: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    
                    {/* Abilities (simple text area for now) */}
                    <OpInput 
                        label="Habilidades (separadas por vírgula)"
                        type="textarea"
                        value={abilities.join(', ')}
                        onChange={(e) => setAbilities(e.target.value.split(',').map(s => s.trim()))}
                    />

                    {/* Is Public Checkbox */}
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="isPublicMonster" 
                            checked={isPublic} 
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-op-red rounded border-gray-300 focus:ring-op-red bg-zinc-700 border-zinc-600"
                        />
                        <label htmlFor="isPublicMonster" className="text-sm text-zinc-300">Disponível para outros mestres</label>
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