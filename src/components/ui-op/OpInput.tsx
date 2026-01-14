import React from 'react';
import { cn } from '../../lib/utils';

interface OpInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const OpInput: React.FC<OpInputProps> = ({ className, label, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">{label}</label>}
      <input 
        className={cn(
          "bg-black/40 border border-zinc-800 text-zinc-200 text-sm px-3 py-2 rounded-sm outline-none transition-all",
          "focus:border-op-red focus:bg-zinc-900/80 placeholder:text-zinc-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )} 
        {...props}
      />
    </div>
  );
};
