import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "./ui/sheet";
import { LucideIcon } from 'lucide-react';

interface EducationalSheetProps {
  title: string;
  triggerTerm: string; // The text user clicks on
  description: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export const EducationalSheet: React.FC<EducationalSheetProps> = ({ title, triggerTerm, description, icon: Icon, children }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <span className="cursor-help underline decoration-dotted decoration-zinc-500 hover:text-zinc-200 transition-colors">
            {triggerTerm}
        </span>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] bg-zinc-950 border-t border-zinc-800 text-zinc-100">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-6 h-6 text-purple-400" />}
            <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
          </div>
          <SheetDescription className="text-zinc-400 text-lg">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
            {children}
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <h4 className="font-semibold text-purple-400 mb-2">Regra Oficial</h4>
                <p className="text-sm text-zinc-300 italic">
                    "O sistema Ordem Paranormal utiliza d20 para testes..."
                </p>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
