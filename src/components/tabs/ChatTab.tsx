import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react'; 
import { useGameStore } from '../../store/game-store';
import { useAuth } from '../../contexts/AuthContext';
import { useSheetStore } from '../../store/useSheetStore'; 
import d20Icon from '../../assets/d20-icon.svg';

export const ChatTab: React.FC = () => {
  const { currentMesa, messages, sendMessage, sendChatMessage, deleteMessage, isGM, revealRollMessage } = useGameStore();
  const { user } = useAuth();
  const { openRollModal } = useSheetStore();

  const [newMessage, setNewMessage] = useState('');
  const [isDicePopoverOpen, setIsDicePopoverOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || !currentMesa) return;
    await sendMessage(currentMesa.id, user.id, 'text', { text: newMessage });
    setNewMessage('');
  };

  const handleDiceButtonClick = (faces: number) => {
    openRollModal(faces);
    setIsDicePopoverOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-20">
        {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            if (!msg.user_id) return <div key={msg.id} className="text-center text-xs text-zinc-500 my-2">{msg.content.text}</div>;

            const isHiddenRoll = msg.type === 'roll' && msg.content.is_hidden;

            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 border border-zinc-800'} 
                                ${isHiddenRoll && isGM ? 'border-purple-500 bg-purple-900/20' : ''}`}> {/* Estilo para GM em rolagem oculta */}
                        {!isMe && <div className="text-[10px] text-op-red font-bold uppercase mb-1">Investigador</div>}
                        
                        {msg.type === 'roll' ? (
                            isHiddenRoll && !isGM ? ( // Rolagem oculta para players
                                <div className="font-mono text-sm bg-black/20 p-2 rounded border border-zinc-700 text-zinc-400">
                                    🎲 O Mestre está rolando dados...
                                </div>
                            ) : ( // Rolagem normal para todos, ou oculta para GM
                                <div className="font-mono text-sm bg-black/20 p-2 rounded border border-op-gold/20">
                                    <div className="text-op-gold font-bold text-xs mb-1 border-b border-op-gold/10 pb-1">🎲 RESULTADO</div>
                                    <div className="whitespace-pre-wrap">{msg.content.text}</div>
                                    {isHiddenRoll && isGM && ( // Botão Revelar para GM em rolagem oculta
                                        <button 
                                            onClick={() => revealRollMessage(msg.id)} 
                                            className="mt-2 px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-full"
                                        >
                                            Revelar para Todos
                                        </button>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="whitespace-pre-wrap text-sm">{msg.content.text}</div>
                        )}
                        
                        <div className="flex justify-between items-center mt-1 text-[9px] text-zinc-600">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            {isMe && <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 ml-2"><Trash2 className="w-3 h-3"/></button>}
                        </div>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2 items-center absolute bottom-0 w-full">
        <div className="relative">
            <button type="button" onClick={() => setIsDicePopoverOpen(!isDicePopoverOpen)} className={`p-2 rounded border ${isDicePopoverOpen ? 'bg-op-gold/20 text-op-gold border-op-gold' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                <img src={d20Icon} className="w-6 h-6" />
            </button>
            {isDicePopoverOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl p-2 z-50 grid grid-cols-4 gap-2">
                    {[3, 4, 6, 8, 10, 12, 20, 100].map(faces => 
                        <button key={faces} onClick={() => handleDiceButtonClick(faces)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded border border-zinc-800">
                            d{faces}
                        </button>
                    )}
                </div>
            )}
        </div>
        <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Enviar mensagem..." className="flex-1 bg-zinc-950 text-white text-sm rounded border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"/>
            <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-op-red hover:bg-red-700 text-white rounded"><Send className="w-4 h-4"/></button>
        </form>
      </div>
    </div>
  );
};