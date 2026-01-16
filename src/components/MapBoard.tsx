import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store/game-store';
import { Token } from '../core/types';
import { Users, Skull, Maximize, Minus, Plus } from 'lucide-react';

export const MapBoard: React.FC = () => {
    const { activeScene, tokens, moveToken, currentUser, character, allCharacters, selectTarget, performAttack } = useGameStore();
    
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, token: Token } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDownMap = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsDraggingMap(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
        if (contextMenu) setContextMenu(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingMap) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDraggingMap(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(0.2, scale * delta), 4);
        setScale(newScale);
    };

    const handleTokenDragEnd = (e: React.DragEvent, token: Token) => {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Lógica de Grid Snapping (Alinhamento automático)
        const gridSize = (activeScene?.grid_size || 50);
        
        const rawX = (e.clientX - rect.left - offset.x) / scale;
        const rawY = (e.clientY - rect.top - offset.y) / scale;

        // Arredonda para o centro do quadrado mais próximo
        const snappedX = Math.round(rawX / gridSize) * gridSize;
        const snappedY = Math.round(rawY / gridSize) * gridSize;

        moveToken(token.id, snappedX, snappedY);
    };

    const handleTokenContextMenu = (e: React.MouseEvent, token: Token) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, token });
    };

    const handleAttack = (token: Token) => {
        selectTarget(token.id);
        // A lógica de ataque real deve ser acionada a partir da ficha do personagem,
        // usando a arma selecionada e o alvo definido por `selectTarget`.
        // performAttack('some-weapon-id'); // Exemplo
        setContextMenu(null);
    };

    if (!activeScene) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-700">
                <p className="font-bold uppercase tracking-widest text-sm">Aguardando sinal do Mestre...</p>
            </div>
        );
    }

    return (
        <div 
            className="flex-1 w-full h-full overflow-hidden relative bg-black cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDownMap}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()} // Prevenir menu de contexto padrão no mapa
            ref={containerRef}
        >
            {/* Transform Layer */}
            <div 
                className="absolute origin-top-left will-change-transform"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
            >
                {/* Background Image */}
                <div className="relative">
                    <img 
                        src={activeScene.image_url} 
                        alt="Mapa" 
                        className="max-w-none shadow-2xl"
                        onLoad={() => console.log("Mapa Carregado")}
                    />
                    
                    {/* Grid Overlay (CSS Pattern) */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{ 
                            backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)`,
                            backgroundSize: `${activeScene.grid_size}px ${activeScene.grid_size}px`
                        }}
                    ></div>
                </div>

                {/* Tokens Layer */}
                {tokens.map(token => {
                    const charData = allCharacters.find(c => c.id === token.character_id);
                    const isMine = token.character_id === character?.id;
                    const isGM = currentUser?.id === useGameStore.getState().currentMesa?.mestre_id;
                    const canMove = isMine || isGM;

                    const sizePx = (activeScene.grid_size || 50) * token.size;

                    return (
                        <div
                            key={token.id}
                            draggable={canMove}
                            onDragEnd={(e) => handleTokenDragEnd(e, token)}
                            onContextMenu={(e) => handleTokenContextMenu(e, token)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10 group`}
                            style={{ 
                                left: token.x, 
                                top: token.y,
                                width: sizePx,
                                height: sizePx,
                            }}
                        >
                            {/* Token Body */}
                            <div className={`w-full h-full rounded-full border-2 flex items-center justify-center shadow-2xl relative ${isMine ? 'border-green-500 bg-green-900/80' : 'border-red-600 bg-zinc-900/90'}`}>
                                <span className="text-xs font-black text-white uppercase pointer-events-none">
                                    {charData?.name.substring(0, 2) || '??'}
                                </span>

                                {/* HP Bar Mini */}
                                {charData && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-black rounded-full overflow-hidden border border-zinc-800">
                                        <div 
                                            className="h-full bg-red-600" 
                                            style={{ width: `${(charData.stats_current.pv / charData.stats_max.pv) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Nome do Personagem (Label) */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter">
                                {charData?.name || 'Token'}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {contextMenu && (
                <div 
                    className="absolute bg-op-panel border border-op-border rounded shadow-lg z-50 p-1"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button className="block w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 rounded">Sussurrar</button>
                    {contextMenu.token.character_id !== character?.id && (
                        <button onClick={() => handleAttack(contextMenu.token)} className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/50 rounded">Atacar</button>
                    )}
                </div>
            )}

            {/* Map Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-1 flex flex-col gap-1 shadow-2xl">
                    <button onClick={() => setScale(s => s * 1.2)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => setScale(s => s * 0.8)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400"><Minus className="w-4 h-4" /></button>
                    <button onClick={() => { setScale(1); setOffset({x:0, y:0}); }} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 border-t border-zinc-800"><Maximize className="w-4 h-4" /></button>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-500 shadow-xl self-end">
                    {Math.round(scale * 100)}%
                </div>
            </div>
        </div>
    );
};