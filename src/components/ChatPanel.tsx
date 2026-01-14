import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/game-store';

export const ChatPanel: React.FC = () => {
    const { messages, currentUser } = useGameStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="absolute bottom-16 left-4 w-96 max-h-64 overflow-y-auto bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 shadow-xl z-20 backdrop-blur-sm pointer-events-auto">
            <div className="flex flex-col gap-2">
                {messages.map((msg) => {
                    const isRoll = msg.type === 'roll';
                    const isMe = msg.user_id === currentUser?.id;
                    
                    return (
                        <div key={msg.id} className={`text-sm ${isMe ? 'text-right' : 'text-left'}`}>
                            <span className="text-[10px] font-bold text-zinc-500 block mb-0.5">
                                {isMe ? 'Você' : 'Agente'}
                            </span>
                            
                            {isRoll ? (
                                <div className={`inline-block bg-zinc-800 border ${msg.content.is_critical ? 'border-yellow-500 text-yellow-500' : 'border-zinc-700'} rounded px-2 py-1`}>
                                    <span className="font-bold">🎲 {msg.content.total}</span>
                                    <span className="text-[10px] text-zinc-500 ml-2">({msg.content.details})</span>
                                </div>
                            ) : (
                                <span className="bg-zinc-800/50 px-2 py-1 rounded inline-block text-zinc-300">
                                    {msg.content.text}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
