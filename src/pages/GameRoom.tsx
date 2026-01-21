import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { MapBoard } from '../components/MapBoard';
import { ChatTab } from '../components/tabs/ChatTab';
import { CharacterSheet } from '../components/CharacterSheet';
import { CombatTab } from '../components/tabs/CombatTab';
import { SettingsTab } from '../components/tabs/SettingsTab';
import { GlobalRollModal } from '../components/modals/GlobalRollModal';
import { MessageSquare, Shield, Users, Sword, Package, Book, Settings, Skull, Clapperboard, Menu, X, ShieldAlert } from 'lucide-react';


export const GameRoom: React.FC = () => {
  const { id: mesaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    initialize, 
    currentMesa, 
    isLoading, 
    subscribeToChanges,
    playerRole,
    approvalStatus,
    needsCharacterCreation,
    unsubscribe,
    joinMesa, // Adicionado
    currentUserPlayer // Adicionado
  } = useGameStore();

  const [activeTab, setActiveTab] = useState('chat');
  const [visualMode, setVisualMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const navRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const hasInitialized = useRef(false);

  // Lógica de Permissão
  const isOwner = currentMesa?.mestre_id === user?.id;
  const playerStatus = currentUserPlayer?.status; // pode ser undefined
  const isApproved = playerStatus === 'approved';

  // AUTO-CORREÇÃO DO MESTRE: Se for dono e não estiver na lista, insere silenciosamente
  useEffect(() => {
      if (currentMesa && user && isOwner && !currentUserPlayer) {
          // Chama função para se auto-adicionar como GM
          // ATENÇÃO: joinMesa espera o código da mesa, não o ID.
          if (currentMesa.code) {
            joinMesa(currentMesa.code, user.id); 
          }
      }
  }, [currentMesa, user, isOwner, currentUserPlayer, joinMesa]); // Adicionado joinMesa nas dependências


  useEffect(() => { 
    if (user && mesaId && !hasInitialized.current) {
      initialize(user, mesaId);
      hasInitialized.current = true;
    }
  }, [user, mesaId, initialize]);

  useEffect(() => {
    if (currentMesa) {
      subscribeToChanges(currentMesa.id);
      return () => { unsubscribe(); }; // Chamar a função `unsubscribe` da store
    }
  }, [currentMesa, subscribeToChanges, unsubscribe]);


  if (isLoading) return <div className="h-screen bg-op-bg flex items-center justify-center text-op-red animate-pulse">Sincronizando...</div>;
  
  if (!currentMesa) return <div className="h-screen bg-op-bg flex items-center justify-center text-zinc-500"><p>Erro: Dados da mesa não carregados.</p></div>;


  // BLOQUEIO DE SEGURANÇA
  // Se NÃO for dono E (não tem player OU não está aprovado)
  if (!isOwner && (!currentUserPlayer || !isApproved)) {
      return (
          <div className="h-screen bg-op-bg flex flex-col items-center justify-center text-zinc-300 p-8 text-center animate-in fade-in">
              <ShieldAlert className="w-16 h-16 text-op-red mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                  {!currentUserPlayer ? 'Mesa Encontrada' : 'Acesso Restrito'}
              </h2>
              
              <p className="mb-6 max-w-md">
                  {!currentUserPlayer 
                      ? `Você encontrou a mesa "${currentMesa?.name || '...' }". Deseja solicitar participação?`
                      : `Seu status atual é: `
                  }
                  {currentUserPlayer && <span className="uppercase font-bold text-op-gold">{playerStatus}</span>}
              </p>

              {!currentUserPlayer ? (
                  // BOTÃO DE SOLICITAR ENTRADA
                  <button 
                      onClick={() => joinMesa(currentMesa!.code!, user!.id)}
                      className="px-6 py-3 bg-op-red hover:bg-red-700 text-white font-bold rounded shadow-lg transition-all flex items-center gap-2"
                  >
                      <Users className="w-5 h-5" /> Solicitar Entrada
                  </button>
              ) : (
                  // BOTÃO DE VOLTAR (Para quem está pendente/banido)
                  <button 
                      onClick={() => navigate('/lobby')}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-white"
                  >
                      Voltar ao QG
                  </button>
              )}
          </div>
      );
  }

  const isGM = isOwner || currentUserPlayer?.role === 'gm';
  const allTabs = [
    { name: 'chat', icon: MessageSquare, label: 'Chat' },
    { name: 'sheet', icon: Users, label: 'Ficha' },
    { name: 'combat', icon: Sword, label: 'Combate' },
    { name: 'items', icon: Package, label: 'Itens' },
    { name: 'journal', icon: Book, label: 'Diário' },
    { name: 'settings', icon: Settings, label: 'Config' },
  ];
  if (isGM) {
     allTabs.splice(3, 0, { name: 'creatures', icon: Skull, label: 'Ameaças' });
     allTabs.splice(3, 0, { name: 'scenes', icon: Clapperboard, label: 'Cenas' });
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatTab />;
      case 'sheet': return <CharacterSheet />;
      case 'combat': return <CombatTab />;
      case 'settings': return <SettingsTab />;
      default: return <div className="p-4 text-zinc-500">Em desenvolvimento...</div>;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!navRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - navRef.current.offsetLeft);
    setScrollLeftPos(navRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !navRef.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    navRef.current.scrollLeft = scrollLeftPos - walk;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-op-bg text-zinc-100 overflow-hidden font-sans relative">
        <main className="flex-1 relative overflow-hidden bg-zinc-950 flex flex-col z-0">
            <div className="flex-1 relative"><MapBoard /></div>
        </main>
        
        <aside className={`flex flex-col bg-zinc-900 border-l border-zinc-800 shadow-2xl z-20 overflow-hidden transition-all duration-300 ${visualMode === 'vertical' ? 'fixed bottom-0 left-0 w-full h-[60vh] rounded-t-xl border-t shadow-[0_-5px_20px_rgba(0,0,0,0.5)]' : 'hidden md:flex md:w-96 md:h-full'}`}>
            <div ref={navRef} className="shrink-0 bg-zinc-950 border-b border-zinc-800 overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing select-none" onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
                <div className="flex">
                    {allTabs.map(tab => (
                        <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex flex-col items-center justify-center p-3 min-w-[4.5rem] gap-1 transition-all border-b-2 ${activeTab === tab.name ? 'bg-zinc-900 text-op-red border-op-red' : 'text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300'}`}>
                            <tab.icon className="w-5 h-5" /><span className="text-[9px] uppercase font-bold tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden relative bg-zinc-900">{renderActiveTabContent()}</div>
        </aside>

        <div className="md:hidden fixed bottom-6 right-6 z-50">
            <button onClick={() => setVisualMode(visualMode === 'horizontal' ? 'vertical' : 'horizontal')} className="bg-op-red text-white p-3 rounded-full shadow-lg border border-red-400 hover:bg-red-600 transition-colors">
                {visualMode === 'vertical' ? <X /> : <Menu />}
            </button>
        </div>
        <GlobalRollModal />
    </div>
  );
};