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
exports.ChatPanel = void 0;
const react_1 = __importStar(require("react"));
const game_store_1 = require("../store/game-store");
const ChatPanel = () => {
    const { messages, currentUser } = (0, game_store_1.useGameStore)();
    const bottomRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        var _a;
        (_a = bottomRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    return (react_1.default.createElement("div", { className: "absolute bottom-16 left-4 w-96 max-h-64 overflow-y-auto bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 shadow-xl z-20 backdrop-blur-sm pointer-events-auto" },
        react_1.default.createElement("div", { className: "flex flex-col gap-2" },
            messages.map((msg) => {
                const isRoll = msg.type === 'roll';
                const isMe = msg.user_id === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id);
                return (react_1.default.createElement("div", { key: msg.id, className: `text-sm ${isMe ? 'text-right' : 'text-left'}` },
                    react_1.default.createElement("span", { className: "text-[10px] font-bold text-zinc-500 block mb-0.5" }, isMe ? 'Você' : 'Agente'),
                    isRoll ? (react_1.default.createElement("div", { className: `inline-block bg-zinc-800 border ${msg.content.is_critical ? 'border-yellow-500 text-yellow-500' : 'border-zinc-700'} rounded px-2 py-1` },
                        react_1.default.createElement("span", { className: "font-bold" },
                            "\uD83C\uDFB2 ",
                            msg.content.total),
                        react_1.default.createElement("span", { className: "text-[10px] text-zinc-500 ml-2" },
                            "(",
                            msg.content.details,
                            ")"))) : (react_1.default.createElement("span", { className: "bg-zinc-800/50 px-2 py-1 rounded inline-block text-zinc-300" }, msg.content.text))));
            }),
            react_1.default.createElement("div", { ref: bottomRef }))));
};
exports.ChatPanel = ChatPanel;
//# sourceMappingURL=ChatPanel.js.map