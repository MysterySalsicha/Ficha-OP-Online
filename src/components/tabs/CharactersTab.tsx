import React from 'react';
import { useGameStore } from '../../store/game-store';
import { CharacterSheet } from '../CharacterSheet';

export const CharactersTab: React.FC = () => {
  const { isGM, character, needsCharacterCreation, allCharacters, editingCharacterId, setEditingCharacterId } = useGameStore();

  // If a character is being edited (GM) or if it's a player with a character, display the CharacterSheet
  if (editingCharacterId) {
    return (
      <div className="relative h-full">
        <button 
          onClick={() => setEditingCharacterId(null)} 
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md shadow-md"
        >
          &lt; Voltar
        </button>
        <CharacterSheet characterId={editingCharacterId} editMode={isGM} /> {/* GM always has editMode true */}
      </div>
    );
  }

  // GM View
  if (isGM) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Gerenciamento de Personagens (GM)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allCharacters.map((char) => (
            <div key={char.id} className="bg-zinc-800 p-4 rounded-lg shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-xl text-op-gold truncate">{char.name}</h2>
                <p className="text-zinc-400">NEX: {char.nex}</p>
                <p className="text-zinc-400">Tipo: {char.type === 'player' ? 'Jogador' : 'NPC'}</p>
                <p className="text-zinc-500 text-sm">ID: {char.id.substring(0, 8)}...</p>
              </div>
              <button 
                onClick={() => setEditingCharacterId(char.id)} 
                className="mt-4 px-4 py-2 bg-op-red hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
        {/* Floating buttons for creation */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-2">
          <button className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg">
            + Criar NPC
          </button>
          <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg">
            + Criar Ficha
          </button>
        </div>
      </div>
    );
  } 
  // Player View (and not editing a character)
  else {
    if (character) {
      // Player has a character and it's set as editingCharacterId in initialize (handled in game-store)
      // So, if we reach here, it means editingCharacterId is null, but character is not null.
      // This state should ideally not be reached if initialize correctly sets editingCharacterId for players.
      // As a fallback, we'll display the character sheet if character exists.
      return <CharacterSheet characterId={character.id} editMode={false} />;
    } else if (needsCharacterCreation) {
      return (
        <div className="p-4 text-center text-white flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Crie seu Personagem!</h1>
          <p className="mb-4">Parece que você ainda não tem um personagem nesta mesa. Clique abaixo para começar sua jornada!</p>
          <button className="px-6 py-3 bg-op-gold hover:bg-yellow-600 text-zinc-900 font-bold rounded-md shadow-md">
            Criar Nova Ficha
          </button>
        </div>
      );
    } else {
      return (
        <div className="p-4 text-center text-white flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Aguardando Aprovação...</h1>
          <p>Sua solicitação para entrar na mesa está pendente ou foi recusada pelo Mestre.</p>
        </div>
      );
    }
  }
};