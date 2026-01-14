import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Lobby } from './pages/Lobby';
import { GameRoom } from './pages/GameRoom';
import { CharacterCreationWizard } from './pages/CharacterCreationWizard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/mesa/:id" element={<GameRoom />} />
        <Route path="/criar-personagem/:mesaId" element={<CharacterCreationWizard />} />
        
        {/* Redirecionamento padrão para o Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;