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
exports.Lobby = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("../contexts/AuthContext");
const mesa_1 = require("../lib/mesa");
const OpButton_1 = require("../components/ui-op/OpButton");
const OpInput_1 = require("../components/ui-op/OpInput");
const OpFileUpload_1 = require("../components/ui-op/OpFileUpload");
const OpToast_1 = require("../components/ui-op/OpToast");
const lucide_react_1 = require("lucide-react");
const Lobby = () => {
    var _a, _b, _c, _d;
    const { user, updateProfile, signOut } = (0, AuthContext_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { showToast } = (0, OpToast_1.useToast)();
    const [joinCode, setJoinCode] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [isEditingProfile, setIsEditingProfile] = (0, react_1.useState)(false);
    const [editName, setEditName] = (0, react_1.useState)(((_a = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) || '');
    const [editAvatar, setEditAvatar] = (0, react_1.useState)(((_b = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _b === void 0 ? void 0 : _b.avatar_url) || '');
    // Estados do Modal de Criação
    const [isCreatingMesa, setIsCreatingMesa] = (0, react_1.useState)(false);
    const [newMesaName, setNewMesaName] = (0, react_1.useState)('');
    const handleOpenCreateModal = () => {
        setNewMesaName('');
        setIsCreatingMesa(true);
    };
    const confirmCreateMesa = async () => {
        if (!user || !newMesaName.trim())
            return;
        setLoading(true);
        try {
            const newMesa = await (0, mesa_1.createMesa)(newMesaName, user.id);
            setIsCreatingMesa(false);
            showToast('Operação iniciada com sucesso!', 'success');
            navigate(`/mesa/${newMesa.id}`);
        }
        catch (error) {
            showToast(`Falha ao criar missão: ${error.message}`, 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleJoin = async () => {
        if (!joinCode || !user) {
            showToast('Insira um código de acesso válido.', 'info');
            return;
        }
        setLoading(true);
        try {
            // 1. Verifica se a mesa existe
            const mesa = await (0, mesa_1.joinMesa)(joinCode.toUpperCase().trim());
            // 2. Cria solicitação de entrada
            await (0, mesa_1.requestJoinMesa)(mesa.id, user.id);
            showToast('Solicitação enviada! Aguarde a aprovação do Mestre.', 'success');
            // 3. Redireciona (a GameRoom vai mostrar "Aguardando Aprovação")
            navigate(`/mesa/${mesa.id}`);
        }
        catch (error) {
            showToast(error.message, 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveProfile = async () => {
        try {
            await updateProfile(editName, editAvatar);
            setIsEditingProfile(false);
            showToast('Credenciais atualizadas.', 'success');
        }
        catch (error) {
            showToast('Erro ao atualizar perfil.', 'error');
        }
    };
    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };
    return (react_1.default.createElement("div", { className: "min-h-screen bg-op-bg text-zinc-100 p-8 bg-noise font-sans relative" },
        react_1.default.createElement("div", { className: "scanline absolute inset-0 z-0 opacity-10 pointer-events-none" }),
        react_1.default.createElement("header", { className: "flex justify-between items-center mb-16 relative z-10 border-b border-op-border pb-4" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { className: "text-3xl font-typewriter font-bold text-op-red uppercase tracking-widest" }, "Painel de Miss\u00F5es"),
                react_1.default.createElement("p", { className: "text-[10px] text-zinc-500 font-mono mt-1" }, "SISTEMA VER. 1.1 // ORDO REALITAS")),
            react_1.default.createElement("div", { className: "flex items-center gap-6" },
                react_1.default.createElement("div", { className: "flex items-center gap-4 cursor-pointer hover:bg-zinc-900 p-2 rounded transition-colors", onClick: () => setIsEditingProfile(true) },
                    react_1.default.createElement("div", { className: "text-right hidden sm:block" },
                        react_1.default.createElement("span", { className: "block text-xs font-bold text-zinc-300 uppercase" }, ((_c = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _c === void 0 ? void 0 : _c.full_name) || 'Agente'),
                        react_1.default.createElement("span", { className: "block text-[10px] text-op-gold" }, "N\u00EDvel de Acesso: CONFIDENCIAL")),
                    react_1.default.createElement("div", { className: "w-10 h-10 bg-zinc-900 rounded border border-op-border flex items-center justify-center overflow-hidden relative group" },
                        ((_d = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _d === void 0 ? void 0 : _d.avatar_url) ? react_1.default.createElement("img", { src: user.user_metadata.avatar_url, alt: "Avatar", className: "w-full h-full object-cover" }) : react_1.default.createElement(lucide_react_1.Users, { className: "w-5 h-5 text-zinc-600" }),
                        react_1.default.createElement("div", { className: "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" },
                            react_1.default.createElement(lucide_react_1.Edit, { className: "w-4 h-4 text-white" })))),
                react_1.default.createElement("button", { onClick: handleLogout, className: "text-zinc-500 hover:text-op-red transition-colors", title: "Deslogar" },
                    react_1.default.createElement(lucide_react_1.LogOut, { className: "w-5 h-5" })))),
        isEditingProfile && (react_1.default.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" },
            react_1.default.createElement("div", { className: "bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200" },
                react_1.default.createElement("h3", { className: "text-lg font-bold text-zinc-200 mb-4 font-typewriter" }, "Editar Credenciais"),
                react_1.default.createElement("div", { className: "space-y-4" },
                    react_1.default.createElement(OpInput_1.OpInput, { label: "Nome do Agente", value: editName, onChange: (e) => setEditName(e.target.value) }),
                    react_1.default.createElement(OpFileUpload_1.OpFileUpload, { label: "Foto de Identifica\u00E7\u00E3o", defaultUrl: editAvatar, onUpload: (url) => setEditAvatar(url) }),
                    react_1.default.createElement("div", { className: "flex gap-2 pt-2" },
                        react_1.default.createElement(OpButton_1.OpButton, { variant: "ghost", onClick: () => setIsEditingProfile(false), className: "flex-1" },
                            react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4 mr-2" }),
                            " Cancelar"),
                        react_1.default.createElement(OpButton_1.OpButton, { onClick: handleSaveProfile, className: "flex-1" },
                            react_1.default.createElement(lucide_react_1.Save, { className: "w-4 h-4 mr-2" }),
                            " Salvar")))))),
        isCreatingMesa && (react_1.default.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" },
            react_1.default.createElement("div", { className: "bg-op-panel border border-op-border p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200" },
                react_1.default.createElement("h3", { className: "text-lg font-bold text-op-red mb-1 font-typewriter uppercase tracking-widest" }, "Nova Opera\u00E7\u00E3o"),
                react_1.default.createElement("p", { className: "text-xs text-zinc-500 mb-6 font-mono" }, "Defina o codinome da miss\u00E3o para o arquivo."),
                react_1.default.createElement("div", { className: "space-y-6" },
                    react_1.default.createElement(OpInput_1.OpInput, { label: "Nome da Miss\u00E3o", placeholder: "EX: OPERA\u00C7\u00C3O ESPINHO", value: newMesaName, onChange: (e) => setNewMesaName(e.target.value), autoFocus: true }),
                    react_1.default.createElement("div", { className: "flex gap-2 pt-2" },
                        react_1.default.createElement(OpButton_1.OpButton, { variant: "ghost", onClick: () => setIsCreatingMesa(false), className: "flex-1", disabled: loading },
                            react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4 mr-2" }),
                            " Abortar"),
                        react_1.default.createElement(OpButton_1.OpButton, { onClick: confirmCreateMesa, className: "flex-1", disabled: loading || !newMesaName.trim() },
                            loading ? react_1.default.createElement(lucide_react_1.Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4 mr-2" }),
                            "Iniciar")))))),
        react_1.default.createElement("div", { className: "grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10" },
            react_1.default.createElement("div", { className: "bg-op-panel p-8 border border-op-border hover:border-op-red transition-all group relative overflow-hidden" },
                react_1.default.createElement("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity" },
                    react_1.default.createElement(lucide_react_1.FileText, { className: "w-32 h-32" })),
                react_1.default.createElement("h2", { className: "text-xl font-bold mb-2 font-typewriter text-zinc-200 group-hover:text-op-red transition-colors flex items-center gap-2" },
                    react_1.default.createElement(lucide_react_1.Plus, { className: "w-5 h-5" }),
                    " Nova Opera\u00E7\u00E3o"),
                react_1.default.createElement("p", { className: "text-zinc-500 text-sm mb-8 leading-relaxed" }, "Inicie um novo caso. Voc\u00EA assumir\u00E1 o papel de Mestre, controlando a narrativa e as amea\u00E7as."),
                react_1.default.createElement(OpButton_1.OpButton, { onClick: handleOpenCreateModal, disabled: loading, className: "w-full" }, loading ? 'Carregando...' : 'Criar Mesa')),
            react_1.default.createElement("div", { className: "bg-op-panel p-8 border border-op-border hover:border-zinc-500 transition-all group relative" },
                react_1.default.createElement("div", { className: "absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity" },
                    react_1.default.createElement(lucide_react_1.Key, { className: "w-32 h-32" })),
                react_1.default.createElement("h2", { className: "text-xl font-bold mb-2 font-typewriter text-zinc-200 flex items-center gap-2" },
                    react_1.default.createElement(lucide_react_1.Users, { className: "w-5 h-5" }),
                    " Ingressar em Miss\u00E3o"),
                react_1.default.createElement("p", { className: "text-zinc-500 text-sm mb-6 leading-relaxed" }, "Junte-se a uma equipe existente. Insira o c\u00F3digo de acesso fornecido pelo l\u00EDder da opera\u00E7\u00E3o."),
                react_1.default.createElement("div", { className: "flex gap-2 items-end" },
                    react_1.default.createElement(OpInput_1.OpInput, { label: "C\u00D3DIGO DE ACESSO", placeholder: "XXX-XXX", value: joinCode, onChange: (e) => setJoinCode(e.target.value), className: "uppercase font-mono text-center tracking-widest text-lg" }),
                    react_1.default.createElement(OpButton_1.OpButton, { onClick: handleJoin, disabled: loading, variant: "secondary", className: "h-[38px] mb-[1px]" }, "Entrar"))))));
};
exports.Lobby = Lobby;
//# sourceMappingURL=Lobby.js.map