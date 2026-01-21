import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameStore } from '../store/game-store'; // Import useGameStore
import { createMesa, joinMesa, requestJoinMesa } from '../lib/mesa';
import { OpButton } from '../components/ui-op/OpButton';
import { OpInput } from '../components/ui-op/OpInput';
import { OpFileUpload } from '../components/ui-op/OpFileUpload';
import { useToast } from '../components/ui-op/OpToast';
import { FileText, Users, Plus, Key, Edit, Save, X, LogOut, Loader2, Check } from 'lucide-react';
import { Mesa } from '../core/types'; // Import Mesa type

export const Lobby: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const { fetchUserMesas } = useGameStore(); // Get fetchUserMesas from store

  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.user_metadata?.full_name || '');
  const [editAvatar, setEditAvatar] = useState(user?.user_metadata?.avatar_url || '');

  // Estados do Modal de Criação
  const [isCreatingMesa, setIsCreatingMesa] = useState(false);
  const [newMesaName, setNewMesaName] = useState('');

  // Estados para as mesas do usuário
  const [userMesas, setUserMesas] = useState<Mesa[]>([]);
  const [isLoadingMesas, setIsLoadingMesas] = useState(true);

  useEffect(() => {
    const loadUserMesas = async () => {
      if (user) {
        setIsLoadingMesas(true);
        try {
          const mesas = await fetchUserMesas(user.id);
          setUserMesas(mesas);
        } catch (error) {
          console.error("Erro ao carregar mesas do usuário:", error);
          showToast('Erro ao carregar suas missões.', 'error');
        } finally {
          setIsLoadingMesas(false);
        }
      } else {
        setUserMesas([]); // Clear mesas if user logs out
        setIsLoadingMesas(false);
      }
    };

    loadUserMesas();
  }, [user, fetchUserMesas, showToast]);


  const handleOpenCreateModal = () => {
      setNewMesaName('');
      setIsCreatingMesa(true);
  };

  const confirmCreateMesa = async () => {
    if (!user || !newMesaName.trim()) return;
    setLoading(true);
    try {
      const newMesa = await createMesa(newMesaName, user.id);
      setIsCreatingMesa(false);
      showToast('Operação iniciada com sucesso!', 'success');
      // Update local state after creating a new mesa
      setUserMesas(prev => [...prev, newMesa]); 
      navigate(`/mesa/${newMesa.id}`);
    } catch (error: any) {
      showToast(`Falha ao criar missão: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode || !user) {
        showToast('Insira um código de acesso válido.', 'info');
        return;
    }
    setLoading(true);
    try {
      // 1. Verifica se a mesa existe
      const mesa = await joinMesa(joinCode.toUpperCase().trim());
      
      // 2. Cria solicitação de entrada
      await requestJoinMesa(mesa.id, user.id);
      
      showToast('Solicitação enviada! Aguarde a aprovação do Mestre.', 'success');
      
      // Update local state after joining a mesa (it will appear if approved)
      // For now, just navigate, the list will update on next load.
      navigate(`/mesa/${mesa.id}`);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
      try {
        await updateProfile(editName, editAvatar);
        setIsEditingProfile(false);
        showToast('Credenciais atualizadas.', 'success');
      } catch (error: any) {
        showToast('Erro ao atualizar perfil.', 'error');
      }
  };

  const handleLogout = async () => {
      await signOut();
      navigate('/login');
  };

  return (
    <div className="min-h-screen bg-op-bg text-zinc-100 p-4 sm:p-8 bg-noise font-sans relative">
      <div className="scanline absolute inset-0 z-0 opacity-10 pointer-events-none"></div>

      <header className="flex justify-between items-center mb-8 md:mb-16 relative z-10 border-b border-op-border pb-4">
        <div>
            <h1 className="text-3xl font-typewriter font-bold text-op-red uppercase tracking-widest">Painel de Missões</h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">SISTEMA VER. 1.1 // ORDO REALITAS</p>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 cursor-pointer hover:bg-zinc-900 p-2 rounded transition-colors" onClick={() => setIsEditingProfile(true)}>
                <div className="text-right hidden sm:block">
                    <span className="block text-xs font-bold text-zinc-300 uppercase">{user?.user_metadata?.full_name || 'Agente'}</span>
                    <span className="block text-[10px] text-op-gold">Nível de Acesso: CONFIDENCIAL</span>
                </div>
                <div className="w-10 h-10 bg-zinc-900 rounded border border-op-border flex items-center justify-center overflow-hidden relative group">
                    {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-zinc-600" />}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
            
            <button onClick={handleLogout} className="text-zinc-500 hover:text-op-red transition-colors" title="Deslogar">
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold text-zinc-200 mb-4 font-typewriter">Editar Credenciais</h3>
                  <div className="space-y-4">
                      <OpInput label="Nome do Agente" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <OpFileUpload label="Foto de Identificação" defaultUrl={editAvatar} onUpload={(url: string) => setEditAvatar(url)} />
                      <div className="flex gap-2 pt-2">
                          <OpButton variant="ghost" onClick={() => setIsEditingProfile(false)} className="flex-1"><X className="w-4 h-4 mr-2" /> Cancelar</OpButton>
                          <OpButton onClick={handleSaveProfile} className="flex-1"><Save className="w-4 h-4 mr-2" /> Salvar</OpButton>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE CRIAÇÃO DE MISSÃO */}
      {isCreatingMesa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold text-op-red mb-1 font-typewriter uppercase tracking-widest">Nova Missão</h3>
                  <p className="text-xs text-zinc-500 mb-6 font-mono">Defina o codinome da missão para o arquivo.</p>
                  
                  <div className="space-y-6">
                      <OpInput 
                        label="Nome da Missão" 
                        placeholder="EX: OPERAÇÃO ESPINHO" 
                        value={newMesaName} 
                        onChange={(e) => setNewMesaName(e.target.value)}
                        autoFocus
                      />
                      
                      <div className="flex gap-2 pt-2">
                          <OpButton variant="ghost" onClick={() => setIsCreatingMesa(false)} className="flex-1" disabled={loading}>
                              <X className="w-4 h-4 mr-2" /> Abortar
                          </OpButton>
                          <OpButton onClick={confirmCreateMesa} className="flex-1" disabled={loading || !newMesaName.trim()}>
                              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                              Iniciar
                          </OpButton>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto relative z-10">
        <div className="bg-op-panel p-8 border border-op-border hover:border-op-red transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileText className="w-32 h-32" /></div>
          <h2 className="text-xl font-bold mb-2 font-typewriter text-zinc-200 group-hover:text-op-red transition-colors flex items-center gap-2"><Plus className="w-5 h-5" /> Nova Missão</h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Inicie um novo caso. Você assumirá o papel de Mestre, controlando a narrativa e as ameaças.</p>
          <OpButton onClick={handleOpenCreateModal} disabled={loading} className="w-full">{loading ? 'Carregando...' : 'Criar Mesa'}</OpButton>
        </div>

        <div className="bg-op-panel p-8 border border-op-border hover:border-zinc-500 transition-all group relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Key className="w-32 h-32" /></div>
          <h2 className="text-xl font-bold mb-2 font-typewriter text-zinc-200 flex items-center gap-2"><Users className="w-5 h-5" /> Ingressar em Missão</h2>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Junte-se a uma equipe existente. Insira o código de acesso fornecido pelo líder da operação.</p>
          <div className="flex gap-2 items-end">
            <OpInput label="CÓDIGO DE ACESSO" placeholder="XXX-XXX" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="uppercase font-mono text-center tracking-widest text-lg" />
            <OpButton onClick={handleJoin} disabled={loading} variant="secondary" className="h-[38px] mb-[1px]">Entrar</OpButton>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE SUAS MISSÕES */}
      <div className="max-w-5xl mx-auto mt-16 relative z-10">
        <h2 className="text-xl font-bold mb-4 font-typewriter text-zinc-200 border-b border-op-border pb-2 flex items-center gap-2"><FileText className="w-5 h-5" /> Suas Missões</h2>
        
        {isLoadingMesas ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-op-gold" />
            <p className="ml-3 text-zinc-400">Carregando suas missões...</p>
          </div>
        ) : userMesas.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">Você ainda não faz parte de nenhuma missão. Crie ou ingresse em uma!</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userMesas.map(mesa => (
              <div 
                key={mesa.id} 
                className="bg-op-panel p-4 border border-op-border hover:border-op-gold transition-colors cursor-pointer"
                onClick={() => navigate(`/mesa/${mesa.id}`)}
              >
                <h3 className="font-bold text-lg text-zinc-200">{mesa.name}</h3>
                <p className="text-xs text-zinc-500 font-mono">Código: {mesa.code}</p>
                <p className="text-xs text-op-red mt-2">Mestre: {mesa.mestre_id === user?.id ? 'Você' : 'Outro'}</p> {/* TODO: Get actual GM name */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
