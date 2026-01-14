import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { OpButton } from '../components/ui-op/OpButton';
import { OpInput } from '../components/ui-op/OpInput';
import { Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Novo estado para o nome
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  // const { signInMock } = useAuth(); removido

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        if (isSignUp) {
            // Cadastro com metadados (nome)
            const { error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: { full_name: username, avatar_url: '' }
                }
            });
            if (error) throw error;
            alert('Verifique seu e-mail para confirmar o cadastro!');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            navigate('/lobby');
        }
    } catch (error: any) {
        console.warn("Falha no login real:", error.message);
        alert(error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-op-bg text-zinc-100 p-4 relative overflow-hidden bg-noise">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-op-bg to-op-bg z-0 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full scanline z-10 pointer-events-none opacity-20"></div>

      <div className="z-20 w-full max-w-md flex flex-col items-center">
        <div className="mb-8 text-center animate-pulse">
            <h1 className="text-4xl font-typewriter font-bold text-zinc-100 tracking-tighter">ORDEM PARANORMAL</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-op-gold mt-1">Acesso Restrito - Ordo Realitas</p>
        </div>

        <div className="bg-op-panel border border-op-border p-8 w-full shadow-2xl relative">
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-op-red"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-op-red"></div>

          <h2 className="text-lg font-bold mb-6 text-center text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
            {isSignUp ? 'Recrutamento' : 'Identificação'}
          </h2>
          
          <form onSubmit={handleAuth} className="space-y-6">
            
            {/* Campo de Nome (Só aparece no cadastro) */}
            {isSignUp && (
                <OpInput 
                  label="Nome do Agente"
                  type="text" 
                  placeholder="Ex: Veríssimo" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={isSignUp}
                />
            )}

            <OpInput 
              label="Credencial (E-mail)"
              type="email" 
              placeholder="agente@ordo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <OpInput 
              label="Chave de Acesso"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <OpButton 
              type="submit"
              disabled={loading}
              className="w-full mt-4"
              variant="danger"
            >
              {loading ? 'Processando...' : (isSignUp ? 'Assinar Contrato' : 'Acessar Sistema')}
            </OpButton>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-zinc-600 hover:text-op-red transition-colors uppercase tracking-wider"
            >
              {isSignUp ? 'Já possuo credenciais' : 'Solicitar novo acesso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
