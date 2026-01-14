import React from 'react';
import { cn } from '../../lib/utils';

interface OpButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const OpButton: React.FC<OpButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  const baseStyles = "font-bold uppercase tracking-wider transition-all duration-200 border relative overflow-hidden group";
  
  const variants = {
    primary: "bg-zinc-800 border-zinc-600 text-zinc-100 hover:bg-zinc-700 hover:border-op-red hover:text-white hover:shadow-[0_0_10px_rgba(185,28,28,0.3)]",
    secondary: "bg-transparent border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500",
    danger: "bg-op-red/10 border-op-red text-op-red hover:bg-op-red hover:text-white",
    ghost: "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
  };

  const sizes = {
    sm: "px-3 py-1 text-[10px]",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-sm"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      {/* Efeito de canto cortado (opcional, via CSS clip-path seria melhor, mas borda simples funciona) */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
