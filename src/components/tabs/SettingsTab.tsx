import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/game-store';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, Shield, Crown, User, UserX, Loader2, Monitor, MonitorUp, LogOut } from 'lucide-react'; // Import MonitorUp and LogOut
import { OpButton } from '../ui-op/OpButton';
import { promotePlayer, updatePlayerStatus } from '../../lib/mesa'; // Assuming these functions exist
import { useToast } from '../ui-op/OpToast';

export const SettingsTab: React.FC = () => {
  const { currentMesa, allCharacters, playerRole, initialize, currentUser, visualMode, setVisualMode } = useGameStore(); // Added visualMode and setVisualMode
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isGM = playerRole === 'gm' || playerRole === 'co-gm';

  const handleLeaveMesa = () => {
    navigate('/lobby');
  };

  const handleCopyCode = () => {
    if (currentMesa?.code) {
      navigator.clipboard.writeText(currentMesa.code);
      showToast('Código da mesa copiado!', 'success'); // Adicionar esta linha
    }
  };

  const handlePromotePlayer = async (targetUserId: string, newRole: 'gm' | 'co-gm' | 'player') => {
    if (!currentMesa || !isGM || !currentUser) return;
    setLoadingAction(targetUserId + newRole);
    try {
      await promotePlayer(currentMesa.id, targetUserId, newRole);
      // Re-initialize to fetch updated roles
      await initialize(currentUser, currentMesa.id);
      // TODO: Add toast notification
    } catch (error) {
      console.error("Erro ao promover jogador:", error);
      // TODO: Add error toast
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBanPlayer = async (targetUserId: string) => {
    if (!currentMesa || !isGM || !currentUser) return;
    setLoadingAction(targetUserId + 'ban');
    try {
      await updatePlayerStatus(currentMesa.id, targetUserId, 'banned');
      // Re-initialize to fetch updated player list
      await initialize(currentUser, currentMesa.id);
      // TODO: Add toast notification
    } catch (error) {
      console.error("Erro ao banir jogador:", error);
      // TODO: Add error toast
    } finally {
      setLoadingAction(null);
    }
  };

  // Filter out non-player characters and GM's own character from the player list for role management
  const playersInMesa = allCharacters
    .filter(char => char.type === 'player' && char.user_id !== currentMesa?.mestre_id) // Exclude GM's actual character if they have one for management purposes
    .map(char => {
      // Find the mesa_players entry to get the actual role
      const mesaPlayerEntry = currentMesa?.jogadores?.find((p: any) => p.user_id === char.user_id);
      return {
        ...char,
        role: mesaPlayerEntry?.role || 'player'
      };
    });


  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900 text-white p-4">
      <h3 className="font-bold text-lg text-op-red uppercase text-center border-b border-op-border pb-3 mb-4">
        Configurações da Mesa
      </h3>
      
      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Compartilhar Código da Mesa */}
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <h4 className="font-semibold text-zinc-200 mb-2">Código da Mesa</h4>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded p-2">
            <span className="flex-1 font-mono text-op-gold text-lg select-all">{currentMesa?.code || 'N/A'}</span>
            <button 
              onClick={handleCopyCode} 
              className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
              title="Copiar código"
            >
              <Copy className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Compartilhe este código com outros jogadores para que eles possam ingressar na sua mesa.</p>
        </div>

        {/* Gerenciamento de Jogadores */}
        {isGM && (
          <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <h4 className="font-semibold text-zinc-200 mb-4">Gerenciamento de Jogadores</h4>
            <ul className="divide-y divide-zinc-700">
              {currentMesa?.jogadores?.map((playerLink: any) => { // Iterate through mesa_players directly
                const character = allCharacters.find(c => c.user_id === playerLink.user_id);
                const isMestre = currentMesa?.mestre_id === playerLink.user_id;
                
                if (isMestre) return null; // GM is not managed here
                
                return (
                  <li key={playerLink.user_id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-zinc-400" />
                      <div>
                        <p className="font-bold">{character?.name || `Agente #${playerLink.user_id.substring(0, 4)}`}</p>
                        <p className="text-xs text-zinc-500">Função: {playerLink.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        className="bg-zinc-900 border border-zinc-700 rounded p-1 text-sm"
                        value={playerLink.role}
                        onChange={(e) => handlePromotePlayer(playerLink.user_id, e.target.value as any)}
                        disabled={loadingAction === playerLink.user_id + playerLink.role}
                      >
                        <option value="player">Jogador</option>
                        <option value="co-gm">Co-Mestre</option>
                      </select>
                      <OpButton 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleBanPlayer(playerLink.user_id)}
                        disabled={loadingAction === playerLink.user_id + 'ban'}
                        title="Banir Jogador"
                      >
                        {loadingAction === playerLink.user_id + 'ban' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4 text-red-500" />}
                      </OpButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Modo Visual */}
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <h4 className="font-semibold text-zinc-200 mb-2">Modo Visual</h4>
          <div className="flex gap-2">
            <OpButton 
              variant={visualMode === 'horizontal' ? 'primary' : 'secondary'} 
              onClick={() => setVisualMode('horizontal')}
              className="flex-1"
            >
              <Monitor className="w-4 h-4 mr-2" /> Horizontal
            </OpButton>
            <OpButton 
              variant={visualMode === 'vertical' ? 'primary' : 'secondary'} 
              onClick={() => setVisualMode('vertical')}
              className="flex-1"
            >
              <MonitorUp className="w-4 h-4 mr-2" /> Vertical
            </OpButton>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Alterne entre o layout focado no mapa (Horizontal) e o focado nos menus (Vertical).</p>
        </div>

        {/* Ações da Mesa */}
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <h4 className="font-semibold text-zinc-200 mb-2">Ações da Mesa</h4>
          <OpButton 
            variant="danger" 
            onClick={handleLeaveMesa}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" /> Voltar para o QG
          </OpButton>
          <p className="text-xs text-zinc-500 mt-2">Sair da mesa atual e retornar para o Lobby.</p>
        </div>
      </div>
    </div>
  );
};