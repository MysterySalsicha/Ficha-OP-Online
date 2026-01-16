"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapBoard = void 0;
const react_1 = __importStar(require("react"));
const game_store_1 = require("../store/game-store");
const lucide_react_1 = require("lucide-react");
const MapBoard = () => {
    const { activeScene, tokens, moveToken, currentUser, character, allCharacters } = (0, game_store_1.useGameStore)();
    const [scale, setScale] = (0, react_1.useState)(1);
    const [offset, setOffset] = (0, react_1.useState)({ x: 0, y: 0 });
    const [isDraggingMap, setIsDraggingMap] = (0, react_1.useState)(false);
    const [lastMousePos, setLastMousePos] = (0, react_1.useState)({ x: 0, y: 0 });
    const containerRef = (0, react_1.useRef)(null);
    const handleMouseDownMap = (e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsDraggingMap(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };
    const handleMouseMove = (e) => {
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
    const handleWheel = (e) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(0.2, scale * delta), 4);
        setScale(newScale);
    };
    const handleTokenDragEnd = (e, token) => {
        var _a;
        e.preventDefault();
        const rect = (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        if (!rect)
            return;
        // Lógica de Grid Snapping (Alinhamento automático)
        const gridSize = ((activeScene === null || activeScene === void 0 ? void 0 : activeScene.grid_size) || 50);
        const rawX = (e.clientX - rect.left - offset.x) / scale;
        const rawY = (e.clientY - rect.top - offset.y) / scale;
        // Arredonda para o centro do quadrado mais próximo
        const snappedX = Math.round(rawX / gridSize) * gridSize;
        const snappedY = Math.round(rawY / gridSize) * gridSize;
        moveToken(token.id, snappedX, snappedY);
    };
    if (!activeScene) {
        return (react_1.default.createElement("div", { className: "flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-700" },
            react_1.default.createElement("p", { className: "font-bold uppercase tracking-widest text-sm" }, "Aguardando sinal do Mestre...")));
    }
    return (react_1.default.createElement("div", { className: "flex-1 w-full h-full overflow-hidden relative bg-black cursor-grab active:cursor-grabbing select-none", onMouseDown: handleMouseDownMap, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onWheel: handleWheel, ref: containerRef },
        react_1.default.createElement("div", { className: "absolute origin-top-left will-change-transform", style: { transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` } },
            react_1.default.createElement("div", { className: "relative" },
                react_1.default.createElement("img", { src: activeScene.image_url, alt: "Mapa", className: "max-w-none shadow-2xl", onLoad: () => console.log("Mapa Carregado") }),
                react_1.default.createElement("div", { className: "absolute inset-0 pointer-events-none opacity-20", style: {
                        backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)`,
                        backgroundSize: `${activeScene.grid_size}px ${activeScene.grid_size}px`
                    } })),
            tokens.map(token => {
                var _a;
                const charData = allCharacters.find(c => c.id === token.character_id);
                const isMine = token.character_id === (character === null || character === void 0 ? void 0 : character.id);
                const isGM = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) === ((_a = game_store_1.useGameStore.getState().currentMesa) === null || _a === void 0 ? void 0 : _a.gm_id);
                const canMove = isMine || isGM;
                const sizePx = (activeScene.grid_size || 50) * token.size;
                return (react_1.default.createElement("div", { key: token.id, draggable: canMove, onDragEnd: (e) => handleTokenDragEnd(e, token), className: `absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10 group`, style: {
                        left: token.x,
                        top: token.y,
                        width: sizePx,
                        height: sizePx,
                    } },
                    react_1.default.createElement("div", { className: `w-full h-full rounded-full border-2 flex items-center justify-center shadow-2xl relative ${isMine ? 'border-green-500 bg-green-900/80' : 'border-red-600 bg-zinc-900/90'}` },
                        react_1.default.createElement("span", { className: "text-xs font-black text-white uppercase pointer-events-none" }, (charData === null || charData === void 0 ? void 0 : charData.name.substring(0, 2)) || '??'),
                        charData && (react_1.default.createElement("div", { className: "absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-black rounded-full overflow-hidden border border-zinc-800" },
                            react_1.default.createElement("div", { className: "h-full bg-red-600", style: { width: `${(charData.stats_current.pv / charData.stats_max.pv) * 100}%` } })))),
                    react_1.default.createElement("div", { className: "absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter" }, (charData === null || charData === void 0 ? void 0 : charData.name) || 'Token')));
            })),
        react_1.default.createElement("div", { className: "absolute bottom-6 right-6 flex flex-col gap-2 z-30" },
            react_1.default.createElement("div", { className: "bg-zinc-900/80 border border-zinc-800 rounded-lg p-1 flex flex-col gap-1 shadow-2xl" },
                react_1.default.createElement("button", { onClick: () => setScale(s => s * 1.2), className: "p-2 hover:bg-zinc-800 rounded text-zinc-400" },
                    react_1.default.createElement(lucide_react_1.Plus, { className: "w-4 h-4" })),
                react_1.default.createElement("button", { onClick: () => setScale(s => s * 0.8), className: "p-2 hover:bg-zinc-800 rounded text-zinc-400" },
                    react_1.default.createElement(lucide_react_1.Minus, { className: "w-4 h-4" })),
                react_1.default.createElement("button", { onClick: () => { setScale(1); setOffset({ x: 0, y: 0 }); }, className: "p-2 hover:bg-zinc-800 rounded text-zinc-400 border-t border-zinc-800" },
                    react_1.default.createElement(lucide_react_1.Maximize, { className: "w-4 h-4" }))),
            react_1.default.createElement("div", { className: "bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-500 shadow-xl self-end" },
                Math.round(scale * 100),
                "%"))));
};
exports.MapBoard = MapBoard;
//# sourceMappingURL=MapBoard.js.map