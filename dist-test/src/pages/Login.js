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
exports.Login = void 0;
const react_1 = __importStar(require("react"));
const supabase_1 = require("../lib/supabase");
const react_router_dom_1 = require("react-router-dom");
const OpButton_1 = require("../components/ui-op/OpButton");
const OpInput_1 = require("../components/ui-op/OpInput");
const OpToast_1 = require("../components/ui-op/OpToast");
const error_handler_1 = require("../lib/error-handler");
const Login = () => {
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [username, setUsername] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [isSignUp, setIsSignUp] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { showToast } = (0, OpToast_1.useToast)();
    const handleAuth = async (e) => {
        e.preventDefault();
        // Validação básica no front
        if (password.length < 6) {
            showToast("A senha deve ter no mínimo 6 caracteres.", "error");
            return;
        }
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase_1.supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: username }
                    }
                });
                if (error)
                    throw error;
                showToast('Recrutamento solicitado! Verifique seu e-mail.', 'success');
                setIsSignUp(false);
            }
            else {
                const { error } = await supabase_1.supabase.auth.signInWithPassword({ email, password });
                if (error)
                    throw error;
                showToast('Identificação confirmada.', 'success');
                navigate('/lobby');
            }
        }
        catch (error) {
            setLoading(false); // Limpa o loading IMEDIATAMENTE no erro
            const friendlyMessage = (0, error_handler_1.translateError)(error);
            showToast(friendlyMessage, 'error');
        }
        finally {
            setLoading(false);
        }
    };
    return (react_1.default.createElement("div", { className: "flex flex-col items-center justify-center min-h-screen bg-op-bg text-zinc-100 p-4 relative overflow-hidden bg-noise" },
        react_1.default.createElement("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-op-bg to-op-bg z-0 pointer-events-none" }),
        react_1.default.createElement("div", { className: "absolute top-0 left-0 w-full h-full scanline z-10 pointer-events-none opacity-20" }),
        react_1.default.createElement("div", { className: "z-20 w-full max-w-md flex flex-col items-center" },
            react_1.default.createElement("div", { className: "mb-8 text-center animate-pulse" },
                react_1.default.createElement("h1", { className: "text-4xl font-typewriter font-bold text-zinc-100 tracking-tighter uppercase" }, "ORDEM PARANORMAL"),
                react_1.default.createElement("p", { className: "text-[10px] uppercase tracking-[0.3em] text-op-gold mt-1" }, "Acesso Restrito - Ordo Realitas")),
            react_1.default.createElement("div", { className: "bg-op-panel border border-op-border p-8 w-full shadow-2xl relative" },
                react_1.default.createElement("div", { className: "absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-op-red" }),
                react_1.default.createElement("div", { className: "absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-op-red" }),
                react_1.default.createElement("h2", { className: "text-lg font-bold mb-6 text-center text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2" }, isSignUp ? 'Protocolo de Recrutamento' : 'Identificação de Agente'),
                react_1.default.createElement("form", { onSubmit: handleAuth, className: "space-y-6" },
                    isSignUp && (react_1.default.createElement(OpInput_1.OpInput, { label: "Codinome do Agente", type: "text", placeholder: "Nome de Guerra", value: username, onChange: (e) => setUsername(e.target.value), required: true })),
                    react_1.default.createElement(OpInput_1.OpInput, { label: "Credencial (E-mail)", type: "email", placeholder: "agente@ordo.com", value: email, onChange: (e) => setEmail(e.target.value), required: true }),
                    react_1.default.createElement(OpInput_1.OpInput, { label: "Chave de Acesso", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), required: true }),
                    react_1.default.createElement(OpButton_1.OpButton, { type: "submit", disabled: loading, className: "w-full mt-4", variant: "danger" }, loading ? 'Sincronizando...' : (isSignUp ? 'Assinar Contrato' : 'Confirmar Acesso'))),
                react_1.default.createElement("div", { className: "mt-6 text-center" },
                    react_1.default.createElement("button", { onClick: () => setIsSignUp(!isSignUp), className: "text-xs text-zinc-600 hover:text-op-red transition-colors uppercase tracking-wider" }, isSignUp ? 'Já possuo credenciais' : 'Solicitar novo acesso'))))));
};
exports.Login = Login;
//# sourceMappingURL=Login.js.map