import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createMesa, joinMesa, requestJoinMesa } from '../lib/mesa';
import { OpButton } from '../components/ui-op/OpButton';
import { OpInput } from '../components/ui-op/OpInput';
import { OpFileUpload } from '../components/ui-op/OpFileUpload';
import { FileText, Users, Plus, Key, Edit, Save, X, LogOut } from 'lucide-react';

export const Lobby: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.user_metadata?.full_name || '');
  const [editAvatar, setEditAvatar] = useState(user?.user_metadata?.avatar_url || '');

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const mesaName = prompt("Nome da Missão:");
      if (!mesaName) return;
      const newMesa = await createMesa(mesaName, user.id);
      navigate(`/mesa/${newMesa.id}`);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode || !user) return;
    setLoading(true);
    try {
      // 1. Verifica se a mesa existe
      const mesa = await joinMesa(joinCode.toUpperCase().trim());
      
      // 2. Cria solicitação de entrada
      await requestJoinMesa(mesa.id, user.id);
      
      // 3. Redireciona (a GameRoom vai mostrar "Aguardando Aprovação")
      navigate(`/mesa/${mesa.id}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
      await updateProfile(editName, editAvatar);
      setIsEditingProfile(false);
  };

  const handleLogout = async () => {
      await signOut();
      navigate('/login');
  };

  return (
    <div className="min-h-screen bg-op-bg text-zinc-100 p-8 bg-noise font-sans relative">
      <div className="scanline absolute inset-0 z-0 opacity-10 pointer-events-none"></div>

      <header className="flex justify-between items-center mb-16 relative z-10 border-b border-op-border pb-4">
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

      {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative">
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

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10">
        <div className="bg-op-panel p-8 border border-op-border hover:border-op-red transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileText className="w-32 h-32" /></div>
          <h2 className="text-xl font-bold mb-2 font-typewriter text-zinc-200 group-hover:text-op-red transition-colors flex items-center gap-2"><Plus className="w-5 h-5" /> Nova Operação</h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Inicie um novo caso. Você assumirá o papel de Mestre, controlando a narrativa e as ameaças.</p>
          <OpButton onClick={handleCreate} disabled={loading} className="w-full">{loading ? 'Inicializando...' : 'Criar Mesa'}</OpButton>
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
    </div>
  );
};
