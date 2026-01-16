import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../store/game-store';
import { useAuth } from '../../contexts/AuthContext';
import { useSheetStore } from '../../store/useSheetStore'; // Import useSheetStore
import { Dices, Send, FileText, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { Character, DieRoll, User } from '../../core/types';
import { OpButton } from '../ui-op/OpButton';

interface ChatTabProps {
    messages: any[];
    allCharacters: Character[]; // Re-added for simplicity for now
    user: User | null;
    sendChatMessage: (content: string, type?: 'text' | 'roll' | 'system' | 'image' | 'whisper', options?: { imageUrl?: string; targetUserId?: string | null }) => Promise<void>;
}

const DiceRollDisplay: React.FC<{ roll: DieRoll, characterName: string }> = ({ roll, characterName }) => (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 my-2">
        <p className="text-xs text-zinc-400 mb-2">{characterName} rolou {roll.details}...</p>
        <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold text-op-gold">{roll.total}</p>
            <p className="text-xs text-zinc-500">
                ({roll.results.join(' + ')}
                {roll.modifier !== 0 && (roll.modifier > 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`)})
            </p>
        </div>
    </div>
);


export const ChatTab: React.FC<ChatTabProps> = ({ messages, allCharacters, user, sendChatMessage }) => {
    const [chatInput, setChatInput] = useState('');
    const [isDicePopoverOpen, setIsDicePopoverOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<string | 'all'>('all');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { setIsRollModalOpen } = useSheetStore();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (chatInput.trim()) {
            const type = targetUser === 'all' ? 'text' : 'whisper';
            const targetUserId = targetUser === 'all' ? null : targetUser;

            await sendChatMessage(chatInput, type, { targetUserId });
            setChatInput('');
        }
    };
    
    const handleQuickDiceRoll = async (dice: string) => {
        await sendChatMessage(`/roll ${dice}`, 'text');
        setIsDicePopoverOpen(false);
    }

    const handleSendImage = async () => {
        const url = prompt("Insira a URL da imagem/GIF:");
        if (url) {
            const targetUserId = targetUser === 'all' ? null : targetUser;
            await sendChatMessage("Enviou uma imagem", 'image', { imageUrl: url, targetUserId });
        }
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => {
                    const characterName = allCharacters.find(c => c.user_id === msg.user_id)?.name || 'Agente';
                    return(
                        <div key={i}>
                            {msg.type === 'text' && (
                                <div className={`text-sm`}>
                                    <span className={`font-bold text-xs block ${msg.user_id === user?.id ? 'text-op-gold' : 'text-zinc-500'}`}>
                                        {characterName}
                                    </span>
                                    {typeof msg.content === 'string' ? msg.content : msg.content.text}
                                </div>
                            )}
                            {msg.type === 'whisper' && (
                                <div className={`text-sm bg-purple-900/20 p-2 rounded border border-purple-900/50`}>
                                    <span className="font-bold text-xs block text-purple-400">
                                        {characterName} (Sussurro)
                                    </span>
                                    {msg.content.text}
                                </div>
                            )}
                            {msg.type === 'image' && (
                                <div className={`text-sm`}>
                                    <span className={`font-bold text-xs block ${msg.user_id === user?.id ? 'text-op-gold' : 'text-zinc-500'}`}>
                                        {characterName}
                                    </span>
                                    <img src={msg.content.imageUrl} alt="Chat Media" className="max-w-full rounded mt-1 border border-zinc-700" />
                                </div>
                            )}
                            {msg.type === 'roll' && (
                                <DiceRollDisplay roll={msg.content} characterName={characterName} />
                            )}
                            {msg.type === 'system' && (
                                <p className="text-sm text-yellow-500 italic text-center my-2 py-1 border-y border-yellow-500/10">
                                    {typeof msg.content === 'string' ? msg.content : msg.content.text}
                                </p>
                            )}
                        </div>
                    )
                })}
                <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-op-border bg-zinc-950/70 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <select
                        className="bg-zinc-900 border border-zinc-700 rounded p-1 text-xs text-zinc-400 outline-none max-w-[150px]"
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                    >
                        <option value="all">Todos</option>
                        {allCharacters.map(c => (
                            <option key={c.id} value={c.user_id || ''}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <div className="relative">
                        <button type="button" onClick={() => setIsDicePopoverOpen(!isDicePopoverOpen)} className="p-2 bg-zinc-800 hover:bg-op-gold/20 text-zinc-400 hover:text-op-gold border border-zinc-700 rounded transition-colors">
                            <Dices className="w-5 h-5" />
                        </button>
                        {isDicePopoverOpen && (
                            <div className="absolute bottom-full mb-2 w-56 bg-op-panel border border-op-border rounded shadow-lg z-10 p-2 flex flex-col gap-2">
                                <div className="grid grid-cols-3 gap-2">
                                    {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100'].map(dice => (
                                        <button key={dice} type="button" onClick={() => handleQuickDiceRoll(dice)} className="p-2 text-sm font-bold bg-zinc-800 hover:bg-op-gold/20 rounded border border-zinc-700">{dice}</button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsRollModalOpen(true); setIsDicePopoverOpen(false); }}
                                    className="p-2 text-sm font-bold bg-op-red/20 hover:bg-op-red/40 text-op-red border border-op-red/50 rounded flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Rolar com Ficha
                                </button>
                            </div>
                        )}
                    </div>
                    <button type="button" onClick={handleSendImage} className="p-2 bg-zinc-800 hover:bg-blue-900/30 text-zinc-400 hover:text-blue-400 border border-zinc-700 rounded transition-colors" title="Enviar Imagem">
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input className="flex-1 bg-black/40 border border-zinc-700 rounded p-2 text-sm outline-none focus:border-op-red" placeholder="Mensagem..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                    <button type="submit" className="p-2 bg-op-red hover:bg-red-500 text-white border border-red-700 rounded">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};