import React from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { AttributeName, ActionResult } from '../core/types';

interface StatBlockProps {
  attribute: AttributeName;
  label: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({ attribute, label }) => {
  const { character, increaseAttribute } = useSheetStore();
  const value = character.attributes[attribute];

  const handleIncrease = () => {
    const result: ActionResult = increaseAttribute(attribute);
    if (result.success) {
       // Success Feedback
       console.log(result.message);
       if (result.impact) {
           console.log("Impact:", result.impact);
       }
    } else {
       // Error Feedback
       alert(`${result.message}\n${result.explanation || ''}`);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-zinc-950 rounded border border-zinc-800">
      <div className="flex flex-col">
          <span className="text-2xl font-bold text-zinc-100">{value}</span>
          <span className="text-xs uppercase text-zinc-500">{label}</span>
      </div>
      <button
        onClick={handleIncrease}
        className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center justify-center font-bold"
      >
        +
      </button>
    </div>
  );
};
