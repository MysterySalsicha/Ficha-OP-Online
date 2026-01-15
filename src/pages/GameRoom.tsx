import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { CharacterSheet } from '../components/CharacterSheet';
import { ChatPanel } from '../components/ChatPanel';
import { MapBoard } from '../components/MapBoard';
import { InitiativeTracker } from '../components/InitiativeTracker';
import { OpButton } from '../components/ui-op/OpButton';
import { useToast } from '../components/ui-op/OpToast';
import { 
    Users, MessageSquare, History, Package, Map as MapIcon, 
    User as UserIcon, LogOut, Copy, Shield, Skull, PlusCircle, 
    ChevronRight, ChevronLeft, Dices, Menu, Eye, Heart, Zap, BookOpen,
    Check, XCircle, UserPlus, Crown
} from 'lucide-react';
import { OpInput } from '../components/ui-op/OpInput';
import { OpFileUpload } from '../components/ui-op/OpFileUpload';
import monstersData from '../data/rules/monsters.json';
import itemsData from '../data/rules/items.json';
import { rollDice } from '../engine/dice';
import { AttributeName } from '../core/types';
import { getPendingPlayers, updatePlayerStatus, promotePlayer } from '../lib/mesa';

export const GameRoom: React.FC = () => {
  const { id: mesaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const { 
    initialize, isLoading, currentMesa, allCharacters, unsubscribe, 
    spawnMonster, sendChatMessage, giveItemToCharacter, activeScene, createScene,
    messages, logs, needsCharacterCreation, character, approvalStatus, playerRole
  } = useGameStore();
  
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'sheet' | 'map'>('sheet');
  const [leftTab, setLeftTab] = useState<'chat' | 'players' | 'log'>('chat');
  const [rightTab, setRightTab] = useState<'players' | 'library' | 'requests'>('players');
  const [librarySubTab, setLibrarySubTab] = useState<'bestiario' | 'itens'>('bestiario');
  const [chatInput, setChatInput] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const [isRolling, setIsRolling] = useState(false);
  const [rollConfig, setRollConfig] = useState({ skill: '', attr: 'agi', bonus: 0, advantage: 0 });

  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapImage, setNewMapImage] = useState('');
  
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && mesaId) initialize(user, mesaId);
    if (window.innerWidth < 1024) setRightSidebarOpen(false);
    return () => unsubscribe();
  }, [user, mesaId]);

  // isGM agora verifica se o playerRole é 'gm' (que inclui o dono e os co-gms)
  const isGM = playerRole === 'gm';
  const isOwner = currentMesa?.gm_id === user?.id;

  const loadPending = async () => {
    if (isGM && mesaId) {
        const p = await getPendingPlayers(mesaId);
        setPendingPlayers(p || []);
    }
  };

  useEffect(() => {
    if (isGM) {
        loadPending();
        const interval = setInterval(loadPending, 10000); // Polling simples
        return () => clearInterval(interval);
    }
  }, [isGM, mesaId]);

  const handleApprove = async (userId: string) => {
      if (!mesaId) return;
      try {
          await updatePlayerStatus(mesaId, userId, 'approved');
          showToast('Agente aprovado!', 'success');
          loadPending();
      } catch (e) {
          showToast('Erro ao aprovar.', 'error');
      }
  };

  const handleReject = async (userId: string) => {
      if (!mesaId) return;
      try {
          await updatePlayerStatus(mesaId, userId, 'rejected');
          showToast('Solicitação rejeitada.', 'success');
          loadPending();
      } catch (e) {
          showToast('Erro ao rejeitar.', 'error');
      }
  };

  const handlePromote = async (userId: string, userName: string) => {
      if (!mesaId || !confirm(`Tem certeza que deseja promover ${userName} a Mestre Auxiliar? Ele terá controle total sobre a mesa.`)) return;
      try {
          await promotePlayer(mesaId, userId);
          showToast(`${userName} promovido a Mestre!`, 'success');
      } catch (e) {
          showToast('Erro ao promover.', 'error');
      }
  };

  useEffect(() => {
      if (needsCharacterCreation && mesaId && approvalStatus === 'approved') navigate(`/criar-personagem/${mesaId}`);
  }, [needsCharacterCreation, mesaId, navigate, approvalStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleCopyCode = () => {
      navigator.clipboard.writeText(currentMesa?.code || '');
      showToast('Código copiado!', 'success');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (chatInput.trim()) {
          await sendChatMessage(chatInput);
          setChatInput('');
      }
  };

  const handleSpawn = async (monsterId: string) => {
      const result = await spawnMonster(monsterId);
      showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleGiveItem = async (targetCharId: string) => {
      if (!selectedItem) return;
      const itemPayload = {
          name: selectedItem.nome || selectedItem.name,
          category: 'equipamento' as any,
          slots: selectedItem.espacos || selectedItem.slots || 1,
          weight: 0,
          quantity: 1,
          stats: selectedItem,
          access_category: selectedItem.categoria || 1
      };
      
      const result = await giveItemToCharacter(itemPayload, targetCharId);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) setSelectedItem(null);
  };

  const handleCreateMap = async () => {
      if (!newMapName || !newMapImage) return;
      const result = await createScene(newMapName, newMapImage);
      if (result.success) {
          setViewMode('map');
          setIsCreatingMap(false);
          setNewMapName('');
          setNewMapImage('');
          showToast('Mapa criado!', 'success');
      } else {
          showToast(result.message, 'error');
      }
  };

  const handleRollClick = () => setIsRolling(true);

  const confirmRoll = async () => {
      const diceCount = (character?.attributes[rollConfig.attr as AttributeName] || 1) + (rollConfig.advantage);
      const diceStr = `${diceCount > 0 ? diceCount : 2}d20`;
      const rollType = rollConfig.advantage !== 0 ? (rollConfig.advantage > 0 ? 'Vantagem' : 'Desvantagem') : 'Normal';
      const msg = `/roll ${diceStr} (${rollConfig.skill || rollConfig.attr.toUpperCase()} - ${rollType})`;
      await sendChatMessage(msg);
      setIsRolling(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-op-bg flex items-center justify-center text-op-red">
        <p className="animate-pulse text-xl font-bold uppercase tracking-widest font-typewriter">Sincronizando Realidade...</p>
      </div>
    );
  }

  if (approvalStatus === 'pending') {
      return (
          <div className="h-screen bg-op-bg flex flex-col items-center justify-center text-zinc-300 p-8 text-center bg-noise">
              <div className="bg-op-panel p-8 border border-op-gold/50 shadow-2xl max-w-md w-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-20"><Shield className="w-24 h-24 text-op-gold" /></div>
                  <h2 className="text-2xl font-bold font-typewriter text-op-gold mb-4 uppercase tracking-widest">Acesso Restrito</h2>
                  <p className="mb-6 leading-relaxed">Suas credenciais estão sob análise da Ordo Realitas. Aguarde a autorização do oficial responsável (Mestre) para acessar esta missão.</p>
                  <OpButton onClick={() => navigate('/lobby')} variant="ghost" className="w-full"><LogOut className="w-4 h-4 mr-2" /> Retornar ao QG</OpButton>
              </div>
          </div>
      );
  }

  if (approvalStatus === 'rejected') {
    return (
        <div className="h-screen bg-op-bg flex flex-col items-center justify-center text-zinc-300 p-8 text-center bg-noise">
            <div className="bg-op-panel p-8 border border-op-red shadow-2xl max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-20"><Skull className="w-24 h-24 text-op-red" /></div>
                <h2 className="text-2xl font-bold font-typewriter text-op-red mb-4 uppercase tracking-widest">Acesso Negado</h2>
                <p className="mb-6 leading-relaxed">Suas credenciais foram rejeitadas ou sua presença nesta operação foi revogada.</p>
                <OpButton onClick={() => navigate('/lobby')} variant="ghost" className="w-full"><LogOut className="w-4 h-4 mr-2" /> Retornar ao QG</OpButton>
            </div>
        </div>
    );
  }

  if (!currentMesa) return null;

  return (
    <div className="flex h-screen bg-op-bg text-zinc-100 overflow-hidden font-sans relative bg-noise">
      <div className="scanline absolute inset-0 z-0 opacity-10 pointer-events-none"></div>

      {/* MOBILE MENU TRIGGER */}
      <div className="md:hidden fixed top-3 left-4 z-50">
          <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="bg-op-panel p-2 rounded border border-op-border text-zinc-300">
              <Menu className="w-5 h-5" />
          </button>
      </div>

      {/* --- ESQUERDA: COMUNICAÇÃO & INFO (300px) --- */}
      <aside className={`
          fixed md:relative inset-y-0 left-0 z-40 bg-op-panel border-r border-op-border flex flex-col shadow-2xl transition-transform duration-300
          ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-80
      `}>
        <div className="h-14 border-b border-op-border flex items-center px-4 bg-zinc-900/50 justify-between">
            <h1 className="font-typewriter font-bold text-lg text-zinc-200 tracking-tighter truncate flex-1">
                {currentMesa.name}
            </h1>
            <div className="flex gap-1">
                <button onClick={() => setLeftTab('chat')} className={`p-2 rounded hover:bg-zinc-800 ${leftTab === 'chat' ? 'text-op-red' : 'text-zinc-500'}`}><MessageSquare className="w-4 h-4" /></button>
                <button onClick={() => setLeftTab('players')} className={`p-2 rounded hover:bg-zinc-800 ${leftTab === 'players' ? 'text-op-red' : 'text-zinc-500'}`}><Users className="w-4 h-4" /></button>
                <button onClick={() => setLeftTab('log')} className={`p-2 rounded hover:bg-zinc-800 ${leftTab === 'log' ? 'text-op-red' : 'text-zinc-500'}`}><History className="w-4 h-4" /></button>
            </div>
            <button className="md:hidden ml-2 text-zinc-500" onClick={() => setLeftSidebarOpen(false)}><ChevronLeft className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-hidden relative">
            {leftTab === 'chat' && (
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`text-sm ${msg.type === 'system' ? 'text-yellow-500 italic text-xs text-center border-y border-yellow-900/30 py-1' : ''}`}>
                                {msg.type !== 'system' && (
                                    <span className={`font-bold text-[10px] block uppercase mb-0.5 ${msg.user_id === user?.id ? 'text-op-gold' : 'text-zinc-500'}`}>
                                        {msg.user_id === user?.id ? 'Você' : 'Agente'}
                                    </span>
                                )}
                                {msg.type === 'roll' ? (
                                    <div className={`inline-block border px-2 py-1 rounded bg-zinc-900 ${msg.content.is_critical ? 'border-op-red text-op-red' : 'border-zinc-700 text-zinc-300'}`}>
                                        🎲 <strong>{msg.content.total}</strong> <span className="text-zinc-500 text-xs">({msg.content.details})</span>
                                    </div>
                                ) : (
                                    <span className="text-zinc-300">{msg.content.text}</span>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t border-op-border bg-op-panel">
                        <div className="flex gap-2">
                            <button onClick={handleRollClick} className="p-2 bg-zinc-800 hover:bg-op-gold/20 text-zinc-400 hover:text-op-gold border border-zinc-700 rounded transition-colors">
                                <Dices className="w-5 h-5" />
                            </button>
                            <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                                <input className="flex-1 bg-black/40 border border-zinc-700 rounded p-2 text-sm outline-none focus:border-op-red transition-colors text-zinc-200 placeholder:text-zinc-600" placeholder="Mensagem..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {leftTab === 'players' && (
                <div className="p-4 space-y-3 overflow-y-auto h-full custom-scrollbar">
                    {allCharacters.map(char => (
                        <div key={char.id} className={`bg-zinc-900/50 border p-3 rounded flex items-center gap-3 ${char.is_npc ? 'border-red-900/30' : 'border-zinc-700'}`}>
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-zinc-800 ${char.user_id === user?.id ? 'border-op-gold' : 'border-zinc-600'}`}>
                                <span className="font-bold text-xs">{char.name.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-200 truncate">{char.name}</p>
                                <div className="flex gap-2 mt-1">
                                    <div className="h-1 flex-1 bg-zinc-800 rounded overflow-hidden"><div className="h-full bg-red-600" style={{ width: `${(char.stats_current.pv / char.stats_max.pv) * 100}%` }}></div></div>
                                    <div className="h-1 flex-1 bg-zinc-800 rounded overflow-hidden"><div className="h-full bg-yellow-500" style={{ width: `${(char.stats_current.pe / char.stats_max.pe) * 100}%` }}></div></div>
                                </div>
                            </div>
                            {isOwner && char.user_id && char.user_id !== user?.id && !char.is_npc && (
                                <button onClick={() => handlePromote(char.user_id!, char.name)} className="p-1 hover:bg-op-gold/20 rounded text-zinc-600 hover:text-op-gold transition-colors" title="Promover a Mestre Auxiliar">
                                    <Crown className="w-4 h-4" />
                                </button>
                            )}
                            {isGM && <Eye className="w-4 h-4 text-zinc-600 hover:text-white cursor-pointer" />}
                        </div>
                    ))}
                </div>
            )}

            {leftTab === 'log' && (
                <div className="p-4 space-y-4 overflow-y-auto h-full custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className="text-xs border-l-2 border-zinc-700 pl-3 py-1">
                            <span className="block text-zinc-500 font-mono mb-0.5">{new Date(log.created_at).toLocaleTimeString()}</span>
                            <p className="text-zinc-300">{log.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </aside>

      {/* --- CENTRO --- */}
      <main className="flex-1 flex flex-col relative bg-transparent w-full z-10 min-w-0">
        <header className="h-14 bg-op-bg/90 border-b border-op-border flex items-center px-4 md:px-6 justify-between backdrop-blur-md z-20 pl-16 md:pl-6 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="font-black tracking-tighter uppercase text-sm text-op-red truncate hidden sm:block font-typewriter">{currentMesa.name}</h2>
            <div className="flex bg-op-panel rounded p-0.5 border border-op-border">
                <button onClick={() => setViewMode('sheet')} className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 uppercase tracking-wide ${viewMode === 'sheet' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}><UserIcon className="w-3 h-3" /> Ficha</button>
                <button onClick={() => setViewMode('map')} className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 uppercase tracking-wide ${viewMode === 'map' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}><MapIcon className="w-3 h-3" /> Mapa</button>
            </div>
          </div>
          <div className="flex gap-2">
             {isGM && (
                 <button onClick={() => setIsCreatingMap(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase bg-op-red/10 text-op-red hover:bg-op-red/20 px-3 py-1.5 rounded transition-colors border border-op-red/30">
                   <MapIcon className="w-3 h-3" /> Novo Mapa
                 </button>
             )}
             <button className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase bg-op-panel hover:bg-zinc-800 px-3 py-1.5 rounded border border-op-border text-zinc-400"><BookOpen className="w-3 h-3" /> Docs</button>
             <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className="md:hidden flex items-center gap-2 text-[10px] font-bold uppercase bg-op-panel hover:bg-zinc-800 px-3 py-1.5 rounded border border-op-border"><Package className="w-3 h-3" /> Lib</button>
             <button onClick={() => navigate('/lobby')} className="p-2 text-zinc-600 hover:text-red-500 transition-colors" title="Sair da Mesa">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
            <InitiativeTracker />
            {viewMode === 'sheet' ? (
                <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-5xl mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border border-op-border bg-op-panel">
                        {character ? <CharacterSheet /> : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-20">
                                <Crown className="w-16 h-16 text-op-gold mb-4 opacity-50" />
                                <h3 className="text-xl font-bold font-typewriter text-zinc-400">Modo Observador</h3>
                                <p className="text-sm">Você é um Mestre Auxiliar. Você tem acesso total à mesa, mas não possui uma ficha de personagem.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <MapBoard />
            )}
        </div>

        {character && (
            <footer className="h-16 bg-op-panel border-t border-op-border flex items-center px-6 gap-6 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3 border-r border-op-border pr-6">
                    <div className="w-10 h-10 rounded border border-op-gold/50 bg-op-gold/10 flex items-center justify-center">
                        <span className="font-typewriter font-bold text-op-gold">{character.name.substring(0, 2)}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-zinc-200 uppercase">{character.name}</span>
                        <span className="block text-[10px] text-zinc-500 uppercase">{character.class} • NEX {character.nex}%</span>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4 max-w-xl">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-red-500"><span>PV</span> <span>{character.stats_current.pv}/{character.stats_max.pv}</span></div>
                        <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800"><div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(character.stats_current.pv / character.stats_max.pv) * 100}%` }}></div></div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-yellow-500"><span>PE</span> <span>{character.stats_current.pe}/{character.stats_max.pe}</span></div>
                        <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800"><div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(character.stats_current.pe / character.stats_max.pe) * 100}%` }}></div></div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-blue-500"><span>SAN</span> <span>{character.stats_current.san}/{character.stats_max.san}</span></div>
                        <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800"><div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(character.stats_current.san / character.stats_max.san) * 100}%` }}></div></div>
                    </div>
                </div>
            </footer>
        )}
      </main>

      {/* --- DIREITA --- */}
      <aside className={`fixed md:relative inset-y-0 right-0 z-30 bg-op-panel border-l border-op-border w-80 shadow-2xl transform transition-transform duration-300 ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-op-border flex justify-between items-center whitespace-nowrap bg-op-panel sticky top-0 z-10">
          <h3 className="font-bold uppercase text-xs tracking-widest text-zinc-400 font-typewriter">Painel</h3>
          <button className="md:hidden text-zinc-500" onClick={() => setRightSidebarOpen(false)}><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex p-2 gap-1 border-b border-op-border bg-op-bg/50">
            <button onClick={() => setRightTab('players')} className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-sm border ${rightTab === 'players' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>Mesa</button>
            {isGM && <button onClick={() => setRightTab('library')} className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-sm border ${rightTab === 'library' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>Biblioteca</button>}
            {isGM && <button onClick={() => setRightTab('requests')} className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-sm border ${rightTab === 'requests' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-transparent hover:text-zinc-300'} ${pendingPlayers.length > 0 ? 'text-op-gold' : ''}`}>
               Reqs {pendingPlayers.length > 0 && `(${pendingPlayers.length})`}
            </button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {rightTab === 'players' && allCharacters.map(char => (
                <div key={char.id} className={`bg-zinc-900/50 border p-3 rounded flex items-center gap-3 mb-2 ${char.is_npc ? 'border-red-900/30' : 'border-zinc-700'}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center bg-zinc-950 font-bold text-xs ${char.is_npc ? 'border-red-500 text-red-500' : 'border-zinc-500 text-zinc-300'}`}>{char.name.substring(0, 2)}</div>
                    <span className="text-sm font-bold text-zinc-200 truncate flex-1">{char.name}</span>
                    {isOwner && char.user_id && char.user_id !== user?.id && !char.is_npc && (
                        <button onClick={() => handlePromote(char.user_id!, char.name)} className="p-1 hover:bg-op-gold/20 rounded text-zinc-600 hover:text-op-gold transition-colors" title="Promover a Mestre Auxiliar">
                            <Crown className="w-4 h-4" />
                        </button>
                    )}
                    {isGM && <Eye className="w-4 h-4 text-zinc-600 hover:text-white cursor-pointer" />}
                </div>
            ))}

            {rightTab === 'requests' && isGM && (
                <div className="space-y-2">
                    {pendingPlayers.length === 0 && <p className="text-zinc-500 text-xs text-center py-4">Nenhuma solicitação pendente.</p>}
                    {pendingPlayers.map(req => (
                        <div key={req.user_id} className="bg-zinc-900/80 border border-zinc-700 p-3 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-black rounded-full border border-zinc-600 overflow-hidden">
                                     {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-auto text-zinc-500" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-200">{req.profiles?.username || 'Desconhecido'}</p>
                                    <p className="text-[10px] text-op-gold uppercase">Solicitando acesso</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleApprove(req.user_id)} className="flex-1 bg-green-900/20 border border-green-700/50 hover:bg-green-900/40 text-green-400 py-1 rounded text-xs font-bold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Aceitar</button>
                                <button onClick={() => handleReject(req.user_id)} className="flex-1 bg-red-900/20 border border-red-700/50 hover:bg-red-900/40 text-red-400 py-1 rounded text-xs font-bold flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Recusar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {rightTab === 'library' && isGM && (
                <div className="space-y-4">
                    <div className="flex gap-1 mb-2">
                        <button onClick={() => setLibrarySubTab('bestiario')} className={`flex-1 py-1 text-[10px] uppercase font-bold rounded ${librarySubTab === 'bestiario' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Monstros</button>
                        <button onClick={() => setLibrarySubTab('itens')} className={`flex-1 py-1 text-[10px] uppercase font-bold rounded ${librarySubTab === 'itens' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Itens</button>
                    </div>
                    {librarySubTab === 'bestiario' && monstersData.map((m) => (
                        <div key={m.id} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded hover:border-op-red/50 cursor-pointer group flex justify-between items-center">
                            <div><h4 className="font-bold text-xs text-zinc-200">{m.name}</h4><span className="text-[10px] text-op-red">VD {m.vd}</span></div>
                            <button onClick={() => handleSpawn(m.id)} className="opacity-0 group-hover:opacity-100 text-op-red hover:bg-op-red/10 p-1 rounded"><PlusCircle className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {librarySubTab === 'itens' && (itemsData.armas_simples as any[]).slice(0, 10).map((i: any, idx) => (
                        <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-2 rounded hover:border-op-gold/50 flex justify-between items-center group relative">
                            <span className="text-xs text-zinc-400">{i.nome}</span>
                            <div className="relative group/btn">
                                <button className="bg-zinc-700 hover:bg-green-600 hover:text-white text-zinc-400 p-1 rounded transition-colors" onClick={() => setSelectedItem(selectedItem === i ? null : i)}><Package className="w-3 h-3" /></button>
                                {selectedItem === i && <div className="absolute right-0 top-full mt-1 bg-op-panel border border-op-border rounded shadow-xl p-1 z-50 w-32">
                                    <p className="text-[9px] uppercase font-bold text-zinc-500 mb-1 px-1">Enviar para:</p>
                                    {allCharacters.filter(c => !c.is_npc).map(char => (
                                        <button key={char.id} onClick={() => handleGiveItem(char.id)} className="w-full text-left text-xs p-1.5 hover:bg-zinc-800 rounded text-zinc-300 truncate">{char.name}</button>
                                    ))}
                                </div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </aside>

      {/* MODAL DE CRIAÇÃO DE MAPA */}
      {isCreatingMap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-op-panel border border-op-border p-6 w-full max-w-md shadow-2xl relative">
                  <h3 className="text-lg font-bold text-zinc-200 mb-4 font-typewriter">Definir Local</h3>
                  <div className="space-y-4">
                      <OpInput label="Nome do Local" value={newMapName} onChange={(e) => setNewMapName(e.target.value)} />
                      <OpFileUpload label="Imagem do Mapa" onUpload={(url) => setNewMapImage(url)} />
                      <div className="flex gap-2 pt-2">
                          <OpButton variant="ghost" onClick={() => setIsCreatingMap(false)} className="flex-1">Cancelar</OpButton>
                          <OpButton onClick={handleCreateMap} className="flex-1">Confirmar</OpButton>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE ROLAGEM */}
      {isRolling && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold text-zinc-200 mb-4 font-typewriter text-center">Configurar Rolagem</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">Atributo Base</label>
                          <div className="grid grid-cols-5 gap-2">
                              {['for', 'agi', 'int', 'pre', 'vig'].map(attr => (
                                  <button key={attr} onClick={() => setRollConfig({...rollConfig, attr})} className={`p-2 rounded border uppercase font-bold text-xs ${rollConfig.attr === attr ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}>{attr}</button>
                              ))}
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setRollConfig({...rollConfig, advantage: -1})} className={`flex-1 p-2 border rounded text-xs uppercase font-bold ${rollConfig.advantage === -1 ? 'bg-red-900/30 border-red-500 text-red-500' : 'border-zinc-700 text-zinc-500'}`}>Desvantagem</button>
                          <button onClick={() => setRollConfig({...rollConfig, advantage: 0})} className={`flex-1 p-2 border rounded text-xs uppercase font-bold ${rollConfig.advantage === 0 ? 'bg-zinc-800 border-zinc-500 text-white' : 'border-zinc-700 text-zinc-500'}`}>Normal</button>
                          <button onClick={() => setRollConfig({...rollConfig, advantage: 1})} className={`flex-1 p-2 border rounded text-xs uppercase font-bold ${rollConfig.advantage === 1 ? 'bg-green-900/30 border-green-500 text-green-500' : 'border-zinc-700 text-zinc-500'}`}>Vantagem</button>
                      </div>
                      <OpButton onClick={confirmRoll} className="w-full mt-4">Rolar Dados</OpButton>
                      <button onClick={() => setIsRolling(false)} className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-2">Cancelar</button>
                  </div>
              </div>
          </div>
      )}

      {/* Botão de Toggle da Sidebar Direita (Desktop) */}
      <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={`hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-zinc-800 border border-zinc-700 p-1 rounded-l-md hover:bg-zinc-700 transition-all ${rightSidebarOpen ? 'right-80' : 'right-0'}`}>
        {rightSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

    </div>
  );
};