"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpInput = void 0;
const react_1 = __importDefault(require("react"));
const utils_1 = require("../../lib/utils");
const OpInput = ({ className, label, ...props }) => {
    return (react_1.default.createElement("div", { className: "flex flex-col gap-1 w-full" },
        label && react_1.default.createElement("label", { className: "text-[10px] font-bold uppercase text-zinc-500 tracking-wider" }, label),
        react_1.default.createElement("input", { className: (0, utils_1.cn)("bg-black/40 border border-zinc-800 text-zinc-200 text-sm px-3 py-2 rounded-sm outline-none transition-all", "focus:border-op-red focus:bg-zinc-900/80 placeholder:text-zinc-700", "disabled:opacity-50 disabled:cursor-not-allowed", className), ...props })));
};
exports.OpInput = OpInput;
//# sourceMappingURL=OpInput.js.map