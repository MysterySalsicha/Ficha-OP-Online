import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { Plus, Search, Trash2, Edit, X, Check, Loader2 } from 'lucide-react';
import { OpButton } from '../ui-op/OpButton';
import { OpInput } from '../ui-op/OpInput';
import { JournalEntry } from '../../core/types';

export const JournalTab: React.FC = () => {
    const { journalEntries, fetchJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry, currentMesa, currentUser } = useGameStore();
    const [filter, setFilter] = useState('');
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [entryTitle, setEntryTitle] = useState('');
    const [entryContent, setEntryContent] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        if (currentMesa?.id && currentUser?.id) {
            fetchJournalEntries(currentMesa.id, currentUser.id);
        }
    }, [currentMesa?.id, currentUser?.id, fetchJournalEntries]);

    const filteredEntries = journalEntries.filter(entry =>
        entry.title.toLowerCase().includes(filter.toLowerCase()) ||
        entry.content.toLowerCase().includes(filter.toLowerCase())
    );

    const handleNewEntry = () => {
        setEditingEntry(null);
        setEntryTitle('');
        setEntryContent('');
        setIsEntryModalOpen(true);
    };

    const handleEditEntry = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setEntryTitle(entry.title);
        setEntryContent(entry.content);
        setIsEntryModalOpen(true);
    };

    const handleSaveEntry = async () => {
        if (!entryTitle.trim() || !currentMesa?.id || !currentUser?.id) return;

        setLoadingAction(true);
        try {
            let result;
            if (editingEntry) {
                result = await updateJournalEntry(editingEntry.id, { title: entryTitle, content: entryContent });
            } else {
                result = await createJournalEntry({
                    mesa_id: currentMesa.id,
                    user_id: currentUser.id,
                    title: entryTitle,
                    content: entryContent,
                });
            }

            if (result.success) {
                // TODO: Add toast notification
                setIsEntryModalOpen(false);
            } else {
                // TODO: Add error toast
                console.error("Erro ao salvar entrada:", result.message);
            }
        } catch (error) {
            console.error("Erro inesperado ao salvar entrada:", error);
            // TODO: Add error toast
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm("Tem certeza que deseja deletar esta entrada do diário?")) return;
        setLoadingAction(true);
        try {
            const result = await deleteJournalEntry(entryId);
            if (result.success) {
                // TODO: Add toast notification
            } else {
                // TODO: Add error toast
                console.error("Erro ao deletar entrada:", result.message);
            }
        } catch (error) {
            console.error("Erro inesperado ao deletar entrada:", error);
        } finally {
            setLoadingAction(false);
        }
    };


    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900 text-white">
            <div className="p-3 border-b border-op-border">
                            <OpInput 
                                placeholder="Filtrar entradas..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />            </div>
            
            <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-zinc-800">
                    {filteredEntries.length === 0 ? (
                        <li className="p-4 text-center text-zinc-500">Nenhuma entrada no diário.</li>
                    ) : (
                        filteredEntries.map(entry => (
                            <li key={entry.id} className="p-3 flex items-center justify-between hover:bg-zinc-800/50">
                                <div className="flex-1">
                                    <p className="font-bold">{entry.title}</p>
                                    <p className="text-xs text-zinc-400 truncate">{entry.content}</p>
                                </div>
                                <div className="flex gap-2">
                                    <OpButton variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                                        <Edit className="w-4 h-4 text-blue-400" />
                                    </OpButton>
                                    <OpButton variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </OpButton>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
            
            <div className="p-3 border-t border-op-border bg-zinc-950/70">
                <OpButton className="w-full" onClick={handleNewEntry}>
                    <Plus className="w-4 h-4 mr-2" /> Nova Entrada
                </OpButton>
            </div>

            {/* Entry Modal */}
            {isEntryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-op-panel border border-op-border p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-lg font-bold text-op-red mb-4">{editingEntry ? 'Editar Entrada' : 'Nova Entrada'}</h3>
                        <div className="space-y-4">
                            <OpInput 
                                label="Título"
                                value={entryTitle}
                                onChange={(e) => setEntryTitle(e.target.value)}
                                autoFocus
                            />
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Conteúdo</label>
                                <textarea 
                                    className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none h-32"
                                    value={entryContent}
                                    onChange={(e) => setEntryContent(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <OpButton variant="ghost" onClick={() => setIsEntryModalOpen(false)} className="flex-1" disabled={loadingAction}>
                                    <X className="w-4 h-4 mr-2" /> Cancelar
                                </OpButton>
                                <OpButton onClick={handleSaveEntry} className="flex-1" disabled={loadingAction || !entryTitle.trim()}>
                                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Salvar
                                </OpButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
