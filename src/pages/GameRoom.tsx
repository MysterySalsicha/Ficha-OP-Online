import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/game-store';
import { useAuth } from '../contexts/AuthContext';
import { MapBoard } from '../components/MapBoard';
import { ChatTab } from '../components/tabs/ChatTab';
import { CombatTab } from '../components/tabs/CombatTab';
import { ActorsTab } from '../components/tabs/ActorsTab';
import { ScenesTab } from '../components/tabs/ScenesTab';
import { SettingsTab } from '../components/tabs/SettingsTab';
import { CreaturesTab } from '../components/tabs/CreaturesTab';
import { ItemsTab } from '../components/tabs/ItemsTab';
import { JournalTab } from '../components/tabs/JournalTab'; // Import JournalTab
import { 
    Users, MessageSquare, Sword, Map as MapIcon, 
    BookOpen, Settings, LayoutDashboard, LayoutList, Skull, Package // Added Package for items
} from 'lucide-react';

type TabName = 'chat' | 'combat' | 'actors' | 'scenes' | 'journal' | 'settings' | 'creatures' | 'items';

const ALL_TABS: { name: TabName, icon: React.ElementType }[] = [
    { name: 'chat', icon: MessageSquare },
    { name: 'combat', icon: Sword },
    { name: 'actors', icon: Users },
    { name: 'scenes', icon: MapIcon },
    { name: 'creatures', icon: Skull },
    { name: 'items', icon: Package },
    { name: 'journal', icon: BookOpen }, // Added journal tab
    { name: 'settings', icon: Settings },
];

const VERTICAL_MODE_TABS: TabName[] = ['chat', 'combat', 'actors', 'creatures', 'items', 'journal', 'settings']; // Added 'journal' to vertical mode

export const GameRoom: React.FC = () => {
  const { id: mesaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    initialize, isLoading, currentMesa, allCharacters, unsubscribe,
    sendChatMessage, messages, approvalStatus, visualMode
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<TabName>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (user && mesaId && !hasInitialized.current) {
        initialize(user, mesaId);
        hasInitialized.current = true;
    }
    return () => {
        if (hasInitialized.current) {
            unsubscribe(); 
            hasInitialized.current = false;
        }
    }
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
        case 'creatures':
            return <CreaturesTab />;
        case 'items':
            return <ItemsTab />;
        case 'journal': // Added case for journal tab
            return <JournalTab />;
        case 'settings':
            return <SettingsTab />;
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

  const displayedTabs = visualMode === 'vertical' 
    ? ALL_TABS.filter(tab => VERTICAL_MODE_TABS.includes(tab.name))
    : ALL_TABS;

  return (
    <div className={`flex h-screen bg-op-bg text-zinc-100 overflow-hidden font-sans ${visualMode === 'vertical' ? 'flex-col' : 'flex-row'}`}>
        {/* Main Content (MapBoard or minimized) */}
        <main className={`${visualMode === 'vertical' ? 'h-1/2 w-full' : 'flex-1 h-full'}`}>
            {visualMode === 'horizontal' && <MapBoard />}
            {visualMode === 'vertical' && (
                <div className="flex items-center justify-center h-full bg-zinc-950/50 border-b border-op-border text-zinc-500">
                    <LayoutDashboard className="w-8 h-8 mr-2" />
                    <p>Modo Vertical: Mapa minimizado.</p>
                </div>
            )}
        </main>
        
        {/* Right Sidebar */}
        <aside className={`h-full bg-op-panel flex flex-col shadow-2xl transition-all duration-300 
            ${visualMode === 'vertical' ? 'w-full h-1/2' : 'w-80'}
            ${isSidebarCollapsed ? 'md:w-12' : 'md:w-80'}
            ${visualMode === 'vertical' && activeTab === 'scenes' ? 'hidden' : ''} /* Hide scenes in vertical mode */
        `}>
            <div className="flex border-b border-op-border">
                {displayedTabs.map(tab => (
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