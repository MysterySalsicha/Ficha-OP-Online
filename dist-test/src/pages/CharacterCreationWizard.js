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
exports.CharacterCreationWizard = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const game_store_1 = require("../store/game-store");
const AuthContext_1 = require("../contexts/AuthContext");
const OpButton_1 = require("../components/ui-op/OpButton");
const OpInput_1 = require("../components/ui-op/OpInput");
const origins_json_1 = __importDefault(require("../data/rules/origins.json"));
const STEPS = ['Conceito', 'Classe & Origem', 'Atributos', 'Finalizar'];
const CharacterCreationWizard = () => {
    const { mesaId } = (0, react_router_dom_1.useParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { user } = (0, AuthContext_1.useAuth)();
    const { initialize, createCharacter } = (0, game_store_1.useGameStore)();
    const [step, setStep] = (0, react_1.useState)(0);
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        isSurvivor: false,
        origin: '',
        class: 'especialista',
        attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 },
        pointsRemaining: 4
    });
    (0, react_1.useEffect)(() => {
        if (user && mesaId)
            initialize(user, mesaId);
    }, [user, mesaId, initialize]);
    const handleNext = () => setStep(p => p + 1);
    const handleBack = () => setStep(p => p - 1);
    const toggleSurvivor = (isSurvivor) => {
        setFormData(prev => ({
            ...prev,
            isSurvivor,
            class: isSurvivor ? 'sobrevivente' : 'especialista',
            pointsRemaining: isSurvivor ? 3 : 4,
            attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1 }
        }));
    };
    const handleAttrChange = (attr, delta) => {
        const currentVal = formData.attributes[attr];
        const newVal = currentVal + delta;
        if (newVal < 0 || newVal > 3)
            return;
        if (delta > 0 && formData.pointsRemaining < 1)
            return;
        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attr]: newVal },
            pointsRemaining: prev.pointsRemaining - delta
        }));
    };
    const handleFinish = async () => {
        if (!mesaId)
            return;
        const result = await createCharacter(formData);
        if (result.success) {
            navigate(`/mesa/${mesaId}`);
        }
        else {
            alert(result.message);
        }
    };
    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (react_1.default.createElement("div", { className: "space-y-6" },
                    react_1.default.createElement("h3", { className: "text-xl font-typewriter text-op-red uppercase" }, "Identidade"),
                    react_1.default.createElement(OpInput_1.OpInput, { label: "Nome do Personagem", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }), placeholder: "Ex: Arthur Cervero" }),
                    react_1.default.createElement("div", { className: "flex gap-4 mt-6" },
                        react_1.default.createElement("div", { onClick: () => toggleSurvivor(false), className: `flex-1 p-4 border cursor-pointer transition-all ${!formData.isSurvivor ? 'border-op-gold bg-op-gold/10' : 'border-zinc-700 opacity-50'}` },
                            react_1.default.createElement("h4", { className: "font-bold text-zinc-200" }, "Agente da Ordem"),
                            react_1.default.createElement("p", { className: "text-[10px] text-zinc-500 mt-2" }, "NEX 5%. Treinamento t\u00E1tico avan\u00E7ado.")),
                        react_1.default.createElement("div", { onClick: () => toggleSurvivor(true), className: `flex-1 p-4 border cursor-pointer transition-all ${formData.isSurvivor ? 'border-op-red bg-op-red/10' : 'border-zinc-700 opacity-50'}` },
                            react_1.default.createElement("h4", { className: "font-bold text-zinc-200" }, "Sobrevivente"),
                            react_1.default.createElement("p", { className: "text-[10px] text-zinc-500 mt-2" }, "NEX 0%. Pessoa comum em perigo.")))));
            case 1:
                return (react_1.default.createElement("div", { className: "space-y-6" },
                    !formData.isSurvivor && (react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-[10px] font-bold text-zinc-500 uppercase" }, "Classe"),
                        react_1.default.createElement("div", { className: "grid grid-cols-3 gap-2 mt-1" }, ['combatente', 'especialista', 'ocultista'].map(cls => (react_1.default.createElement("button", { key: cls, onClick: () => setFormData({ ...formData, class: cls }), className: `p-2 border rounded uppercase text-[10px] font-bold ${formData.class === cls ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}` }, cls)))))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-[10px] font-bold text-zinc-500 uppercase" }, "Origem"),
                        react_1.default.createElement("select", { className: "w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 outline-none mt-1", value: formData.origin, onChange: e => setFormData({ ...formData, origin: e.target.value }) },
                            react_1.default.createElement("option", { value: "" }, "Selecione..."),
                            origins_json_1.default.origins.map(o => react_1.default.createElement("option", { key: o.id, value: o.id }, o.name))))));
            case 2:
                return (react_1.default.createElement("div", { className: "space-y-6 text-center" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-5xl font-black text-white" }, formData.pointsRemaining),
                        react_1.default.createElement("p", { className: "text-[10px] text-zinc-500 uppercase tracking-widest" }, "Pontos de Atributo")),
                    react_1.default.createElement("div", { className: "flex justify-center gap-4" }, ['agi', 'for', 'int', 'pre', 'vig'].map(attr => (react_1.default.createElement("div", { key: attr, className: "flex flex-col items-center gap-1" },
                        react_1.default.createElement("button", { onClick: () => handleAttrChange(attr, 1), className: "text-zinc-500 hover:text-white" }, "\u25B2"),
                        react_1.default.createElement("div", { className: "w-10 h-10 flex items-center justify-center border border-zinc-700 rounded bg-zinc-950 font-bold text-lg" }, formData.attributes[attr]),
                        react_1.default.createElement("button", { onClick: () => handleAttrChange(attr, -1), className: "text-zinc-500 hover:text-white" }, "\u25BC"),
                        react_1.default.createElement("span", { className: "text-[9px] font-bold uppercase text-zinc-600" }, attr)))))));
            case 3:
                return (react_1.default.createElement("div", { className: "space-y-4 text-center" },
                    react_1.default.createElement("h3", { className: "text-2xl font-bold text-white uppercase font-typewriter" }, formData.name || 'Sem Nome'),
                    react_1.default.createElement("p", { className: "text-op-gold uppercase text-xs tracking-widest" },
                        formData.class,
                        " \u2022 ",
                        formData.isSurvivor ? 'NEX 0%' : 'NEX 5%'),
                    react_1.default.createElement("div", { className: "p-4 bg-zinc-950/50 border border-zinc-800 rounded text-left text-[10px] uppercase font-mono space-y-1" },
                        react_1.default.createElement("p", null,
                            react_1.default.createElement("span", { className: "text-zinc-600" }, "Origem:"),
                            " ",
                            formData.origin || 'Nenhuma'),
                        react_1.default.createElement("p", null,
                            react_1.default.createElement("span", { className: "text-zinc-600" }, "Atributos:"),
                            " ",
                            Object.entries(formData.attributes).map(([k, v]) => `${k}:${v}`).join(' / ')))));
            default: return null;
        }
    };
    return (react_1.default.createElement("div", { className: "min-h-screen bg-op-bg text-zinc-100 flex items-center justify-center p-4 bg-noise font-sans" },
        react_1.default.createElement("div", { className: "w-full max-w-3xl bg-op-panel border border-op-border shadow-2xl flex flex-col md:flex-row h-[450px]" },
            react_1.default.createElement("div", { className: "w-full md:w-1/4 bg-zinc-900/50 border-b md:border-b-0 md:border-r border-op-border p-6 flex flex-col justify-center gap-4" }, STEPS.map((label, idx) => (react_1.default.createElement("div", { key: idx, className: `flex items-center gap-3 ${idx === step ? 'opacity-100 scale-105' : 'opacity-30'}` },
                react_1.default.createElement("div", { className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${idx <= step ? 'bg-op-red border-op-red text-white' : 'border-zinc-600'}` }, idx + 1),
                react_1.default.createElement("span", { className: `text-[10px] font-bold uppercase tracking-tighter ${idx === step ? 'text-op-red' : ''}` }, label))))),
            react_1.default.createElement("div", { className: "flex-1 p-10 flex flex-col justify-between" },
                react_1.default.createElement("div", { className: "flex-1" }, renderStepContent()),
                react_1.default.createElement("div", { className: "flex justify-between mt-8 border-t border-zinc-800 pt-6" },
                    react_1.default.createElement(OpButton_1.OpButton, { variant: "ghost", onClick: handleBack, disabled: step === 0 }, "Anterior"),
                    step === STEPS.length - 1 ? (react_1.default.createElement(OpButton_1.OpButton, { onClick: handleFinish, variant: "primary", className: "border-op-gold text-op-gold" }, "Finalizar Agente")) : (react_1.default.createElement(OpButton_1.OpButton, { onClick: handleNext, disabled: !formData.name || (step === 2 && formData.pointsRemaining > 0) }, "Pr\u00F3ximo")))))));
};
exports.CharacterCreationWizard = CharacterCreationWizard;
//# sourceMappingURL=CharacterCreationWizard.js.map