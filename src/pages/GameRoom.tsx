import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { CharacterSheet } from '../components/CharacterSheet';
import { MapBoard } from '../components/MapBoard';
import { OpButton } from '../components/ui-op/OpButton';
import { useToast } from '../components/ui-op/OpToast';
import { 
    Users, MessageSquare, History, Package, Map as MapIcon, 
    User as UserIcon, LogOut, Copy, Shield, Skull, PlusCircle, 
    ChevronRight, ChevronLeft, Dice1, Menu, Eye, Heart, Zap, BookOpen,
    Check, XCircle, UserPlus, Crown, Image, Send, ImagePlus, ChevronUp
} from 'lucide-react';
import { OpInput } from '../components/ui-op/OpInput';
import { CombatScreen } from './CombatScreen';
import { OpFileUpload } from '../components/ui-op/OpFileUpload';
import monstersData from '../data/rules/monsters.json';
import { AttributeName, InventoryItem, ClassName } from '../core/types';
import { getPendingPlayers, updatePlayerStatus, promotePlayer } from '../lib/mesa';

export const GameRoom: React.FC = () => {
  const { id: mesaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const { 
    initialize, isLoading, currentMesa, allCharacters, unsubscribe, 
    spawnMonster, sendChatMessage, giveItemToCharacter, activeScene, createScene,
    messages, logs, needsCharacterCreation, character, approvalStatus, playerRole,
    updateScene, createPlayerToken, shareImage, toggleCanEvolve
  } = useGameStore();
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isDicePopoverOpen, setIsDicePopoverOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user && mesaId) initialize(user, mesaId);
    return () => unsubscribe();
  }, [user, mesaId, initialize, unsubscribe]);

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

  if (isLoading || !currentMesa) {
    return (
      <div className="h-screen bg-op-bg flex items-center justify-center text-op-red">
        <p>Sincronizando Realidade...</p>
      </div>
    );
  }
  
  if (approvalStatus !== 'approved') {
      return (
          <div className="h-screen bg-op-bg flex flex-col items-center justify-center text-zinc-300 p-8 text-center">
              <h2>Acesso Restrito</h2>
              <p>Aguarde a aprovação do mestre.</p>
              <button onClick={() => navigate('/lobby')}>Retornar ao QG</button>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-op-bg text-zinc-100 overflow-hidden font-sans">
      <aside className={`
          fixed md:relative inset-y-0 left-0 z-40 bg-op-panel border-r border-op-border flex flex-col shadow-2xl transition-transform duration-300
          ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-80
      `}>
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-op-border">
                <h2 className="font-bold text-lg">{currentMesa.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`text-sm ${msg.type === 'system' ? 'text-yellow-500 italic' : ''}`}>
                        {msg.type !== 'system' && (
                            <span className={`font-bold text-xs block ${msg.user_id === user?.id ? 'text-op-gold' : 'text-zinc-500'}`}>
                                {allCharacters.find(c => c.user_id === msg.user_id)?.name || 'Agente'}
                            </span>
                        )}
                        {msg.content.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-op-border bg-zinc-900">
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
                                <button type="button" className="col-span-3 p-2 text-sm font-bold bg-blue-900/50 hover:bg-blue-800/50 rounded border border-blue-700">Rolar da Ficha</button>
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
      </aside>
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
            {character ? <CharacterSheet /> : <p>Modo Mestre</p>}
        </div>
      </main>
    </div>
  );
};