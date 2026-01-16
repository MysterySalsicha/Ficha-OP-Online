import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../store/game-store';
import { useAuth } from '../../contexts/AuthContext';
import { Dice1, Send } from 'lucide-react';
import { Character, DieRoll, User } from '../../core/types';

interface ChatTabProps {
    messages: any[];
    allCharacters: Character[];
    user: User | null;
    sendChatMessage: (content: string) => Promise<void>;
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
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (chatInput.trim()) {
            await sendChatMessage(chatInput);
            setChatInput('');
        }
    };
    
    const handleQuickDiceRoll = async (dice: string) => {
        await sendChatMessage(`/roll ${dice}`);
        setIsDicePopoverOpen(false);
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
                                    {msg.content.text}
                                </div>
                            )}
                            {msg.type === 'roll' && (
                                <DiceRollDisplay roll={msg.content} characterName={characterName} />
                            )}
                            {msg.type === 'system' && (
                                <p className="text-sm text-yellow-500 italic text-center my-2 py-1 border-y border-yellow-500/10">
                                    {msg.content.text}
                                </p>
                            )}
                        </div>
                    )
                })}
                <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-op-border bg-zinc-950/70">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <div className="relative">
                        <button type="button" onClick={() => setIsDicePopoverOpen(!isDicePopoverOpen)} className="p-2 bg-zinc-800 hover:bg-op-gold/20 text-zinc-400 hover:text-op-gold border border-zinc-700 rounded transition-colors">
                            <Dice1 className="w-5 h-5" />
                        </button>
                        {isDicePopoverOpen && (
                            <div className="absolute bottom-full mb-2 w-56 bg-op-panel border border-op-border rounded shadow-lg z-10 p-2 grid grid-cols-3 gap-2">
                                {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100'].map(dice => (
                                    <button key={dice} type="button" onClick={() => handleQuickDiceRoll(dice)} className="p-2 text-sm font-bold bg-zinc-800 hover:bg-op-gold/20 rounded border border-zinc-700">{dice}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <input className="flex-1 bg-black/40 border border-zinc-700 rounded p-2 text-sm outline-none focus:border-op-red" placeholder="Mensagem..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                    <button type="submit" className="p-2 bg-op-red hover:bg-red-500 text-white border border-red-700 rounded">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
