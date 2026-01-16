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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const game_store_1 = require("../store/game-store");
const AuthContext_1 = require("../contexts/AuthContext");
const CharacterSheet_1 = require("../components/CharacterSheet");
const MapBoard_1 = require("../components/MapBoard");
const InitiativeTracker_1 = require("../components/InitiativeTracker");
const OpButton_1 = require("../components/ui-op/OpButton");
const OpToast_1 = require("../components/ui-op/OpToast");
const lucide_react_1 = require("lucide-react");
const OpInput_1 = require("../components/ui-op/OpInput");
const OpFileUpload_1 = require("../components/ui-op/OpFileUpload");
const monsters_json_1 = __importDefault(require("../data/rules/monsters.json"));
const items_json_1 = __importDefault(require("../data/rules/items.json"));
const mesa_1 = require("../lib/mesa");
const GameRoom = () => {
    const { id: mesaId } = (0, react_router_dom_1.useParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { user } = (0, AuthContext_1.useAuth)();
    const { showToast } = (0, OpToast_1.useToast)();
    const { initialize, isLoading, currentMesa, allCharacters, unsubscribe, spawnMonster, sendChatMessage, giveItemToCharacter, activeScene, createScene, messages, logs, needsCharacterCreation, character, approvalStatus, playerRole } = (0, game_store_1.useGameStore)();
    const [rightSidebarOpen, setRightSidebarOpen] = (0, react_1.useState)(true);
    const [leftSidebarOpen, setLeftSidebarOpen] = (0, react_1.useState)(false);
    const [viewMode, setViewMode] = (0, react_1.useState)('sheet');
    const [leftTab, setLeftTab] = (0, react_1.useState)('chat');
    const [rightTab, setRightTab] = (0, react_1.useState)('players');
    const [librarySubTab, setLibrarySubTab] = (0, react_1.useState)('bestiario');
    const [chatInput, setChatInput] = (0, react_1.useState)('');
    const [selectedItem, setSelectedItem] = (0, react_1.useState)(null);
    const [isRolling, setIsRolling] = (0, react_1.useState)(false);
    const [rollConfig, setRollConfig] = (0, react_1.useState)({ skill: '', attr: 'agi', bonus: 0, advantage: 0 });
    const [isCreatingMap, setIsCreatingMap] = (0, react_1.useState)(false);
    const [newMapName, setNewMapName] = (0, react_1.useState)('');
    const [newMapImage, setNewMapImage] = (0, react_1.useState)('');
    const [pendingPlayers, setPendingPlayers] = (0, react_1.useState)([]);
    const chatEndRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (user && mesaId)
            initialize(user, mesaId);
        if (window.innerWidth < 1024)
            setRightSidebarOpen(false);
        return () => unsubscribe();
    }, [user, mesaId]);
    // isGM agora verifica se o playerRole é 'gm' (que inclui o dono e os co-gms)
    const isGM = playerRole === 'gm';
    const isOwner = (currentMesa === null || currentMesa === void 0 ? void 0 : currentMesa.gm_id) === (user === null || user === void 0 ? void 0 : user.id);
    const loadPending = async () => {
        if (isGM && mesaId) {
            const p = await (0, mesa_1.getPendingPlayers)(mesaId);
            setPendingPlayers(p || []);
        }
    };
    (0, react_1.useEffect)(() => {
        if (isGM) {
            loadPending();
            const interval = setInterval(loadPending, 10000); // Polling simples
            return () => clearInterval(interval);
        }
    }, [isGM, mesaId]);
    const handleApprove = async (userId) => {
        if (!mesaId)
            return;
        try {
            await (0, mesa_1.updatePlayerStatus)(mesaId, userId, 'approved');
            showToast('Agente aprovado!', 'success');
            loadPending();
        }
        catch (e) {
            showToast('Erro ao aprovar.', 'error');
        }
    };
    const handleReject = async (userId) => {
        if (!mesaId)
            return;
        try {
            await (0, mesa_1.updatePlayerStatus)(mesaId, userId, 'rejected');
            showToast('Solicitação rejeitada.', 'success');
            loadPending();
        }
        catch (e) {
            showToast('Erro ao rejeitar.', 'error');
        }
    };
    const handlePromote = async (userId, userName) => {
        if (!mesaId || !confirm(`Tem certeza que deseja promover ${userName} a Mestre Auxiliar? Ele terá controle total sobre a mesa.`))
            return;
        try {
            await (0, mesa_1.promotePlayer)(mesaId, userId);
            showToast(`${userName} promovido a Mestre!`, 'success');
        }
        catch (e) {
            showToast('Erro ao promover.', 'error');
        }
    };
    (0, react_1.useEffect)(() => {
        if (needsCharacterCreation && mesaId && approvalStatus === 'approved')
            navigate(`/criar-personagem/${mesaId}`);
    }, [needsCharacterCreation, mesaId, navigate, approvalStatus]);
    (0, react_1.useEffect)(() => {
        var _a;
        (_a = chatEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleCopyCode = () => {
        navigator.clipboard.writeText((currentMesa === null || currentMesa === void 0 ? void 0 : currentMesa.code) || '');
        showToast('Código copiado!', 'success');
    };
    const handleSendMessage = async (e) => {
        e === null || e === void 0 ? void 0 : e.preventDefault();
        if (chatInput.trim()) {
            await sendChatMessage(chatInput);
            setChatInput('');
        }
    };
    const handleSpawn = async (monsterId) => {
        const result = await spawnMonster(monsterId);
        showToast(result.message, result.success ? 'success' : 'error');
    };
    const handleGiveItem = async (targetCharId) => {
        if (!selectedItem)
            return;
        const itemPayload = {
            name: selectedItem.nome || selectedItem.name,
            category: 'equipamento',
            slots: selectedItem.espacos || selectedItem.slots || 1,
            weight: 0,
            quantity: 1,
            stats: selectedItem,
            access_category: selectedItem.categoria || 1
        };
        const result = await giveItemToCharacter(itemPayload, targetCharId);
        showToast(result.message, result.success ? 'success' : 'error');
        if (result.success)
            setSelectedItem(null);
    };
    const handleCreateMap = async () => {
        if (!newMapName || !newMapImage)
            return;
        const result = await createScene(newMapName, newMapImage);
        if (result.success) {
            setViewMode('map');
            setIsCreatingMap(false);
            setNewMapName('');
            setNewMapImage('');
            showToast('Mapa criado!', 'success');
        }
        else {
            showToast(result.message, 'error');
        }
    };
    const handleRollClick = () => setIsRolling(true);
    const confirmRoll = async () => {
        const diceCount = ((character === null || character === void 0 ? void 0 : character.attributes[rollConfig.attr]) || 1) + (rollConfig.advantage);
        const diceStr = `${diceCount > 0 ? diceCount : 2}d20`;
        const rollType = rollConfig.advantage !== 0 ? (rollConfig.advantage > 0 ? 'Vantagem' : 'Desvantagem') : 'Normal';
        const msg = `/roll ${diceStr} (${rollConfig.skill || rollConfig.attr.toUpperCase()} - ${rollType})`;
        await sendChatMessage(msg);
        setIsRolling(false);
    };
    if (isLoading) {
        return (react_1.default.createElement("div", { className: "h-screen bg-op-bg flex items-center justify-center text-op-red" },
            react_1.default.createElement("p", { className: "animate-pulse text-xl font-bold uppercase tracking-widest font-typewriter" }, "Sincronizando Realidade...")));
    }
    if (approvalStatus === 'pending') {
        return (react_1.default.createElement("div", { className: "h-screen bg-op-bg flex flex-col items-center justify-center text-zinc-300 p-8 text-center bg-noise" },
            react_1.default.createElement("div", { className: "bg-op-panel p-8 border border-op-gold/50 shadow-2xl max-w-md w-full relative overflow-hidden" },
                react_1.default.createElement("div", { className: "absolute top-0 right-0 p-2 opacity-20" },
                    react_1.default.createElement(lucide_react_1.Shield, { className: "w-24 h-24 text-op-gold" })),
                react_1.default.createElement("h2", { className: "text-2xl font-bold font-typewriter text-op-gold mb-4 uppercase tracking-widest" }, "Acesso Restrito"),
                react_1.default.createElement("p", { className: "mb-6 leading-relaxed" }, "Suas credenciais est\u00E3o sob an\u00E1lise da Ordo Realitas. Aguarde a autoriza\u00E7\u00E3o do oficial respons\u00E1vel (Mestre) para acessar esta miss\u00E3o."),
                react_1.default.createElement(OpButton_1.OpButton, { onClick: () => navigate('/lobby'), variant: "ghost", className: "w-full" },
                    react_1.default.createElement(lucide_react_1.LogOut, { className: "w-4 h-4 mr-2" }),
                    " Retornar ao QG"))));
    }
    if (approvalStatus === 'rejected') {
        return (react_1.default.createElement("div", { className: "h-screen bg-op-bg flex flex-col items-center justify-center text-zinc-300 p-8 text-center bg-noise" },
            react_1.default.createElement("div", { className: "bg-op-panel p-8 border border-op-red shadow-2xl max-w-md w-full relative overflow-hidden" },
                react_1.default.createElement("div", { className: "absolute top-0 right-0 p-2 opacity-20" },
                    react_1.default.createElement(lucide_react_1.Skull, { className: "w-24 h-24 text-op-red" })),
                react_1.default.createElement("h2", { className: "text-2xl font-bold font-typewriter text-op-red mb-4 uppercase tracking-widest" }, "Acesso Negado"),
                react_1.default.createElement("p", { className: "mb-6 leading-relaxed" }, "Suas credenciais foram rejeitadas ou sua presen\u00E7a nesta opera\u00E7\u00E3o foi revogada."),
                react_1.default.createElement(OpButton_1.OpButton, { onClick: () => navigate('/lobby'), variant: "ghost", className: "w-full" },
                    react_1.default.createElement(lucide_react_1.LogOut, { className: "w-4 h-4 mr-2" }),
                    " Retornar ao QG"))));
    }
    if (!currentMesa)
        return null;
    return (react_1.default.createElement("div", { className: "flex h-screen bg-op-bg text-zinc-100 overflow-hidden font-sans relative bg-noise" },
        react_1.default.createElement("div", { className: "scanline absolute inset-0 z-0 opacity-10 pointer-events-none" }),
        react_1.default.createElement("div", { className: "md:hidden fixed top-3 left-4 z-50" },
            react_1.default.createElement("button", { onClick: () => setLeftSidebarOpen(!leftSidebarOpen), className: "bg-op-panel p-2 rounded border border-op-border text-zinc-300" },
                react_1.default.createElement(lucide_react_1.Menu, { className: "w-5 h-5" }))),
        react_1.default.createElement("aside", { className: `
          fixed md:relative inset-y-0 left-0 z-40 bg-op-panel border-r border-op-border flex flex-col shadow-2xl transition-transform duration-300
          ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-80
      ` },
            react_1.default.createElement("div", { className: "h-14 border-b border-op-border flex items-center px-4 bg-zinc-900/50 justify-between" },
                react_1.default.createElement("h1", { className: "font-typewriter font-bold text-lg text-zinc-200 tracking-tighter truncate flex-1" }, currentMesa.name),
                react_1.default.createElement("div", { className: "flex gap-1" },
                    react_1.default.createElement("button", { onClick: () => setLeftTab('chat'), className: `p-2 rounded hover:bg-zinc-800 ${leftTab === 'chat' ? 'text-op-red' : 'text-zinc-500'}` },
                        react_1.default.createElement(lucide_react_1.MessageSquare, { className: "w-4 h-4" })),
                    react_1.default.createElement("button", { onClick: () => setLeftTab('players'), className: `p-2 rounded hover:bg-zinc-800 ${leftTab === 'players' ? 'text-op-red' : 'text-zinc-500'}` },
                        react_1.default.createElement(lucide_react_1.Users, { className: "w-4 h-4" })),
                    react_1.default.createElement("button", { onClick: () => setLeftTab('log'), className: `p-2 rounded hover:bg-zinc-800 ${leftTab === 'log' ? 'text-op-red' : 'text-zinc-500'}` },
                        react_1.default.createElement(lucide_react_1.History, { className: "w-4 h-4" }))),
                react_1.default.createElement("button", { className: "md:hidden ml-2 text-zinc-500", onClick: () => setLeftSidebarOpen(false) },
                    react_1.default.createElement(lucide_react_1.ChevronLeft, { className: "w-5 h-5" }))),
            react_1.default.createElement("div", { className: "flex-1 overflow-hidden relative" },
                leftTab === 'chat' && (react_1.default.createElement("div", { className: "flex flex-col h-full" },
                    react_1.default.createElement("div", { className: "flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" },
                        messages.map((msg, i) => (react_1.default.createElement("div", { key: i, className: `text-sm ${msg.type === 'system' ? 'text-yellow-500 italic text-xs text-center border-y border-yellow-900/30 py-1' : ''}` },
                            msg.type !== 'system' && (react_1.default.createElement("span", { className: `font-bold text-[10px] block uppercase mb-0.5 ${msg.user_id === (user === null || user === void 0 ? void 0 : user.id) ? 'text-op-gold' : 'text-zinc-500'}` }, msg.user_id === (user === null || user === void 0 ? void 0 : user.id) ? 'Você' : 'Agente')),
                            msg.type === 'roll' ? (react_1.default.createElement("div", { className: `inline-block border px-2 py-1 rounded bg-zinc-900 ${msg.content.is_critical ? 'border-op-red text-op-red' : 'border-zinc-700 text-zinc-300'}` },
                                "\uD83C\uDFB2 ",
                                react_1.default.createElement("strong", null, msg.content.total),
                                " ",
                                react_1.default.createElement("span", { className: "text-zinc-500 text-xs" },
                                    "(",
                                    msg.content.details,
                                    ")"))) : (react_1.default.createElement("span", { className: "text-zinc-300" }, msg.content.text))))),
                        react_1.default.createElement("div", { ref: chatEndRef })),
                    react_1.default.createElement("div", { className: "p-3 border-t border-op-border bg-op-panel" },
                        react_1.default.createElement("div", { className: "flex gap-2" },
                            react_1.default.createElement("button", { onClick: handleRollClick, className: "p-2 bg-zinc-800 hover:bg-op-gold/20 text-zinc-400 hover:text-op-gold border border-zinc-700 rounded transition-colors" },
                                react_1.default.createElement(lucide_react_1.Dices, { className: "w-5 h-5" })),
                            react_1.default.createElement("form", { onSubmit: handleSendMessage, className: "flex-1 flex gap-2" },
                                react_1.default.createElement("input", { className: "flex-1 bg-black/40 border border-zinc-700 rounded p-2 text-sm outline-none focus:border-op-red transition-colors text-zinc-200 placeholder:text-zinc-600", placeholder: "Mensagem...", value: chatInput, onChange: e => setChatInput(e.target.value) })))))),
                leftTab === 'players' && (react_1.default.createElement("div", { className: "p-4 space-y-3 overflow-y-auto h-full custom-scrollbar" }, allCharacters.map(char => (react_1.default.createElement("div", { key: char.id, className: `bg-zinc-900/50 border p-3 rounded flex items-center gap-3 ${char.is_npc ? 'border-red-900/30' : 'border-zinc-700'}` },
                    react_1.default.createElement("div", { className: `w-10 h-10 rounded-full border-2 flex items-center justify-center bg-zinc-800 ${char.user_id === (user === null || user === void 0 ? void 0 : user.id) ? 'border-op-gold' : 'border-zinc-600'}` },
                        react_1.default.createElement("span", { className: "font-bold text-xs" }, char.name.substring(0, 2).toUpperCase())),
                    react_1.default.createElement("div", { className: "flex-1 min-w-0" },
                        react_1.default.createElement("p", { className: "text-sm font-bold text-zinc-200 truncate" }, char.name),
                        react_1.default.createElement("div", { className: "flex gap-2 mt-1" },
                            react_1.default.createElement("div", { className: "h-1 flex-1 bg-zinc-800 rounded overflow-hidden" },
                                react_1.default.createElement("div", { className: "h-full bg-red-600", style: { width: `${(char.stats_current.pv / char.stats_max.pv) * 100}%` } })),
                            react_1.default.createElement("div", { className: "h-1 flex-1 bg-zinc-800 rounded overflow-hidden" },
                                react_1.default.createElement("div", { className: "h-full bg-yellow-500", style: { width: `${(char.stats_current.pe / char.stats_max.pe) * 100}%` } })))),
                    isOwner && char.user_id && char.user_id !== (user === null || user === void 0 ? void 0 : user.id) && !char.is_npc && (react_1.default.createElement("button", { onClick: () => handlePromote(char.user_id, char.name), className: "p-1 hover:bg-op-gold/20 rounded text-zinc-600 hover:text-op-gold transition-colors", title: "Promover a Mestre Auxiliar" },
                        react_1.default.createElement(lucide_react_1.Crown, { className: "w-4 h-4" }))),
                    isGM && react_1.default.createElement(lucide_react_1.Eye, { className: "w-4 h-4 text-zinc-600 hover:text-white cursor-pointer" })))))),
                leftTab === 'log' && (react_1.default.createElement("div", { className: "p-4 space-y-4 overflow-y-auto h-full custom-scrollbar" }, logs.map((log, i) => (react_1.default.createElement("div", { key: i, className: "text-xs border-l-2 border-zinc-700 pl-3 py-1" },
                    react_1.default.createElement("span", { className: "block text-zinc-500 font-mono mb-0.5" }, new Date(log.created_at).toLocaleTimeString()),
                    react_1.default.createElement("p", { className: "text-zinc-300" }, log.description)))))))),
        react_1.default.createElement("main", { className: "flex-1 flex flex-col relative bg-transparent w-full z-10 min-w-0" },
            react_1.default.createElement("header", { className: "h-14 bg-op-bg/90 border-b border-op-border flex items-center px-4 md:px-6 justify-between backdrop-blur-md z-20 pl-16 md:pl-6 shadow-sm" },
                react_1.default.createElement("div", { className: "flex items-center gap-4" },
                    react_1.default.createElement("h2", { className: "font-black tracking-tighter uppercase text-sm text-op-red truncate hidden sm:block font-typewriter" }, currentMesa.name),
                    react_1.default.createElement("div", { className: "flex bg-op-panel rounded p-0.5 border border-op-border" },
                        react_1.default.createElement("button", { onClick: () => setViewMode('sheet'), className: `px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 uppercase tracking-wide ${viewMode === 'sheet' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}` },
                            react_1.default.createElement(lucide_react_1.User, { className: "w-3 h-3" }),
                            " Ficha"),
                        react_1.default.createElement("button", { onClick: () => setViewMode('map'), className: `px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 uppercase tracking-wide ${viewMode === 'map' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}` },
                            react_1.default.createElement(lucide_react_1.Map, { className: "w-3 h-3" }),
                            " Mapa"))),
                react_1.default.createElement("div", { className: "flex gap-2" },
                    isGM && (react_1.default.createElement("button", { onClick: () => setIsCreatingMap(true), className: "flex items-center gap-2 text-[10px] font-bold uppercase bg-op-red/10 text-op-red hover:bg-op-red/20 px-3 py-1.5 rounded transition-colors border border-op-red/30" },
                        react_1.default.createElement(lucide_react_1.Map, { className: "w-3 h-3" }),
                        " Novo Mapa")),
                    react_1.default.createElement("button", { className: "hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase bg-op-panel hover:bg-zinc-800 px-3 py-1.5 rounded border border-op-border text-zinc-400" },
                        react_1.default.createElement(lucide_react_1.BookOpen, { className: "w-3 h-3" }),
                        " Docs"),
                    react_1.default.createElement("button", { onClick: () => setRightSidebarOpen(!rightSidebarOpen), className: "md:hidden flex items-center gap-2 text-[10px] font-bold uppercase bg-op-panel hover:bg-zinc-800 px-3 py-1.5 rounded border border-op-border" },
                        react_1.default.createElement(lucide_react_1.Package, { className: "w-3 h-3" }),
                        " Lib"),
                    react_1.default.createElement("button", { onClick: () => navigate('/lobby'), className: "p-2 text-zinc-600 hover:text-red-500 transition-colors", title: "Sair da Mesa" },
                        react_1.default.createElement(lucide_react_1.LogOut, { className: "w-5 h-5" })))),
            react_1.default.createElement("div", { className: "flex-1 overflow-hidden relative" },
                react_1.default.createElement(InitiativeTracker_1.InitiativeTracker, null),
                viewMode === 'sheet' ? (react_1.default.createElement("div", { className: "h-full overflow-y-auto p-4 md:p-8 custom-scrollbar" },
                    react_1.default.createElement("div", { className: "max-w-5xl mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border border-op-border bg-op-panel" }, character ? react_1.default.createElement(CharacterSheet_1.CharacterSheet, null) : (react_1.default.createElement("div", { className: "flex flex-col items-center justify-center h-full text-zinc-500 py-20" },
                        react_1.default.createElement(lucide_react_1.Crown, { className: "w-16 h-16 text-op-gold mb-4 opacity-50" }),
                        react_1.default.createElement("h3", { className: "text-xl font-bold font-typewriter text-zinc-400" }, "Modo Observador"),
                        react_1.default.createElement("p", { className: "text-sm" }, "Voc\u00EA \u00E9 um Mestre Auxiliar. Voc\u00EA tem acesso total \u00E0 mesa, mas n\u00E3o possui uma ficha de personagem.")))))) : (react_1.default.createElement(MapBoard_1.MapBoard, null))),
            character && (react_1.default.createElement("footer", { className: "h-16 bg-op-panel border-t border-op-border flex items-center px-6 gap-6 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]" },
                react_1.default.createElement("div", { className: "flex items-center gap-3 border-r border-op-border pr-6" },
                    react_1.default.createElement("div", { className: "w-10 h-10 rounded border border-op-gold/50 bg-op-gold/10 flex items-center justify-center" },
                        react_1.default.createElement("span", { className: "font-typewriter font-bold text-op-gold" }, character.name.substring(0, 2))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "block text-xs font-bold text-zinc-200 uppercase" }, character.name),
                        react_1.default.createElement("span", { className: "block text-[10px] text-zinc-500 uppercase" },
                            character.class,
                            " \u2022 NEX ",
                            character.nex,
                            "%"))),
                react_1.default.createElement("div", { className: "flex-1 grid grid-cols-3 gap-4 max-w-xl" },
                    react_1.default.createElement("div", { className: "flex flex-col gap-1" },
                        react_1.default.createElement("div", { className: "flex justify-between text-[10px] uppercase font-bold text-red-500" },
                            react_1.default.createElement("span", null, "PV"),
                            " ",
                            react_1.default.createElement("span", null,
                                character.stats_current.pv,
                                "/",
                                character.stats_max.pv)),
                        react_1.default.createElement("div", { className: "h-2 w-full bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800" },
                            react_1.default.createElement("div", { className: "h-full bg-red-600 transition-all duration-500", style: { width: `${(character.stats_current.pv / character.stats_max.pv) * 100}%` } }))),
                    react_1.default.createElement("div", { className: "flex flex-col gap-1" },
                        react_1.default.createElement("div", { className: "flex justify-between text-[10px] uppercase font-bold text-yellow-500" },
                            react_1.default.createElement("span", null, "PE"),
                            " ",
                            react_1.default.createElement("span", null,
                                character.stats_current.pe,
                                "/",
                                character.stats_max.pe)),
                        react_1.default.createElement("div", { className: "h-2 w-full bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800" },
                            react_1.default.createElement("div", { className: "h-full bg-yellow-500 transition-all duration-500", style: { width: `${(character.stats_current.pe / character.stats_max.pe) * 100}%` } }))),
                    react_1.default.createElement("div", { className: "flex flex-col gap-1" },
                        react_1.default.createElement("div", { className: "flex justify-between text-[10px] uppercase font-bold text-blue-500" },
                            react_1.default.createElement("span", null, "SAN"),
                            " ",
                            react_1.default.createElement("span", null,
                                character.stats_current.san,
                                "/",
                                character.stats_max.san)),
                        react_1.default.createElement("div", { className: "h-2 w-full bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800" },
                            react_1.default.createElement("div", { className: "h-full bg-blue-500 transition-all duration-500", style: { width: `${(character.stats_current.san / character.stats_max.san) * 100}%` } }))))))),
        react_1.default.createElement("aside", { className: `fixed md:relative inset-y-0 right-0 z-30 bg-op-panel border-l border-op-border w-80 shadow-2xl transform transition-transform duration-300 ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}` },
            react_1.default.createElement("div", { className: "p-4 border-b border-op-border flex justify-between items-center whitespace-nowrap bg-op-panel sticky top-0 z-10" },
                react_1.default.createElement("h3", { className: "font-bold uppercase text-xs tracking-widest text-zinc-400 font-typewriter" }, "Painel"),
                react_1.default.createElement("button", { className: "md:hidden text-zinc-500", onClick: () => setRightSidebarOpen(false) },
                    react_1.default.createElement(lucide_react_1.ChevronRight, { className: "w-5 h-5" }))),
            react_1.default.createElement("div", { className: "flex p-2 gap-1 border-b border-op-border bg-op-bg/50" },
                react_1.default.createElement("button", { onClick: () => setRightTab('players'), className: `flex-1 py-2 text-[10px] uppercase font-bold rounded-sm border ${rightTab === 'players' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-transparent hover:text-zinc-300'}` }, "Mesa"),
                isGM && react_1.default.createElement("button", { onClick: () => setRightTab('library'), className: `flex-1 py-2 text-[10px] uppercase font-bold rounded-sm border ${rightTab === 'library' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-transparent hover:text-zinc-300'}` }, "Biblioteca"),
                isGM && react_1.default.createElement("button", { onClick: () => setRightTab('requests'), className: `flex-1 py-2 text-[10px] uppercase font-bold rounded-sm border ${rightTab === 'requests' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-transparent hover:text-zinc-300'} ${pendingPlayers.length > 0 ? 'text-op-gold' : ''}` },
                    "Reqs ",
                    pendingPlayers.length > 0 && `(${pendingPlayers.length})`)),
            react_1.default.createElement("div", { className: "flex-1 overflow-y-auto p-4 custom-scrollbar" },
                rightTab === 'players' && allCharacters.map(char => (react_1.default.createElement("div", { key: char.id, className: `bg-zinc-900/50 border p-3 rounded flex items-center gap-3 mb-2 ${char.is_npc ? 'border-red-900/30' : 'border-zinc-700'}` },
                    react_1.default.createElement("div", { className: `w-8 h-8 rounded-full border flex items-center justify-center bg-zinc-950 font-bold text-xs ${char.is_npc ? 'border-red-500 text-red-500' : 'border-zinc-500 text-zinc-300'}` }, char.name.substring(0, 2)),
                    react_1.default.createElement("span", { className: "text-sm font-bold text-zinc-200 truncate flex-1" }, char.name),
                    isOwner && char.user_id && char.user_id !== (user === null || user === void 0 ? void 0 : user.id) && !char.is_npc && (react_1.default.createElement("button", { onClick: () => handlePromote(char.user_id, char.name), className: "p-1 hover:bg-op-gold/20 rounded text-zinc-600 hover:text-op-gold transition-colors", title: "Promover a Mestre Auxiliar" },
                        react_1.default.createElement(lucide_react_1.Crown, { className: "w-4 h-4" }))),
                    isGM && react_1.default.createElement(lucide_react_1.Eye, { className: "w-4 h-4 text-zinc-600 hover:text-white cursor-pointer" })))),
                rightTab === 'requests' && isGM && (react_1.default.createElement("div", { className: "space-y-2" },
                    pendingPlayers.length === 0 && react_1.default.createElement("p", { className: "text-zinc-500 text-xs text-center py-4" }, "Nenhuma solicita\u00E7\u00E3o pendente."),
                    pendingPlayers.map(req => {
                        var _a, _b;
                        return (react_1.default.createElement("div", { key: req.user_id, className: "bg-zinc-900/80 border border-zinc-700 p-3 rounded-lg" },
                            react_1.default.createElement("div", { className: "flex items-center gap-3 mb-3" },
                                react_1.default.createElement("div", { className: "w-8 h-8 bg-black rounded-full border border-zinc-600 overflow-hidden" }, ((_a = req.profiles) === null || _a === void 0 ? void 0 : _a.avatar_url) ? react_1.default.createElement("img", { src: req.profiles.avatar_url, className: "w-full h-full object-cover" }) : react_1.default.createElement(lucide_react_1.User, { className: "w-4 h-4 m-auto text-zinc-500" })),
                                react_1.default.createElement("div", null,
                                    react_1.default.createElement("p", { className: "text-xs font-bold text-zinc-200" }, ((_b = req.profiles) === null || _b === void 0 ? void 0 : _b.username) || 'Desconhecido'),
                                    react_1.default.createElement("p", { className: "text-[10px] text-op-gold uppercase" }, "Solicitando acesso"))),
                            react_1.default.createElement("div", { className: "flex gap-2" },
                                react_1.default.createElement("button", { onClick: () => handleApprove(req.user_id), className: "flex-1 bg-green-900/20 border border-green-700/50 hover:bg-green-900/40 text-green-400 py-1 rounded text-xs font-bold flex items-center justify-center gap-1" },
                                    react_1.default.createElement(lucide_react_1.Check, { className: "w-3 h-3" }),
                                    " Aceitar"),
                                react_1.default.createElement("button", { onClick: () => handleReject(req.user_id), className: "flex-1 bg-red-900/20 border border-red-700/50 hover:bg-red-900/40 text-red-400 py-1 rounded text-xs font-bold flex items-center justify-center gap-1" },
                                    react_1.default.createElement(lucide_react_1.XCircle, { className: "w-3 h-3" }),
                                    " Recusar"))));
                    }))),
                rightTab === 'library' && isGM && (react_1.default.createElement("div", { className: "space-y-4" },
                    react_1.default.createElement("div", { className: "flex gap-1 mb-2" },
                        react_1.default.createElement("button", { onClick: () => setLibrarySubTab('bestiario'), className: `flex-1 py-1 text-[10px] uppercase font-bold rounded ${librarySubTab === 'bestiario' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}` }, "Monstros"),
                        react_1.default.createElement("button", { onClick: () => setLibrarySubTab('itens'), className: `flex-1 py-1 text-[10px] uppercase font-bold rounded ${librarySubTab === 'itens' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}` }, "Itens")),
                    librarySubTab === 'bestiario' && monsters_json_1.default.map((m) => (react_1.default.createElement("div", { key: m.id, className: "bg-zinc-900/50 border border-zinc-800 p-3 rounded hover:border-op-red/50 cursor-pointer group flex justify-between items-center" },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("h4", { className: "font-bold text-xs text-zinc-200" }, m.name),
                            react_1.default.createElement("span", { className: "text-[10px] text-op-red" },
                                "VD ",
                                m.vd)),
                        react_1.default.createElement("button", { onClick: () => handleSpawn(m.id), className: "opacity-0 group-hover:opacity-100 text-op-red hover:bg-op-red/10 p-1 rounded" },
                            react_1.default.createElement(lucide_react_1.PlusCircle, { className: "w-4 h-4" }))))),
                    librarySubTab === 'itens' && items_json_1.default.armas_simples.slice(0, 10).map((i, idx) => (react_1.default.createElement("div", { key: idx, className: "bg-zinc-900/50 border border-zinc-800 p-2 rounded hover:border-op-gold/50 flex justify-between items-center group relative" },
                        react_1.default.createElement("span", { className: "text-xs text-zinc-400" }, i.nome),
                        react_1.default.createElement("div", { className: "relative group/btn" },
                            react_1.default.createElement("button", { className: "bg-zinc-700 hover:bg-green-600 hover:text-white text-zinc-400 p-1 rounded transition-colors", onClick: () => setSelectedItem(selectedItem === i ? null : i) },
                                react_1.default.createElement(lucide_react_1.Package, { className: "w-3 h-3" })),
                            selectedItem === i && react_1.default.createElement("div", { className: "absolute right-0 top-full mt-1 bg-op-panel border border-op-border rounded shadow-xl p-1 z-50 w-32" },
                                react_1.default.createElement("p", { className: "text-[9px] uppercase font-bold text-zinc-500 mb-1 px-1" }, "Enviar para:"),
                                allCharacters.filter(c => !c.is_npc).map(char => (react_1.default.createElement("button", { key: char.id, onClick: () => handleGiveItem(char.id), className: "w-full text-left text-xs p-1.5 hover:bg-zinc-800 rounded text-zinc-300 truncate" }, char.name)))))))))))),
        isCreatingMap && (react_1.default.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" },
            react_1.default.createElement("div", { className: "bg-op-panel border border-op-border p-6 w-full max-w-md shadow-2xl relative" },
                react_1.default.createElement("h3", { className: "text-lg font-bold text-zinc-200 mb-4 font-typewriter" }, "Definir Local"),
                react_1.default.createElement("div", { className: "space-y-4" },
                    react_1.default.createElement(OpInput_1.OpInput, { label: "Nome do Local", value: newMapName, onChange: (e) => setNewMapName(e.target.value) }),
                    react_1.default.createElement(OpFileUpload_1.OpFileUpload, { label: "Imagem do Mapa", onUpload: (url) => setNewMapImage(url) }),
                    react_1.default.createElement("div", { className: "flex gap-2 pt-2" },
                        react_1.default.createElement(OpButton_1.OpButton, { variant: "ghost", onClick: () => setIsCreatingMap(false), className: "flex-1" }, "Cancelar"),
                        react_1.default.createElement(OpButton_1.OpButton, { onClick: handleCreateMap, className: "flex-1" }, "Confirmar")))))),
        isRolling && (react_1.default.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" },
            react_1.default.createElement("div", { className: "bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl" },
                react_1.default.createElement("h3", { className: "text-lg font-bold text-zinc-200 mb-4 font-typewriter text-center" }, "Configurar Rolagem"),
                react_1.default.createElement("div", { className: "space-y-4" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs text-zinc-500 uppercase font-bold mb-2 block" }, "Atributo Base"),
                        react_1.default.createElement("div", { className: "grid grid-cols-5 gap-2" }, ['for', 'agi', 'int', 'pre', 'vig'].map(attr => (react_1.default.createElement("button", { key: attr, onClick: () => setRollConfig({ ...rollConfig, attr }), className: `p-2 rounded border uppercase font-bold text-xs ${rollConfig.attr === attr ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}` }, attr))))),
                    react_1.default.createElement("div", { className: "flex gap-2" },
                        react_1.default.createElement("button", { onClick: () => setRollConfig({ ...rollConfig, advantage: -1 }), className: `flex-1 p-2 border rounded text-xs uppercase font-bold ${rollConfig.advantage === -1 ? 'bg-red-900/30 border-red-500 text-red-500' : 'border-zinc-700 text-zinc-500'}` }, "Desvantagem"),
                        react_1.default.createElement("button", { onClick: () => setRollConfig({ ...rollConfig, advantage: 0 }), className: `flex-1 p-2 border rounded text-xs uppercase font-bold ${rollConfig.advantage === 0 ? 'bg-zinc-800 border-zinc-500 text-white' : 'border-zinc-700 text-zinc-500'}` }, "Normal"),
                        react_1.default.createElement("button", { onClick: () => setRollConfig({ ...rollConfig, advantage: 1 }), className: `flex-1 p-2 border rounded text-xs uppercase font-bold ${rollConfig.advantage === 1 ? 'bg-green-900/30 border-green-500 text-green-500' : 'border-zinc-700 text-zinc-500'}` }, "Vantagem")),
                    react_1.default.createElement(OpButton_1.OpButton, { onClick: confirmRoll, className: "w-full mt-4" }, "Rolar Dados"),
                    react_1.default.createElement("button", { onClick: () => setIsRolling(false), className: "w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-2" }, "Cancelar"))))),
        react_1.default.createElement("button", { onClick: () => setRightSidebarOpen(!rightSidebarOpen), className: `hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-zinc-800 border border-zinc-700 p-1 rounded-l-md hover:bg-zinc-700 transition-all ${rightSidebarOpen ? 'right-80' : 'right-0'}` }, rightSidebarOpen ? react_1.default.createElement(lucide_react_1.ChevronRight, { className: "w-4 h-4" }) : react_1.default.createElement(lucide_react_1.ChevronLeft, { className: "w-4 h-4" }))));
};
exports.GameRoom = GameRoom;
//# sourceMappingURL=GameRoom.js.map