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
exports.useToast = exports.ToastProvider = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const ToastContext = (0, react_1.createContext)(undefined);
const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = (0, react_1.useState)([]);
    const showToast = (0, react_1.useCallback)((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);
    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    return (react_1.default.createElement(ToastContext.Provider, { value: { showToast } },
        children,
        react_1.default.createElement("div", { className: "fixed bottom-4 right-4 z-[100] flex flex-col gap-2" }, toasts.map((toast) => (react_1.default.createElement("div", { key: toast.id, className: `
              flex items-center gap-3 p-4 rounded shadow-2xl border min-w-[300px] animate-in slide-in-from-right fade-in duration-300
              ${toast.type === 'success' ? 'bg-green-950/90 border-green-800 text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-950/90 border-red-800 text-red-100' : ''}
              ${toast.type === 'info' ? 'bg-zinc-900/90 border-zinc-700 text-zinc-100' : ''}
            ` },
            toast.type === 'success' && react_1.default.createElement(lucide_react_1.CheckCircle, { className: "w-5 h-5 text-green-500" }),
            toast.type === 'error' && react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "w-5 h-5 text-red-500" }),
            toast.type === 'info' && react_1.default.createElement(lucide_react_1.Info, { className: "w-5 h-5 text-blue-500" }),
            react_1.default.createElement("p", { className: "text-sm font-medium flex-1" }, toast.message),
            react_1.default.createElement("button", { onClick: () => removeToast(toast.id), className: "opacity-50 hover:opacity-100" },
                react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" }))))))));
};
exports.ToastProvider = ToastProvider;
const useToast = () => {
    const context = (0, react_1.useContext)(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
exports.useToast = useToast;
//# sourceMappingURL=OpToast.js.map