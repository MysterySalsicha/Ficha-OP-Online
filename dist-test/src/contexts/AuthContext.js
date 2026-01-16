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
exports.useAuth = exports.AuthProvider = void 0;
const react_1 = __importStar(require("react"));
const supabase_1 = require("../lib/supabase");
const AuthContext = (0, react_1.createContext)(undefined);
const AuthProvider = ({ children }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Verificação de sessão real
        supabase_1.supabase.auth.getSession().then(({ data: { session } }) => {
            var _a;
            setUser((_a = session === null || session === void 0 ? void 0 : session.user) !== null && _a !== void 0 ? _a : null);
            setLoading(false);
        }).catch((err) => {
            console.error("Erro de Auth:", err);
            setLoading(false);
        });
        const { data: { subscription } } = supabase_1.supabase.auth.onAuthStateChange((_event, session) => {
            var _a;
            setUser((_a = session === null || session === void 0 ? void 0 : session.user) !== null && _a !== void 0 ? _a : null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signOut = async () => {
        await supabase_1.supabase.auth.signOut();
        setUser(null);
    };
    const updateProfile = async (name, avatarUrl) => {
        if (!user)
            return;
        const { data, error } = await supabase_1.supabase.auth.updateUser({
            data: { full_name: name, avatar_url: avatarUrl }
        });
        if (error)
            throw error;
        if (data.user)
            setUser(data.user);
        // Sincroniza com a tabela pública de perfis
        await supabase_1.supabase.from('profiles').upsert({
            id: user.id,
            username: name,
            avatar_url: avatarUrl
        });
    };
    return (react_1.default.createElement(AuthContext.Provider, { value: { user, loading, signOut, updateProfile } }, children));
};
exports.AuthProvider = AuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
//# sourceMappingURL=AuthContext.js.map