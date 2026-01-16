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
exports.LevelUpModal = void 0;
const react_1 = __importStar(require("react"));
const game_store_1 = require("../../store/game-store");
const OpButton_1 = require("../ui-op/OpButton");
const lucide_react_1 = require("lucide-react");
const LevelUpModal = ({ onClose }) => {
    const { character, increaseAttribute } = (0, game_store_1.useGameStore)();
    const [choice, setChoice] = (0, react_1.useState)('');
    if (!character)
        return null;
    const nextNex = character.nex + 5;
    let rewardType = 'Nada';
    if (nextNex % 20 === 0)
        rewardType = 'Atributo';
    else if (nextNex === 10)
        rewardType = 'Trilha';
    else if (nextNex % 15 === 0)
        rewardType = 'Poder';
    else
        rewardType = 'Habilidade de Classe';
    const handleConfirm = async () => {
        if (rewardType === 'Atributo' && choice) {
            await increaseAttribute(choice);
            onClose();
        }
        else {
            alert(`Evolução para NEX ${nextNex}% registrada!`);
            onClose();
        }
    };
    return (react_1.default.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" },
        react_1.default.createElement("div", { className: "bg-zinc-900 border border-op-gold p-6 w-full max-w-md shadow-2xl relative" },
            react_1.default.createElement("div", { className: "text-center mb-6" },
                react_1.default.createElement("h2", { className: "text-2xl font-bold text-op-gold uppercase tracking-widest flex items-center justify-center gap-2" },
                    react_1.default.createElement(lucide_react_1.ChevronUp, { className: "w-6 h-6" }),
                    " Subir de N\u00EDvel"),
                react_1.default.createElement("p", { className: "text-zinc-400 font-mono text-sm mt-2" },
                    "NEX ",
                    character.nex,
                    "% ",
                    react_1.default.createElement("span", { className: "text-zinc-600 mx-2" }, "\u2794"),
                    " ",
                    react_1.default.createElement("span", { className: "text-white font-bold" },
                        nextNex,
                        "%"))),
            react_1.default.createElement("div", { className: "mb-8" },
                react_1.default.createElement("h3", { className: "text-sm font-bold text-zinc-300 uppercase mb-4 border-b border-zinc-700 pb-2 text-center" },
                    "Recompensa Dispon\u00EDvel: ",
                    react_1.default.createElement("span", { className: "text-op-red" }, rewardType)),
                rewardType === 'Atributo' ? (react_1.default.createElement("div", { className: "grid grid-cols-5 gap-2" }, ['for', 'agi', 'int', 'pre', 'vig'].map(attr => (react_1.default.createElement("button", { key: attr, onClick: () => setChoice(attr), className: `
                                        p-3 rounded border flex flex-col items-center gap-1 transition-all
                                        ${choice === attr
                        ? 'bg-op-gold/20 border-op-gold text-op-gold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}
                                    ` },
                    react_1.default.createElement("span", { className: "text-lg font-black uppercase" }, attr),
                    react_1.default.createElement("span", { className: "text-xs font-mono" }, character.attributes[attr])))))) : (react_1.default.createElement("div", { className: "text-center text-zinc-500 text-xs italic py-4 border border-dashed border-zinc-800 rounded bg-zinc-950/50" },
                    "Selecione sua nova habilidade no Livro de Regras.",
                    react_1.default.createElement("br", null),
                    "(Sistema automatizado em breve)"))),
            react_1.default.createElement("div", { className: "flex gap-3" },
                react_1.default.createElement(OpButton_1.OpButton, { variant: "ghost", onClick: onClose, className: "flex-1" }, "Adiar"),
                react_1.default.createElement(OpButton_1.OpButton, { onClick: handleConfirm, disabled: rewardType === 'Atributo' && !choice, className: "flex-1 border-op-gold text-op-gold hover:bg-op-gold hover:text-black" }, "Confirmar")))));
};
exports.LevelUpModal = LevelUpModal;
//# sourceMappingURL=LevelUpModal.js.map