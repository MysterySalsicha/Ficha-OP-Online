import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { MapBoard } from '../components/MapBoard';
import { ChatTab } from '../components/tabs/ChatTab';
import { CombatTab } from '../components/tabs/CombatTab';
import { ActorsTab } from '../components/tabs/ActorsTab';
import { ScenesTab } from '../components/tabs/ScenesTab';
import { 
    Users, MessageSquare, Sword, Map as MapIcon, 
    BookOpen, Settings
} from 'lucide-react';

type TabName = 'chat' | 'combat' | 'actors' | 'scenes' | 'journal' | 'settings';

const TABS: { name: TabName, icon: React.ElementType }[] = [
    { name: 'chat', icon: MessageSquare },
    { name: 'combat', icon: Sword },
    { name: 'actors', icon: Users },
    { name: 'scenes', icon: MapIcon },
    { name: 'journal', icon: BookOpen },
    { name: 'settings', icon: Settings },
];

export const GameRoom: React.FC = () => {
  const { id: mesaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    initialize, isLoading, currentMesa, allCharacters, unsubscribe,
    sendChatMessage, messages, approvalStatus
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<TabName>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user && mesaId) {
        initialize(user, mesaId, true);
    }
    return () => unsubscribe();
  }, [user, mesaId, initialize, unsubscribe]);

  const renderActiveTabContent = () => {
    switch(activeTab) {
        case 'chat':
            return <ChatTab 
                        messages={messages} 
                        allCharacters={allCharacters} 
                        user={user} 
                        sendChatMessage={sendChatMessage} 
                    />;
        case 'combat':
            return <CombatTab />;
        case 'actors':
            return <ActorsTab />;
        case 'scenes':
            return <ScenesTab />;
        // Add other cases for other tabs here
        default:
            return <div className="p-4"><p>Conteúdo da aba: {activeTab}</p></div>
    }
  };

  if (isLoading || !currentMesa) {
    return <div className="h-screen bg-op-bg flex items-center justify-center text-op-red"><p>Sincronizando Realidade...</p></div>;
  }
  
  if (approvalStatus !== 'approved') {
      return (
          <div className="h-screen bg-op-bg flex flex-col items-center justify-center text-zinc-300 p-8 text-center">
              <h2>Acesso Restrito</h2><p>Aguarde a aprovação do mestre.</p>
              <button onClick={() => navigate('/lobby')}>Retornar ao QG</button>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-op-bg text-zinc-100 overflow-hidden font-sans">
        {/* Main Content */}
        <main className="flex-1 h-full">
            <MapBoard />
        </main>
        
        {/* Right Sidebar */}
        <aside className={`h-full bg-op-panel flex flex-col shadow-2xl transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-80'}`}>
            <div className="flex border-b border-op-border">
                {TABS.map(tab => (
                    <button 
                        key={tab.name} 
                        onClick={() => setActiveTab(tab.name)}
                        className={`
                            flex-1 p-3 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors
                            ${activeTab === tab.name ? 'bg-zinc-900 text-op-red' : ''}
                        `}
                    >
                        <tab.icon className="w-5 h-5 mx-auto" />
                    </button>
                ))}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                {renderActiveTabContent()}
            </div>
        </aside>
    </div>
  );
};
