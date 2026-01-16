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
exports.CharacterSheet = void 0;
const react_1 = __importStar(require("react"));
const game_store_1 = require("../store/game-store");
const OpToast_1 = require("./ui-op/OpToast");
const lucide_react_1 = require("lucide-react");
const LevelUpModal_1 = require("./modals/LevelUpModal");
const CharacterSheet = () => {
    const { character, items } = (0, game_store_1.useGameStore)(); // Removido increaseAttribute direto
    const { showToast } = (0, OpToast_1.useToast)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('pericias');
    const [isLevelingUp, setIsLevelingUp] = (0, react_1.useState)(false);
    if (!character)
        return react_1.default.createElement("div", { className: "p-8 text-center text-zinc-500 font-typewriter" }, "Carregando Dossi\u00EA...");
    // Helper para ícones de atributos (Sem Click)
    const AttrHex = ({ label, value, color }) => (react_1.default.createElement("div", { className: "flex flex-col items-center justify-center w-24 h-24 relative group select-none" },
        react_1.default.createElement("svg", { viewBox: "0 0 100 100", className: "absolute inset-0 w-full h-full text-zinc-800 fill-zinc-900 stroke-2 transition-colors" },
            react_1.default.createElement("polygon", { points: "50 0, 100 25, 100 75, 50 100, 0 75, 0 25", stroke: "currentColor" })),
        react_1.default.createElement("span", { className: "relative z-10 text-2xl font-black text-zinc-100 font-typewriter" }, value),
        react_1.default.createElement("span", { className: `relative z-10 text-[10px] font-bold uppercase tracking-widest mt-1 ${color}` }, label)));
    return (react_1.default.createElement("div", { className: "bg-op-panel w-full h-full flex flex-col font-sans text-zinc-200 overflow-hidden relative" },
        isLevelingUp && react_1.default.createElement(LevelUpModal_1.LevelUpModal, { onClose: () => setIsLevelingUp(false) }),
        react_1.default.createElement("div", { className: "absolute top-0 right-0 p-4 opacity-5 pointer-events-none" },
            react_1.default.createElement("img", { src: "https://ordemparanormal.com.br/wp-content/uploads/2022/05/simbolo-ordem.png", className: "w-64 h-64 grayscale", alt: "" })),
        react_1.default.createElement("header", { className: "flex justify-between items-end p-6 border-b border-op-border bg-op-bg/50 backdrop-blur-sm z-10" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { className: "text-4xl font-typewriter font-bold text-zinc-100 uppercase tracking-tighter leading-none" }, character.name),
                react_1.default.createElement("div", { className: "flex gap-4 mt-2 text-xs font-mono text-zinc-500 uppercase tracking-widest items-center" },
                    react_1.default.createElement("span", { className: "text-op-red font-bold" }, character.class),
                    react_1.default.createElement("span", null,
                        "NEX ",
                        character.nex,
                        "%"),
                    react_1.default.createElement("span", null, character.patente),
                    react_1.default.createElement("button", { onClick: () => setIsLevelingUp(true), className: "flex items-center gap-1 bg-op-gold/10 text-op-gold border border-op-gold/50 px-2 py-0.5 rounded hover:bg-op-gold/20 transition-colors animate-pulse" },
                        react_1.default.createElement(lucide_react_1.ChevronUp, { className: "w-3 h-3" }),
                        " Evoluir"))),
            react_1.default.createElement("div", { className: "flex flex-col items-center bg-zinc-900 border border-op-border p-2 rounded-sm w-20" },
                react_1.default.createElement(lucide_react_1.Shield, { className: "w-5 h-5 text-zinc-600 mb-1" }),
                react_1.default.createElement("span", { className: "text-2xl font-bold" }, character.defenses.passiva),
                react_1.default.createElement("span", { className: "text-[8px] uppercase text-zinc-600" }, "Defesa"))),
        react_1.default.createElement("div", { className: "flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8" },
            react_1.default.createElement("div", { className: "md:col-span-3 flex flex-col gap-4" },
                react_1.default.createElement("div", { className: "bg-zinc-900/50 border border-red-900/30 p-4 rounded-sm relative overflow-hidden" },
                    react_1.default.createElement("div", { className: "absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-500", style: { width: `${(character.stats_current.pv / character.stats_max.pv) * 100}%` } }),
                    react_1.default.createElement("div", { className: "flex justify-between items-center mb-2" },
                        react_1.default.createElement("span", { className: "text-xs font-bold text-red-500 uppercase" }, "Vida"),
                        react_1.default.createElement(lucide_react_1.Heart, { className: "w-4 h-4 text-red-500" })),
                    react_1.default.createElement("div", { className: "text-3xl font-black text-white" },
                        character.stats_current.pv,
                        " ",
                        react_1.default.createElement("span", { className: "text-sm text-zinc-600 font-normal" },
                            "/ ",
                            character.stats_max.pv))),
                react_1.default.createElement("div", { className: "bg-zinc-900/50 border border-yellow-900/30 p-4 rounded-sm relative overflow-hidden" },
                    react_1.default.createElement("div", { className: "absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-500", style: { width: `${(character.stats_current.pe / character.stats_max.pe) * 100}%` } }),
                    react_1.default.createElement("div", { className: "flex justify-between items-center mb-2" },
                        react_1.default.createElement("span", { className: "text-xs font-bold text-yellow-500 uppercase" }, "Esfor\u00E7o"),
                        react_1.default.createElement(lucide_react_1.Zap, { className: "w-4 h-4 text-yellow-500" })),
                    react_1.default.createElement("div", { className: "text-3xl font-black text-white" },
                        character.stats_current.pe,
                        " ",
                        react_1.default.createElement("span", { className: "text-sm text-zinc-600 font-normal" },
                            "/ ",
                            character.stats_max.pe))),
                react_1.default.createElement("div", { className: "bg-zinc-900/50 border border-blue-900/30 p-4 rounded-sm relative overflow-hidden" },
                    react_1.default.createElement("div", { className: "absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500", style: { width: `${(character.stats_current.san / character.stats_max.san) * 100}%` } }),
                    react_1.default.createElement("div", { className: "flex justify-between items-center mb-2" },
                        react_1.default.createElement("span", { className: "text-xs font-bold text-blue-500 uppercase" }, "Sanidade"),
                        react_1.default.createElement(lucide_react_1.Brain, { className: "w-4 h-4 text-blue-500" })),
                    react_1.default.createElement("div", { className: "text-3xl font-black text-white" },
                        character.stats_current.san,
                        " ",
                        react_1.default.createElement("span", { className: "text-sm text-zinc-600 font-normal" },
                            "/ ",
                            character.stats_max.san)))),
            react_1.default.createElement("div", { className: "md:col-span-6 flex items-center justify-center py-8" },
                react_1.default.createElement("div", { className: "relative w-64 h-64" },
                    react_1.default.createElement("div", { className: "absolute top-0 left-1/2 -translate-x-1/2" },
                        react_1.default.createElement(AttrHex, { label: "Agi", value: character.attributes.agi, color: "text-yellow-500" })),
                    react_1.default.createElement("div", { className: "absolute top-1/3 left-0 -translate-x-4" },
                        react_1.default.createElement(AttrHex, { label: "For", value: character.attributes.for, color: "text-red-500" })),
                    react_1.default.createElement("div", { className: "absolute top-1/3 right-0 translate-x-4" },
                        react_1.default.createElement(AttrHex, { label: "Int", value: character.attributes.int, color: "text-blue-500" })),
                    react_1.default.createElement("div", { className: "absolute bottom-0 left-4" },
                        react_1.default.createElement(AttrHex, { label: "Vig", value: character.attributes.vig, color: "text-green-500" })),
                    react_1.default.createElement("div", { className: "absolute bottom-0 right-4" },
                        react_1.default.createElement(AttrHex, { label: "Pre", value: character.attributes.pre, color: "text-purple-500" })),
                    react_1.default.createElement("svg", { className: "absolute inset-0 w-full h-full pointer-events-none opacity-20 text-zinc-500" },
                        react_1.default.createElement("polygon", { points: "50,15 90,40 75,85 25,85 10,40", fill: "none", stroke: "currentColor", strokeWidth: "1" })))),
            react_1.default.createElement("div", { className: "md:col-span-3 flex flex-col bg-zinc-900/30 border border-op-border rounded-sm h-full" },
                react_1.default.createElement("div", { className: "flex border-b border-op-border" },
                    react_1.default.createElement("button", { onClick: () => setActiveTab('pericias'), className: `flex-1 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors ${activeTab === 'pericias' ? 'bg-zinc-800 text-white border-b-2 border-op-red' : 'text-zinc-500'}` }, "Per\u00EDcias"),
                    react_1.default.createElement("button", { onClick: () => setActiveTab('inventario'), className: `flex-1 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors ${activeTab === 'inventario' ? 'bg-zinc-800 text-white border-b-2 border-op-red' : 'text-zinc-500'}` }, "Itens")),
                react_1.default.createElement("div", { className: "flex-1 overflow-y-auto p-4 custom-scrollbar" },
                    activeTab === 'pericias' && (react_1.default.createElement("div", { className: "space-y-1" },
                        ['Luta', 'Pontaria', 'Reflexos', 'Fortitude', 'Vontade', 'Ocultismo'].map(skill => (react_1.default.createElement("div", { key: skill, className: "flex justify-between items-center p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 cursor-default group" },
                            react_1.default.createElement("span", { className: "text-xs font-bold text-zinc-400 group-hover:text-zinc-200" }, skill),
                            react_1.default.createElement("div", { className: "flex gap-1 items-center" },
                                [1, 2, 3].map(level => (react_1.default.createElement("div", { key: level, className: `w-1.5 h-1.5 rounded-sm ${level <= 1 ? 'bg-op-red' : 'bg-zinc-800'}` }))),
                                react_1.default.createElement("span", { className: "text-xs font-mono ml-2 text-zinc-500" }, "+5"))))),
                        react_1.default.createElement("p", { className: "text-[10px] text-zinc-600 mt-4 text-center italic" }, "Lista completa indispon\u00EDvel no MVP"))),
                    activeTab === 'inventario' && (react_1.default.createElement("div", { className: "space-y-2" },
                        items.map((item, i) => (react_1.default.createElement("div", { key: i, className: "bg-zinc-900 border border-zinc-800 p-2 flex justify-between items-center" },
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("span", { className: "text-xs font-bold text-zinc-300 block" }, item.name),
                                react_1.default.createElement("span", { className: "text-[10px] text-zinc-500 uppercase" },
                                    item.category,
                                    " \u2022 ",
                                    item.slots)),
                            item.category === 'arma' && (react_1.default.createElement("button", { className: "text-op-red hover:bg-op-red/10 p-1 rounded" },
                                react_1.default.createElement(lucide_react_1.Crosshair, { className: "w-4 h-4" })))))),
                        react_1.default.createElement("div", { className: "mt-4 pt-4 border-t border-zinc-800 flex justify-between text-xs text-zinc-500 font-mono" },
                            react_1.default.createElement("span", null, "CARGA"),
                            react_1.default.createElement("span", null,
                                items.reduce((a, i) => a + i.slots, 0),
                                " / ",
                                character.inventory_slots_max)))))))));
};
exports.CharacterSheet = CharacterSheet;
//# sourceMappingURL=CharacterSheet.js.map