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
exports.OpFileUpload = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_1 = require("../../lib/utils");
const storage_1 = require("../../lib/storage");
const OpFileUpload = ({ label, onUpload, defaultUrl, className }) => {
    const [preview, setPreview] = (0, react_1.useState)(defaultUrl);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const inputRef = (0, react_1.useRef)(null);
    const handleFileChange = async (e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        setLoading(true);
        // Cria preview instantâneo para UX
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        try {
            const uploadedUrl = await (0, storage_1.uploadImage)(file);
            onUpload(uploadedUrl);
        }
        catch (error) {
            alert("Erro no upload");
        }
        finally {
            setLoading(false);
        }
    };
    const clearImage = (e) => {
        e.stopPropagation();
        setPreview(undefined);
        onUpload('');
        if (inputRef.current)
            inputRef.current.value = '';
    };
    return (react_1.default.createElement("div", { className: (0, utils_1.cn)("w-full", className) },
        label && react_1.default.createElement("label", { className: "text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-1 block" }, label),
        react_1.default.createElement("div", { onClick: () => { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: (0, utils_1.cn)("relative border border-dashed border-zinc-700 bg-black/20 rounded cursor-pointer transition-all group overflow-hidden", "hover:border-op-red hover:bg-op-red/5 min-h-[100px] flex items-center justify-center", preview ? "border-solid border-zinc-800" : "") },
            react_1.default.createElement("input", { type: "file", ref: inputRef, onChange: handleFileChange, accept: "image/*", className: "hidden" }),
            loading ? (react_1.default.createElement("div", { className: "flex flex-col items-center gap-2 text-zinc-500" },
                react_1.default.createElement("div", { className: "w-5 h-5 border-2 border-op-red border-t-transparent rounded-full animate-spin" }),
                react_1.default.createElement("span", { className: "text-xs" }, "Enviando..."))) : preview ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("img", { src: preview, alt: "Preview", className: "w-full h-full object-cover max-h-[200px]" }),
                react_1.default.createElement("button", { onClick: clearImage, className: "absolute top-2 right-2 bg-black/80 text-white p-1 rounded hover:bg-op-red transition-colors" },
                    react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" })))) : (react_1.default.createElement("div", { className: "flex flex-col items-center gap-2 text-zinc-600 group-hover:text-op-red transition-colors py-4" },
                react_1.default.createElement(lucide_react_1.Upload, { className: "w-6 h-6" }),
                react_1.default.createElement("span", { className: "text-xs font-bold uppercase" }, "Clique para enviar imagem"))))));
};
exports.OpFileUpload = OpFileUpload;
//# sourceMappingURL=OpFileUpload.js.map